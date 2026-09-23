import os
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # MongoDB configurations
    mongodb_uri: str
    mongodb_database: str = "tutorly"

    # LLM Provider configurations
    openrouter_api_key: str

    # LangSmith configurations (Optional, defaults to false if not in .env)
    langsmith_tracing: bool = False
    langsmith_api_key: str | None = None
    langsmith_endpoint: str | None = None
    langsmith_project: str = "Topic-Planner-Agent"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def sync_langsmith_env(self) -> "Settings":
        """Automatically pushes LangSmith variables into the environment upon initialization."""
        os.environ["OPENROUTER_API_KEY"] = self.openrouter_api_key
        if self.langsmith_tracing and self.langsmith_api_key:
            os.environ["LANGSMITH_TRACING"] = "true"
            os.environ["LANGSMITH_API_KEY"] = self.langsmith_api_key
            os.environ["LANGSMITH_ENDPOINT"] = self.langsmith_endpoint
            os.environ["LANGSMITH_PROJECT"] = self.langsmith_project
        return self


settings = Settings()