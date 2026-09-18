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

_ALL_PERMISSIONS: list[str] = sorted(p.value for p in PermissionType)


def _to_boolean_matrix(permission_lists: dict[str, list[str]]) -> dict[str, dict[str, bool]]:
    return {
        role: {
            perm: perm in permission_lists.get(role, [])
            for perm in _ALL_PERMISSIONS
        }
        for role in _DEFAULT_PERMISSIONS
    }


class PermissionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PermissionRepository(db)

    async def get_matrix(
        self, wedding_id: str, current_user: dict,
    ) -> PermissionMatrixResponse:
        permissions = await self.repo.get_by_wedding(wedding_id)
        matrix: dict[str, list[str]] = {
            role: list(defaults)
            for role, defaults in _DEFAULT_PERMISSIONS.items()
        }
        for p in permissions:
            if p.allowed and p.permission not in matrix.get(p.role, []):
                matrix.setdefault(p.role, []).append(p.permission)
            elif not p.allowed and p.permission in matrix.get(p.role, []):
                matrix[p.role].remove(p.permission)

        return PermissionMatrixResponse(
            wedding_id=wedding_id,
            matrix=_to_boolean_matrix(matrix),
        )

    async def has_permission(self, wedding_id: str, role: str, permission: str) -> bool:
        """Check a role's default permission, overridden by wedding-level config.

        'admin' bypasses the matrix entirely (full access).
        """
        if role == "admin":
            return True
        default_allowed = permission in _DEFAULT_PERMISSIONS.get(role, [])
        override = await self.repo.get_by_wedding_role_permission(
            wedding_id, role, permission,
        )
        if override is not None:
            return override.allowed
        return default_allowed

    async def update_permissions(
        self, wedding_id: str, request: PermissionUpdateRequest,
        current_user: dict,
    ) -> PermissionMatrixResponse:
        for permission, allowed in request.permissions.items():
            existing = await self.repo.get_by_wedding_role_permission(
                wedding_id, request.role, permission,
            )
            if existing:
                await self.repo.update(existing.id, allowed=allowed)
            else:
                await self.repo.create(
                    wedding_id=wedding_id,
                    role=request.role,
                    permission=permission,
                    allowed=allowed,
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
            defaults=_to_boolean_matrix(_DEFAULT_PERMISSIONS),
        )
