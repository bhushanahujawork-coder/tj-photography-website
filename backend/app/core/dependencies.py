from collections.abc import AsyncGenerator
from typing import Any

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_token

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
