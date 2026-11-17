import operator as op
import os
from typing import Annotated

from langchain_core.messages import HumanMessage, SystemMessage

from langgraph.graph import (
    StateGraph, START, END
)
from langgraph.types import Send
from pydantic import BaseModel, Field
from tavily import AsyncTavilyClient

from agents.tutor.subagents.gatherer.prompts import (
    REFINER_INSTRUCTION, QUERY_GENERATOR_USER_PROMPT, QUERY_GENERATOR_INSTRUCTION
)
from models import get_google_llm
from schemas.topic import Lesson

llm = get_google_llm("gemini-3.1-flash-lite")
tv_client = AsyncTavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))


class ResourcesState(BaseModel):
    """Represents the state of the resource gatherer."""

    familiarity_level: str
    topic_description: str
    lesson: Lesson
    user_remarks: str | None
    queries: list[str] = Field(default_factory=list, description="Queries to search for content.")
    resources: Annotated[dict[str, dict[str, str | float]], op.or_]  = Field(
        default_factory=dict, description="The resources gathered so far."
    )


class Queries(BaseModel):
    """List of queries returned by query generator."""
    queries: list[str] = Field(min_length=1, description="Queries to search for content.")


class Resource(BaseModel):
    """Represents a single resource."""
    url: str = Field(..., description="URL of the resource.")
    score: float = Field(..., description="Relevance score of the resource as returned by Tavily.")
    content: str = Field(..., description="Raw content of the resource.")


class RefinedContent(BaseModel):
    """Refined content of a single resource."""
    content: str = Field(..., description="Refined content of the resource.")


async def query_generator(state: ResourcesState):
    """
    This node generates multiple quesies which will cover several aspects of
    the lesson, and hence search for relevant material.
    """
    system = SystemMessage(content=QUERY_GENERATOR_INSTRUCTION)
    prompt_info = {
        "user_remarks": state.user_remarks,
        "topic_description": state.topic_description,
        "familiarity_level": state.familiarity_level,
        "lesson_title": state.lesson.name,
        "lesson_description": state.lesson.description,
        "modules": '\n'.join([
            f"{i+1} {m.title} {m.description}"
            for i, m in enumerate(state.lesson.modules)
        ])
    }
    user_prompt = HumanMessage(
        content=QUERY_GENERATOR_USER_PROMPT.format(**prompt_info)
    )
    query_llm = llm.with_structured_output(Queries)
    queries = await query_llm.ainvoke([system, user_prompt])
    return {
        "queries": queries.queries # type: ignore
    }


async def query_searcher(query: str):
    """Just searches for the provided query."""
    results = await tv_client.search(
        query=query,
        max_results=8,
        search_depth="basic",
        include_raw_content=True,
        include_usage=True,
    )
    result_list = results["results"]
    result_list.sort(key=lambda res: res["score"])
    final_list = result_list[:4]
    useful_content = {
        result["url"]: {
            "score": result["score"],
            "content": result["raw_content"]
        }
        for result in final_list
        if result["raw_content"] is not None
    }
    return {
        "resources": useful_content
    }


def generator_searcher_edge(state: ResourcesState):
    """An edge to send queries to the searchers."""
    return [
        Send("query_searcher", query)
        for query in state.queries
    ]


def search_agggregator(state: ResourcesState):
    """A node which serves as a synchronization point for all searches."""
    return dict()


def search_refiner_edge(state: ResourcesState):
    """An edge to send the gathered resources to the refiner."""
    return [
        Send("resource_trimmer", Resource(
            url=url, score=val["score"], content=val["content"]) # type: ignore
        )
        for url, val in state.resources.items()
    ]


async def resource_trimmer(resource: Resource):
    """
    This node trims the gathered resources to remove unnecessary clutter while preserving
    the main content.
    """
    system = SystemMessage(content=REFINER_INSTRUCTION)
    user_input = HumanMessage(content=f"Raw resource content:\n\n {resource.content}")
    refiner_llm = llm.with_structured_output(RefinedContent)
    refined_content = await refiner_llm.ainvoke(
        [system, user_input], config={"max_concurrency": 4}
    )
    return {
        "resources": {
            resource.url: {
                "score": resource.score,
                "content": refined_content.content # type: ignore
            }
        }
    }


def build_graph():
    """Builds the resource gatherer graph."""
    graph = StateGraph(state_schema=ResourcesState)
    graph.add_node("query_generator", query_generator)
    graph.add_node("query_searcher", query_searcher) # type: ignore
    graph.add_node("search_aggregator", search_agggregator)
    graph.add_node("resource_trimmer", resource_trimmer) # type: ignore

    graph.add_edge(START, "query_generator")
    graph.add_conditional_edges(
        "query_generator", generator_searcher_edge, ["query_searcher"]
    )
    graph.add_edge("query_searcher", "search_aggregator")
    graph.add_conditional_edges(
        "search_aggregator", search_refiner_edge, ["resource_trimmer"]
    )
    graph.add_edge("resource_trimmer", END)
    compiled_graph = graph.compile()
    return compiled_graph


gatherer = build_graph()
