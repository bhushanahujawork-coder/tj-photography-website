from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.download import Download
from app.repositories.base import BaseRepository


class DownloadRepository(BaseRepository[Download]):
    def __init__(self, session):
        super().__init__(Download, session)

    async def list_with_relations(self, user_id: str | None = None, skip: int = 0, limit: int = 100) -> list[Download]:
        """List downloads with wedding + user relations eagerly loaded.

        When `user_id` is provided only that user's records are returned.
        `None` (admin path) returns records across users.
        """
        stmt = (
            select(Download)
            .options(selectinload(Download.wedding), selectinload(Download.user))
            .offset(skip)
            .limit(limit)
        )
        if user_id is not None:
            stmt = stmt.where(Download.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
