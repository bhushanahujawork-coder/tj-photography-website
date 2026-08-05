import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.base import PermissionType, WeddingRole
from app.repositories.permission_repository import PermissionRepository
from app.schemas.permission import (
    DefaultPermissionsResponse,
    PermissionMatrixResponse,
    PermissionUpdateRequest,
)

logger = logging.getLogger(__name__)

_DEFAULT_PERMISSIONS: dict[str, list[str]] = {
    "client": ["view", "download"],
    "guest": ["view"],
    "editor": ["view", "download", "upload", "edit", "share"],
    "photographer": ["view", "download", "upload", "edit", "delete", "share"],
}


class PermissionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PermissionRepository(db)

    async def get_matrix(
        self, wedding_id: str, current_user: dict,
    ) -> PermissionMatrixResponse:
        permissions = await self.repo.get_by_wedding(wedding_id)
        matrix: dict[str, list[str]] = {}
        for p in permissions:
            if p.role not in matrix:
                matrix[p.role] = []
            if p.allowed:
                matrix[p.role].append(p.permission)

        for role, defaults in _DEFAULT_PERMISSIONS.items():
            if role not in matrix:
                matrix[role] = defaults

        return PermissionMatrixResponse(
            wedding_id=wedding_id,
            permissions=matrix,
        )

    async def update_permissions(
        self, wedding_id: str, request: PermissionUpdateRequest,
        current_user: dict,
    ) -> PermissionMatrixResponse:
        for entry in request.permissions:
            existing = await self.repo.get_by_wedding_role_permission(
                wedding_id, entry.role, entry.permission,
            )
            if existing:
                await self.repo.update(existing.id, allowed=entry.allowed)
            else:
                await self.repo.create(
                    wedding_id=wedding_id,
                    role=entry.role,
                    permission=entry.permission,
                    allowed=entry.allowed,
                )

        logger.info(
            "Permissions updated for wedding %s by user %s",
            wedding_id, current_user.get("sub"),
        )
        return await self.get_matrix(wedding_id, current_user)

    async def get_defaults(
        self, wedding_id: str, current_user: dict,
    ) -> DefaultPermissionsResponse:
        return DefaultPermissionsResponse(
            defaults=_DEFAULT_PERMISSIONS,
        )
