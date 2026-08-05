from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.permission import (
    DefaultPermissionsResponse,
    PermissionMatrixResponse,
    PermissionUpdateRequest,
)
from app.services.permission_service import PermissionService

router = APIRouter(
    prefix="/api/v1/weddings/{wedding_id}/permissions",
    tags=["Permissions"],
)


async def get_permission_service(
    db: AsyncSession = Depends(get_db_session),
) -> PermissionService:
    return PermissionService(db)


@router.get(
    "/",
    response_model=PermissionMatrixResponse,
    operation_id="permissions_get_matrix",
    summary="Get the permission matrix for a wedding",
)
async def get_permission_matrix(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    permission_service: PermissionService = Depends(get_permission_service),
) -> PermissionMatrixResponse:
    return await permission_service.get_matrix(wedding_id, current_user)


@router.put(
    "/",
    response_model=PermissionMatrixResponse,
    operation_id="permissions_update",
    summary="Update permissions for a wedding role",
)
async def update_permissions(
    wedding_id: str,
    request: PermissionUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    permission_service: PermissionService = Depends(get_permission_service),
) -> PermissionMatrixResponse:
    return await permission_service.update_permissions(wedding_id, request, current_user)


@router.get(
    "/defaults",
    response_model=DefaultPermissionsResponse,
    operation_id="permissions_get_defaults",
    summary="Get default permissions for each role",
)
async def get_default_permissions(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    permission_service: PermissionService = Depends(get_permission_service),
) -> DefaultPermissionsResponse:
    return await permission_service.get_defaults(wedding_id, current_user)
