from collections.abc import AsyncGenerator
from typing import Any

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import decode_token
from app.models.base import ParticipantStatus
from app.repositories.participant_repository import ParticipantRepository
from app.repositories.wedding_repository import WeddingRepository
from app.services.permission_service import PermissionService

get_db_session = get_db


async def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedError(message="Invalid authorization header format")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
    except ValueError:
        raise UnauthorizedError(message="Invalid or expired token")
    if payload.get("type") != "access":
        raise UnauthorizedError(message="Invalid token type")
    return payload


async def get_current_active_user(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if not current_user.get("is_active", True):
        raise UnauthorizedError(message="User account is inactive")
    return current_user


async def get_optional_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any] | None:
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
    except ValueError:
        return None
    return payload


def require_role(*roles: str):
    async def role_checker(
        current_user: dict[str, Any] = Depends(get_current_active_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role", "")
        if user_role not in roles:
            raise ForbiddenError(
                message=f"Role '{user_role}' does not have permission. Required: {', '.join(roles)}"
            )
        return current_user
    return role_checker


def require_permission(permission: str):
    async def permission_checker(
        current_user: dict[str, Any] = Depends(get_current_active_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role", "")
        if user_role not in ("admin", "photographer") and permission in ("create", "update", "delete", "upload"):
            raise ForbiddenError(
                message=f"Permission '{permission}' denied for role '{user_role}'"
            )
        return current_user
    return permission_checker


async def resolve_wedding_role(
    db: AsyncSession, wedding_id: str, current_user: dict[str, Any]
) -> str:
    """Resolve the caller's role within a wedding.

    Returns 'admin' for platform admins, 'photographer' for the wedding owner,
    or the participant role for accepted participants. Raises otherwise.
    """
    if current_user.get("role") == "admin":
        return "admin"

    wedding = await WeddingRepository(db).get(wedding_id)
    if not wedding:
        raise NotFoundError(message="Wedding not found")
    if wedding.photographer_id == current_user.get("sub"):
        return "photographer"

    participant = await ParticipantRepository(db).get_by_wedding_user(
        wedding_id, current_user.get("sub", "")
    )
    if participant and participant.status == ParticipantStatus.ACCEPTED.value:
        return participant.role

    raise ForbiddenError(message="You do not have access to this wedding")


def require_wedding_access(permission: str):
    """Dependency ensuring the caller can access a wedding with a permission.

    Usage: ``wedding_id: str, current_user: dict = Depends(require_wedding_access("view"))``
    """

    async def checker(
        wedding_id: str,
        current_user: dict[str, Any] = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db_session),
    ) -> dict[str, Any]:
        role = await resolve_wedding_role(db, wedding_id, current_user)
        allowed = await PermissionService(db).has_permission(
            wedding_id, role, permission,
        )
        if not allowed:
            raise ForbiddenError(
                message=f"Permission '{permission}' denied for role '{role}'"
            )
        return current_user

    return checker
