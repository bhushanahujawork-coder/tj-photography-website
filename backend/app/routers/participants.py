from fastapi import APIRouter, Depends, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.common import SuccessResponse
from app.schemas.participant import (
    ParticipantBulkInviteRequest,
    ParticipantInviteRequest,
    ParticipantResponse,
    ParticipantStatusUpdate,
    ParticipantUpdateRequest,
)
from app.services.participant_service import ParticipantService

router = APIRouter(
    prefix="/api/v1/weddings/{wedding_id}/participants",
    tags=["Participants"],
)


async def get_participant_service(
    db: AsyncSession = Depends(get_db_session),
) -> ParticipantService:
    return ParticipantService(db)


@router.get(
    "/",
    response_model=list[ParticipantResponse],
    operation_id="participants_list",
    summary="List all participants for a wedding",
)
async def list_participants(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    participant_service: ParticipantService = Depends(get_participant_service),
) -> list[ParticipantResponse]:
    return await participant_service.list_participants(wedding_id, current_user)


@router.post(
    "/",
    response_model=ParticipantResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="participants_invite",
    summary="Invite a participant to a wedding",
)
async def invite_participant(
    wedding_id: str,
    request: ParticipantInviteRequest,
    current_user: dict = Depends(get_current_active_user),
    participant_service: ParticipantService = Depends(get_participant_service),
) -> ParticipantResponse:
    return await participant_service.invite(wedding_id, request, current_user)


@router.post(
    "/bulk",
    response_model=list[ParticipantResponse],
    status_code=status.HTTP_201_CREATED,
    operation_id="participants_bulk_invite",
    summary="Bulk invite participants to a wedding",
)
async def bulk_invite_participants(
    wedding_id: str,
    request: ParticipantBulkInviteRequest,
    current_user: dict = Depends(get_current_active_user),
    participant_service: ParticipantService = Depends(get_participant_service),
) -> list[ParticipantResponse]:
    return await participant_service.bulk_invite(wedding_id, request, current_user)


@router.put(
    "/{participant_id}",
    response_model=ParticipantResponse,
    operation_id="participants_update",
    summary="Update participant role",
)
async def update_participant(
    wedding_id: str,
    participant_id: str,
    request: ParticipantUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    participant_service: ParticipantService = Depends(get_participant_service),
) -> ParticipantResponse:
    return await participant_service.update_role(participant_id, request, current_user)


@router.delete(
    "/{participant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="participants_remove",
    summary="Remove a participant from a wedding",
)
async def remove_participant(
    wedding_id: str,
    participant_id: str,
    current_user: dict = Depends(get_current_active_user),
    participant_service: ParticipantService = Depends(get_participant_service),
) -> None:
    await participant_service.remove(participant_id, current_user)


@router.post(
    "/{participant_id}/accept",
    response_model=ParticipantResponse,
    operation_id="participants_accept",
    summary="Accept or decline a participation invitation",
)
async def accept_invitation(
    wedding_id: str,
    participant_id: str,
    request: ParticipantStatusUpdate,
    participant_service: ParticipantService = Depends(get_participant_service),
) -> ParticipantResponse:
    return await participant_service.accept_invitation(participant_id, request)


@router.post(
    "/{participant_id}/resend",
    response_model=SuccessResponse,
    operation_id="participants_resend",
    summary="Resend invitation to a participant",
)
async def resend_invitation(
    wedding_id: str,
    participant_id: str,
    current_user: dict = Depends(get_current_active_user),
    participant_service: ParticipantService = Depends(get_participant_service),
) -> SuccessResponse:
    return await participant_service.resend_invitation(participant_id, current_user)
