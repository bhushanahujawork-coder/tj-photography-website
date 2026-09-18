from typing import Optional

from sqlalchemy import select

from app.models.photo_reaction import PhotoReaction
from app.repositories.base import BaseRepository


class PhotoReactionRepository(BaseRepository[PhotoReaction]):
    def __init__(self, session):
        super().__init__(PhotoReaction, session)

    async def get_by_photo_user(
        self, photo_id: str, user_id: str,
    ) -> Optional[PhotoReaction]:
        stmt = select(PhotoReaction).where(
            PhotoReaction.photo_id == photo_id,
            PhotoReaction.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_for_photo(self, photo_id: str) -> int:
        stmt = select(PhotoReaction).where(PhotoReaction.photo_id == photo_id)
        result = await self.session.execute(stmt)
        return len(list(result.scalars().all()))