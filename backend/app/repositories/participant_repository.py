from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.base import ParticipantStatus
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

    async def get_by_wedding_contact(
        self, wedding_id: str, phone: str | None = None, email: str | None = None
    ) -> Optional[Participant]:
        if not phone and not email:
            return None
        conditions = [Participant.wedding_id == wedding_id]
        if phone:
            conditions.append(Participant.phone == phone)
        if email:
            conditions.append(Participant.email == email)
        stmt = select(Participant).where(*conditions)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_unclaimed_by_phone(self, phone: str) -> list[Participant]:
        """Participant invitation rows matching a phone that no user owns yet."""
        stmt = select(Participant).where(
            Participant.phone == phone,
            Participant.user_id.is_(None),
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_accepted_by_user(self, user_id: str) -> list[Participant]:
        stmt = (
            select(Participant)
            .options(selectinload(Participant.wedding))
            .where(
                Participant.user_id == user_id,
                Participant.status == ParticipantStatus.ACCEPTED.value,
            )
            .order_by(Participant.accepted_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
