import math
from typing import Generic, Optional, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def create(self, **kwargs) -> ModelType:
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def get(self, id: str) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(
        self, skip: int = 0, limit: int = 100, **filters
    ) -> tuple[list[ModelType], int]:
        conditions = [
            getattr(self.model, k) == v for k, v in filters.items() if v is not None
        ]
        count_stmt = select(func.count(self.model.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        stmt = select(self.model)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    async def update(self, id: str, **kwargs) -> Optional[ModelType]:
        instance = await self.get(id)
        if not instance:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(instance, key, value)
        await self.session.flush()
        return instance

    async def delete(self, id: str) -> bool:
        instance = await self.get(id)
        if not instance:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True

    async def count(self, **filters) -> int:
        conditions = [
            getattr(self.model, k) == v for k, v in filters.items() if v is not None
        ]
        stmt = select(func.count(self.model.id))
        if conditions:
            stmt = stmt.where(*conditions)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def exists(self, id: str) -> bool:
        stmt = select(func.count(self.model.id)).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return (result.scalar() or 0) > 0
