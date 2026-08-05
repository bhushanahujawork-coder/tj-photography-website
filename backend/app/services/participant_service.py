import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.models.base import ParticipantStatus
from app.repositories.participant_repository import ParticipantRepository
from app.repositories.user_repository import UserRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.participant import ParticipantResponse
from app.schemas.common import SuccessResponse

logger = logging.getLogger(__name__)


class ParticipantService:
    def __init__(self, db: AsyncSession):
        self.participant_repo = ParticipantRepository(db)
        self.wedding_repo = WeddingRepository(db)
        self.user_repo = UserRepository(db)

    async def invite(self, wedding_id: str, data, current_user: dict) -> ParticipantResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        participant = await self.participant_repo.create(
            wedding_id=wedding_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            role=data.role or "guest",
            status=ParticipantStatus.PENDING.value,
            invited_by=current_user.get("sub"),
            invited_at=datetime.now(timezone.utc),
        )
        logger.info("Participant invited: %s to wedding %s", participant.id, wedding_id)
        return ParticipantResponse.model_validate(participant)

    async def bulk_invite(self, wedding_id: str, data, current_user: dict) -> list[ParticipantResponse]:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        results = []
        for invite_data in data.participants:
            participant = await self.participant_repo.create(
                wedding_id=wedding_id,
                name=invite_data.name,
                email=invite_data.email,
                phone=invite_data.phone,
                role=invite_data.role or "guest",
                status=ParticipantStatus.PENDING.value,
                invited_by=current_user.get("sub"),
                invited_at=datetime.now(timezone.utc),
            )
            results.append(ParticipantResponse.model_validate(participant))

        logger.info("Bulk invited %d participants to wedding %s", len(results), wedding_id)
        return results

    async def list_participants(self, wedding_id: str, current_user: dict) -> list[ParticipantResponse]:
        items, _ = await self.participant_repo.get_multi(wedding_id=wedding_id)
        return [ParticipantResponse.model_validate(p) for p in items]

    async def update_role(
        self, participant_id: str, data, current_user: dict,
    ) -> ParticipantResponse:
        participant = await self.participant_repo.get(participant_id)
        if not participant:
            raise NotFoundError(message="Participant not found")

        updated = await self.participant_repo.update(
            participant_id, role=data.role,
        )
        logger.info("Participant %s role updated to %s", participant_id, data.role)
        return ParticipantResponse.model_validate(updated)

    async def remove(self, participant_id: str, current_user: dict) -> None:
        participant = await self.participant_repo.get(participant_id)
        if not participant:
            raise NotFoundError(message="Participant not found")
        await self.participant_repo.delete(participant_id)
        logger.info("Participant removed: %s", participant_id)

    async def accept_invitation(self, participant_id: str, data) -> ParticipantResponse:
        participant = await self.participant_repo.get(participant_id)
        if not participant:
            raise NotFoundError(message="Participant not found")

        if participant.status != ParticipantStatus.PENDING.value:
            raise ConflictError(message="Invitation is not pending")

        updated = await self.participant_repo.update(
            participant_id,
            status=ParticipantStatus.ACCEPTED.value,
            accepted_at=datetime.now(timezone.utc),
        )
        logger.info("Participant %s accepted invite", participant_id)
        return ParticipantResponse.model_validate(updated)

    async def resend_invitation(self, participant_id: str, current_user: dict) -> SuccessResponse:
        participant = await self.participant_repo.get(participant_id)
        if not participant:
            raise NotFoundError(message="Participant not found")
        logger.info("Invite resent to %s", participant.email or participant.phone)
        return SuccessResponse(message="Invitation resent")
