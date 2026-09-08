from typing import Optional

from sqlalchemy import select

from app.models.participant import Participant
from app.repositories.base import BaseRepository


class ParticipantRepository(BaseRepository[Participant]):
    def __init__(self, session):
        super().__init__(Participant, session)

    async def get_by_wedding_user(
        self, wedding_id: str, user_id: str
    ) -> Optional[Participant]:
        stmt = select(Participant).where(
            Participant.wedding_id == wedding_id,
            Participant.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
