from pymongo import AsyncMongoClient
from core.config import settings


class MongoDB:
    """MongoDB client wrapper for asynchronous operations using AsyncMongoClient."""
    def __init__(self):
        self._client: AsyncMongoClient | None = None

    @property
    def client(self) -> AsyncMongoClient:
        if self._client is None:
            self._client = AsyncMongoClient(settings.mongodb_uri)
        return self._client

    @property
    def database(self):
        return self.client[settings.mongodb_database]

    def get_collection(self, collection_name: str):
        return self.database[collection_name]

    async def connect(self):
        await self.client.admin.command("ping")

    async def close(self):
        if self._client is not None:
            await self._client.close()
            self._client = None


mongodb = MongoDB()
