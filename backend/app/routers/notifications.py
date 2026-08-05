from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.common import SuccessResponse
from app.schemas.notification import NotificationResponse, NotificationUpdateRequest
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


async def get_notification_service(
    db: AsyncSession = Depends(get_db_session),
) -> NotificationService:
    return NotificationService(db)


@router.get(
    "/",
    response_model=list[NotificationResponse],
    operation_id="notifications_list",
    summary="List current user's notifications",
)
async def list_notifications(
    current_user: dict = Depends(get_current_active_user),
    notification_service: NotificationService = Depends(get_notification_service),
) -> list[NotificationResponse]:
    return await notification_service.list_notifications(current_user)


@router.put(
    "/{notification_id}",
    response_model=NotificationResponse,
    operation_id="notifications_update",
    summary="Mark a notification as read or unread",
)
async def update_notification(
    notification_id: str,
    request: NotificationUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    notification_service: NotificationService = Depends(get_notification_service),
) -> NotificationResponse:
    return await notification_service.update(notification_id, request, current_user)


@router.put(
    "/mark-all-read",
    response_model=SuccessResponse,
    operation_id="notifications_mark_all_read",
    summary="Mark all notifications as read",
)
async def mark_all_read(
    current_user: dict = Depends(get_current_active_user),
    notification_service: NotificationService = Depends(get_notification_service),
) -> SuccessResponse:
    return await notification_service.mark_all_read(current_user)


@router.get(
    "/unread-count",
    response_model=dict,
    operation_id="notifications_unread_count",
    summary="Get unread notification count",
)
async def get_unread_count(
    current_user: dict = Depends(get_current_active_user),
    notification_service: NotificationService = Depends(get_notification_service),
) -> dict:
    return await notification_service.get_unread_count(current_user)
