from sqlalchemy import func, select, update

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, session):
        super().__init__(Notification, session)

    async def get_by_user_id(self, user_id: str) -> list[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def mark_all_read(self, user_id: str) -> int:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read == False)
            .values(read=True)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount

    async def count_unread(self, user_id: str) -> int:
        stmt = (
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id, Notification.read == False)
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
