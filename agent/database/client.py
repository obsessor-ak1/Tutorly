from pymongo import AsyncMongoClient
from core.config import settings


class MongoDB:
    """MongoDB client wrapper for asynchronous operations."""
    def __init__(self):
        self.client = AsyncMongoClient(
            settings.mongodb_uri
        )
        self.database = self.client[
            settings.mongodb_database
        ]

    async def connect(self):
        await self.client.admin.command("ping")

    async def close(self):
        await self.client.close()


mongodb = MongoDB()