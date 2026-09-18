from typing import Optional

from sqlalchemy import select

from app.models.face_profile import FaceProfile
from app.repositories.base import BaseRepository


class FaceProfileRepository(BaseRepository[FaceProfile]):
    def __init__(self, session):
        super().__init__(FaceProfile, session)

    async def get_multi_by_wedding(
        self, wedding_id: str, skip: int = 0, limit: int = 200,
    ) -> tuple[list[FaceProfile], int]:
        stmt = (
            select(FaceProfile)
            .where(FaceProfile.wedding_id == wedding_id)
            .order_by(FaceProfile.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        return items, len(items)

    async def get_matching_wedding(self, face_profile_id: str) -> Optional[FaceProfile]:
        stmt = select(FaceProfile).where(FaceProfile.id == face_profile_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()