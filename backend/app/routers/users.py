from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.common import SuccessResponse
from app.schemas.permission import PermissionResponse
from app.schemas.user import ChangePasswordRequest, UserProfileResponse, UserUpdateRequest
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


async def get_user_service(
    db: AsyncSession = Depends(get_db_session),
) -> UserService:
    return UserService(db)


@router.get(
    "/profile",
    response_model=UserProfileResponse,
    operation_id="users_get_profile",
    summary="Get current user profile with stats",
)
async def get_profile(
    current_user: dict = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    return await user_service.get_profile(current_user)


@router.put(
    "/profile",
    response_model=UserProfileResponse,
    operation_id="users_update_profile",
    summary="Update current user profile",
)
async def update_profile(
    request: UserUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    return await user_service.update_profile(current_user, request)


@router.put(
    "/password",
    response_model=SuccessResponse,
    operation_id="users_change_password",
    summary="Change current user password",
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> SuccessResponse:
    return await user_service.change_password(current_user, request)


@router.get(
    "/permissions",
    response_model=list[PermissionResponse],
    operation_id="users_get_permissions",
    summary="Get user's permissions across weddings",
)
async def get_permissions(
    current_user: dict = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> list[PermissionResponse]:
    return await user_service.get_permissions(current_user)
