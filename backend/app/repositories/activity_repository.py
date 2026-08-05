from sqlalchemy import select

from app.models.activity import Activity
from app.repositories.base import BaseRepository


class ActivityRepository(BaseRepository[Activity]):
    def __init__(self, session):
        super().__init__(Activity, session)

    async def get_recent(self, limit: int = 10) -> list[Activity]:
        stmt = (
            select(Activity)
            .order_by(Activity.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_wedding(
        self, wedding_id: str, skip: int = 0, limit: int = 50,
    ) -> tuple[list[Activity], int]:
        from sqlalchemy import func

        count_stmt = (
            select(func.count(Activity.id))
            .where(Activity.wedding_id == wedding_id)
        )
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Activity)
            .where(Activity.wedding_id == wedding_id)
            .order_by(Activity.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total
