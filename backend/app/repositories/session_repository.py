from typing import Optional

from sqlalchemy import select

from app.models.session import Session
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    def __init__(self, session):
        super().__init__(Session, session)

    async def get_by_token(self, token: str) -> Optional[Session]:
        stmt = select(Session).where(Session.token == token)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_refresh_token(self, refresh_token: str) -> Optional[Session]:
        stmt = select(Session).where(Session.refresh_token == refresh_token)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_user_sessions(self, user_id: str) -> None:
        stmt = select(Session).where(Session.user_id == user_id)
        result = await self.session.execute(stmt)
        sessions = result.scalars().all()
        for s in sessions:
            await self.session.delete(s)
        await self.session.flush()
