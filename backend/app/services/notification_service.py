import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.schemas.common import SuccessResponse
from app.schemas.notification import NotificationResponse, NotificationUpdateRequest

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def list_notifications(self, current_user: dict) -> list[NotificationResponse]:
        notifications = await self.repo.get_by_user_id(current_user["sub"])
        return [NotificationResponse.model_validate(n) for n in notifications]

    async def update(
        self, notification_id: str, request: NotificationUpdateRequest,
        current_user: dict,
    ) -> NotificationResponse:
        notification = await self.repo.get(notification_id)
        if not notification:
            raise NotFoundError(message="Notification not found")
        notification.read = request.read
        await self.db.flush()
        await self.db.refresh(notification)
        return NotificationResponse.model_validate(notification)

    async def mark_all_read(self, current_user: dict) -> SuccessResponse:
        count = await self.repo.mark_all_read(current_user["sub"])
        logger.info("Marked %d notifications as read for user %s", count, current_user["sub"])
        return SuccessResponse(message=f"{count} notifications marked as read")

    async def get_unread_count(self, current_user: dict) -> dict:
        count = await self.repo.count_unread(current_user["sub"])
        return {"count": count}
