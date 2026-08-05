from typing import Optional

from sqlalchemy import select

from app.models.share_link import ShareLink
from app.repositories.base import BaseRepository


class ShareLinkRepository(BaseRepository[ShareLink]):
    def __init__(self, session):
        super().__init__(ShareLink, session)

    async def get_by_code(self, code: str) -> Optional[ShareLink]:
        stmt = select(ShareLink).where(ShareLink.code == code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
