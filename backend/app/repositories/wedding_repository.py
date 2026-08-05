from typing import Optional

from sqlalchemy import or_, select

from app.models.wedding import Wedding
from app.repositories.base import BaseRepository


class WeddingRepository(BaseRepository[Wedding]):
    def __init__(self, session):
        super().__init__(Wedding, session)

    async def get_by_code(self, code: str) -> Optional[Wedding]:
        stmt = select(Wedding).where(Wedding.wedding_code == code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_photographer_weddings(
        self, photographer_id: str, skip: int = 0, limit: int = 100, **filters
    ) -> tuple[list[Wedding], int]:
        base_filters = {"photographer_id": photographer_id}
        base_filters.update(
            {k: v for k, v in filters.items() if v is not None}
        )
        return await self.get_multi(skip=skip, limit=limit, **base_filters)
