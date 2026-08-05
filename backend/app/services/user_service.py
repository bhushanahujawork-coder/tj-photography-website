import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.core.security import hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.common import SuccessResponse
from app.schemas.permission import PermissionResponse
from app.schemas.settings import StorageUsageResponse
from app.schemas.user import UserProfileResponse, UserResponse, UserUpdateRequest

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def get_profile(self, current_user: dict) -> UserProfileResponse:
        user_id = current_user.get("sub")
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        storage = user.storage_usage
        storage_usage = StorageUsageResponse(
            used_bytes=storage.total_bytes if storage else 0,
            limit_bytes=0,
            photo_count=storage.photo_count if storage else 0,
            video_count=storage.video_count if storage else 0,
            album_count=0,
            used_percentage=0.0,
        )

        return UserProfileResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            avatar_url=user.avatar_url,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
            storage_usage=storage_usage,
            stats={},
        )

    async def update_profile(self, current_user: dict, data: UserUpdateRequest) -> UserProfileResponse:
        user_id = current_user.get("sub")
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        await self.user_repo.update(
            user_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            avatar_url=data.avatar_url,
        )
        logger.info("Profile updated for user %s", user_id)
        return await self.get_profile(current_user)

    async def change_password(self, current_user: dict, data) -> SuccessResponse:
        user_id = current_user.get("sub")
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        if not verify_password(data.current_password, user.password_hash):
            raise ValidationError(message="Current password is incorrect")

        await self.user_repo.update(user_id, password_hash=hash_password(data.new_password))
        logger.info("Password changed for user %s", user_id)
        return SuccessResponse(message="Password changed successfully")

    async def update_preferences(self, current_user: dict, data) -> None:
        user_id = current_user.get("sub")
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        current_meta = user._metadata or {}
        current_meta.update(
            {
                "language": data.language,
                "timezone": data.timezone,
                "notifications": data.notifications,
            }
        )
        await self.user_repo.update(user_id, _metadata=current_meta)
        logger.info("Preferences updated for user %s", user_id)

    async def get_permissions(self, current_user: dict) -> list[PermissionResponse]:
        user_id = current_user.get("sub")
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")
        return [
            PermissionResponse(
                wedding_id="*",
                role=user.role,
                permissions=["view", "download"],
            )
        ]

    async def get_storage_usage(self, current_user: dict) -> StorageUsageResponse:
        user_id = current_user.get("sub")
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError(message="User not found")

        storage = user.storage_usage
        used = storage.total_bytes if storage else 0
        return StorageUsageResponse(
            used_bytes=used,
            limit_bytes=0,
            photo_count=storage.photo_count if storage else 0,
            video_count=storage.video_count if storage else 0,
            album_count=0,
            used_percentage=0.0,
        )
