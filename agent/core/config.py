import os
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_database: str = "tutorly"

    pinecone_api_key: str | None = None
    pinecone_index_host: str | None = None

    openrouter_api_key: str | None = None
    openrouter_model: str | None = None
    google_api_key: str | None = None
    google_default_model: str | None = None
    groq_api_key: str | None
    tavily_api_key: str | None = None

    langsmith_tracing: bool = False
    langsmith_api_key: str | None = None
    langsmith_endpoint: str | None = None
    langsmith_project: str = "Topic-Planner-Agent"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def sync_env(self):
        if self.openrouter_api_key:
            os.environ["OPENROUTER_API_KEY"] = self.openrouter_api_key

        if self.groq_api_key:
            os.environ["GROQ_API_KEY"] = self.groq_api_key

        if self.tavily_api_key:
            os.environ["TAVILY_API_KEY"] = self.tavily_api_key

        if self.pinecone_index_host:
            os.environ["PINECONE_INDEX_HOST"] = self.pinecone_index_host
            os.environ["PINECONE_API_KEY"] = self.pinecone_api_key
            
        if self.langsmith_tracing and self.langsmith_api_key:
            os.environ["LANGSMITH_TRACING"] = "true"
            os.environ["LANGSMITH_API_KEY"] = self.langsmith_api_key

            if self.langsmith_endpoint:
                os.environ["LANGSMITH_ENDPOINT"] = self.langsmith_endpoint

            os.environ["LANGSMITH_PROJECT"] = self.langsmith_project

        return self


settings = Settings()