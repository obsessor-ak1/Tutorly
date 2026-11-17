"""Thread-scoped Pinecone storage for Tutorly.

The Pinecone client, embedding model, LLM, and LangChain vector-store wrapper
are shared and lazily initialized. Each PineconeStoreManager instance carries
only the thread-specific namespace and document-processing configuration.
"""

import asyncio
import os
import re
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import MarkdownHeaderTextSplitter
from pinecone import Pinecone
from pydantic import BaseModel, Field

from agents.utils.basic_prompts import QUERY_EXPANSION
from models import get_google_llm

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "tutorly-docs")
EMBEDDING_MODEL = os.getenv("GOOGLE_EMBEDDING_MODEL", "gemini-embedding-2")
QUERY_EXPANSION_MODEL = os.getenv("TUTORLY_QUERY_EXPANSION_MODEL", "gemini-2.5-flash")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class SearchQueries(BaseModel):
    """Queries generated to improve retrieval recall."""

    queries: list[str] = Field(
        min_length=4,
        description="At least four alternative search queries.",
    )


def get_pinecone_client() -> Pinecone:
    """Return the process-wide Pinecone client."""
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        raise RuntimeError("PINECONE_API_KEY is not set.")
    return Pinecone(api_key=PINECONE_API_KEY)


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """Return the process-wide Google embedding model."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set.")
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        api_key=GOOGLE_API_KEY # type: ignore
    )


def get_vector_store() -> PineconeVectorStore:
    """Return one shared vector-store wrapper for the configured index."""
    host = os.getenv("PINECONE_INDEX_HOST")

    if not host:
        raise RuntimeError("PINECONE_INDEX_HOST is missing")

    index = get_pinecone_client().IndexAsyncio(host=host)
    return PineconeVectorStore(
        index=index,
        embedding=get_embeddings(),
    )


def get_query_expansion_llm():
    """Return the process-wide query-expansion LLM."""
    return get_google_llm(model_name=QUERY_EXPANSION_MODEL)


def _make_namespace(thread_id: str) -> str:
    """Create a stable, Pinecone-safe namespace for one tutoring thread."""
    # Thread IDs are normally UUIDs. Sanitize other caller-provided IDs too.
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "-", thread_id).strip("-_")
    if not safe_id:
        raise ValueError("thread_id must contain at least one alphanumeric character.")
    # Keep the namespace comfortably short, even for externally supplied IDs.
    safe_id = safe_id[:48]
    return f"tutorly-{safe_id}"


class PineconeStoreManager:
    """Thread-scoped operations over a shared Pinecone vector store."""

    def __init__(self, thread_id: str):
        if not isinstance(thread_id, str) or not thread_id.strip():
            raise ValueError("A non-empty LangGraph thread_id is required.")

        self.thread_id = thread_id
        self.namespace = _make_namespace(thread_id)
        self.store = get_vector_store()
        self.splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=[
                ("#", "heading_1"),
                ("##", "heading_2"),
                ("###", "heading_3"),
                ("####", "heading_4"),
            ]
        )

    async def add_source(self, source: str, page: str) -> list[str]:
        """Split and upsert a source into this thread's namespace.

        Returns the deterministic IDs assigned to the chunks. Re-ingesting
        identical content from the same source overwrites the same vectors.
        """
        if not source.strip():
            raise ValueError("source must not be empty.")
        if not page.strip():
            return []

        chunks = self.splitter.split_text(page)
        if not chunks:
            return []

        ids: list[str] = []
        for index, chunk in enumerate(chunks):
            chunk.metadata.update(
                {
                    "source": source,
                    "thread_id": self.thread_id,
                }
            )
            chunk_id = str(
                uuid5(
                    NAMESPACE_URL,
                    f"{self.thread_id}:{source}:{index}:{chunk.page_content}",
                )
            )
            chunk.metadata["chunk_id"] = chunk_id
            ids.append(chunk_id)

        await self.store.aadd_documents(
            documents=chunks,
            ids=ids,
            namespace=self.namespace,
        )
        return ids

    async def _expand_queries(self, initial_query: str) -> list[str]:
        """Generate alternative queries while retaining the original query."""
        query_expander = get_query_expansion_llm().with_structured_output(
            SearchQueries
        )
        result = await query_expander.ainvoke(
            [
                SystemMessage(content=QUERY_EXPANSION),
                HumanMessage(content=f"Query:\n{initial_query}"),
            ]
        )

        if isinstance(result, SearchQueries):
            alternatives = result.queries
        elif isinstance(result, dict):
            alternatives = SearchQueries.model_validate(result).queries
        else:
            raise TypeError(
                "Query expansion returned an unexpected result: "
                f"{type(result).__name__}"
            )

        # Remove duplicates while preserving order.
        return list(dict.fromkeys([initial_query, *alternatives]))

    @staticmethod
    def _filter_and_rank_results(
        batches: list[list[tuple[Document, float]]],
        max_results: int = 5,
    ) -> list[Document]:
        """Fuse ranked result batches using reciprocal rank fusion (RRF)."""
        fused_results: dict[str, dict[str, Any]] = {}
        rrf_k = 60

        for batch in batches:
            seen_in_query: set[str] = set()

            for rank, (document, similarity) in enumerate(batch, start=1):
                doc_id = document.metadata.get("chunk_id")

                # Chunks created by add_source always have chunk_id metadata.
                # Skip malformed/legacy records rather than merging them all
                # under the same None key.
                if not isinstance(doc_id, str) or not doc_id:
                    continue
                if doc_id in seen_in_query:
                    continue

                seen_in_query.add(doc_id)

                if doc_id not in fused_results:
                    fused_results[doc_id] = {
                        "document": document,
                        "rrf_score": 0.0,
                        "best_similarity": similarity,
                    }

                fused_results[doc_id]["rrf_score"] += 1.0 / (rrf_k + rank)
                fused_results[doc_id]["best_similarity"] = max(
                    fused_results[doc_id]["best_similarity"],
                    similarity,
                )

        ranked_results = sorted(
            fused_results.values(),
            key=lambda item: (
                item["rrf_score"],
                item["best_similarity"],
            ),
            reverse=True,
        )
        return [
            item["document"]
            for item in ranked_results[:max_results]
        ]

    async def fetch_documents(
        self,
        init_query: str,
        max_results: int = 5,
        expand_query: bool = True,
        exclude_ids: list[str] | None = None,
    ) -> list[Document]:
        """Retrieve and RRF-rank relevant chunks from this thread only."""
        if not init_query.strip():
            return []
        if max_results <= 0:
            return []

        queries = (
            await self._expand_queries(init_query)
            if expand_query
            else [init_query]
        )

        pinecone_filter: dict[str, Any] | None = None
        if exclude_ids:
            pinecone_filter = {
                "chunk_id": {"$nin": exclude_ids},
            }

        # Namespace provides the primary thread isolation. The metadata
        # thread_id filter is retained as defense-in-depth.
        if pinecone_filter is None:
            pinecone_filter = {}
        pinecone_filter["thread_id"] = {"$eq": self.thread_id}

        tasks = [
            self.store.asimilarity_search_with_score(
                query,
                k=max(4, max_results),
                filter=pinecone_filter,
                namespace=self.namespace,
            )
            for query in queries
        ]

        batches = await asyncio.gather(*tasks)
        return self._filter_and_rank_results(
            batches,
            max_results=max_results,
        )
