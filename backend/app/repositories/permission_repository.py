from typing import Optional

from sqlalchemy import select

from app.models.permission import Permission
from app.repositories.base import BaseRepository


class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, session):
        super().__init__(Permission, session)

    async def get_by_wedding(self, wedding_id: str) -> list[Permission]:
        stmt = select(Permission).where(Permission.wedding_id == wedding_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_wedding_role_permission(
        self, wedding_id: str, role: str, permission: str,
    ) -> Optional[Permission]:
        stmt = select(Permission).where(
            Permission.wedding_id == wedding_id,
            Permission.role == role,
            Permission.permission == permission,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_matrix(self, wedding_id: str) -> dict[str, dict[str, bool]]:
        permissions = await self.get_by_wedding(wedding_id)
        matrix: dict[str, dict[str, bool]] = {}
        for perm in permissions:
            if perm.role not in matrix:
                matrix[perm.role] = {}
            matrix[perm.role][perm.permission] = perm.allowed
        return matrix

    async def upsert(
        self, wedding_id: str, role: str, permission: str, allowed: bool,
    ) -> Permission:
        existing = await self.get_by_wedding_role_permission(wedding_id, role, permission)
        if existing:
            existing.allowed = allowed
            await self.session.flush()
            return existing
        return await self.create(
            wedding_id=wedding_id,
            role=role,
            permission=permission,
            allowed=allowed,
        )
