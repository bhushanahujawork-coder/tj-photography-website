from datetime import datetime
from typing import Optional

from sqlalchemy import func, select

from app.models.photo import Photo
from app.repositories.base import BaseRepository


class PhotoRepository(BaseRepository[Photo]):
    def __init__(self, session):
        super().__init__(Photo, session)

    async def get_multi_filtered(
        self,
        wedding_id: Optional[str] = None,
        album_id: Optional[str] = None,
        folder_id: Optional[str] = None,
        search: Optional[str] = None,
        favorite: Optional[bool] = None,
        is_highlight: Optional[bool] = None,
        is_hidden: Optional[bool] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Photo], int]:
        conditions = [Photo.is_deleted == False]

        if wedding_id is not None:
            conditions.append(Photo.wedding_id == wedding_id)
        if album_id is not None:
            conditions.append(Photo.album_id == album_id)
        if folder_id is not None:
            conditions.append(Photo.folder_id == folder_id)
        if search:
            conditions.append(
                Photo.filename.ilike(f"%{search}%")
                | (Photo.alt_text.ilike(f"%{search}%"))
            )
        if favorite is not None:
            conditions.append(Photo.favorite == favorite)
        if is_highlight is not None:
            conditions.append(Photo.is_highlight == is_highlight)
        if is_hidden is not None:
            conditions.append(Photo.is_hidden == is_hidden)
        if date_from is not None:
            conditions.append(Photo.date_taken >= date_from)
        if date_to is not None:
            conditions.append(Photo.date_taken <= date_to)

        count_stmt = select(func.count(Photo.id)).where(*conditions)
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        sort_column = getattr(Photo, sort_by, Photo.created_at)
        order_fn = sort_column.desc if sort_order == "desc" else sort_column.asc

        stmt = (
            select(Photo)
            .where(*conditions)
            .order_by(order_fn())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    async def soft_delete(self, id: str) -> Optional[Photo]:
        return await self.update(
            id,
            is_deleted=True,
            deleted_at=datetime.now(),
        )
