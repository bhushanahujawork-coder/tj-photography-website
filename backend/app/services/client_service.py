import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.participant_repository import ParticipantRepository
from app.schemas.wedding import WeddingResponse

logger = logging.getLogger(__name__)


class ClientService:
    """Business logic for the guest/client dashboard (Meri Galleries)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.participant_repo = ParticipantRepository(db)

    async def list_galleries(self, current_user: dict) -> list[WeddingResponse]:
        """Every wedding the calling client is an accepted participant of.

        Participant rows are created from two sources:
          * a share-level OTP login (share_code) — auto-join,
          * a navbar OTP login (phone-only) — claims a phone invitation.
        """
        sub = current_user.get("sub")
        if not sub:
            return []

        participants = await self.participant_repo.get_accepted_by_user(sub)
        seen: dict[str, object] = {}
        for p in participants:
            if p.wedding_id not in seen:
                seen[p.wedding_id] = p

        galleries: list[WeddingResponse] = []
        for p in seen.values():
            if getattr(p, "wedding", None) is not None:
                galleries.append(WeddingResponse.model_validate(p.wedding))

        logger.info("Client %s has access to %d gallery(ies)", sub, len(galleries))
        return galleries