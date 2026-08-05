import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models import Activity, Download, Photo, StorageUsage, Wedding
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity import ActivityResponse
from app.schemas.dashboard import DashboardStatsResponse, RecentActivityResponse
from app.schemas.wedding import WeddingResponse

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.activity_repo = ActivityRepository(db)

    async def get_stats(self, current_user: dict) -> DashboardStatsResponse:
        user_id = current_user.get("sub")
        role = current_user.get("role")

        if role in ("admin",):
            wedding_filter = []
        else:
            wedding_filter = [Wedding.photographer_id == user_id]

        total_weddings = await self._count(Wedding, wedding_filter)
        total_photos = await self._count_photos(wedding_filter)

        total_downloads = await self._count(Download, wedding_filter)
        storage = await self.db.execute(select(StorageUsage).limit(1))
        usage = storage.scalar_one_or_none()

        used_bytes = usage.total_bytes if usage and usage.total_bytes else 0
        limit_bytes = usage.limit_bytes if usage and usage.limit_bytes else 1073741824

        result = await self.db.execute(
            select(Wedding).order_by(Wedding.created_at.desc()).limit(5)
        )
        recent = result.scalars().all()

        return DashboardStatsResponse(
            total_weddings=total_weddings,
            total_photos=total_photos,
            total_storage=used_bytes,
            total_downloads=total_downloads,
            storage_used=used_bytes,
            storage_limit=limit_bytes,
            recent_weddings=[WeddingResponse.model_validate(w) for w in recent],
        )

    async def get_recent_activity(
        self, current_user: dict, limit: int = 10,
    ) -> RecentActivityResponse:
        activities = await self.activity_repo.get_recent(limit=limit)
        return RecentActivityResponse(
            activities=[ActivityResponse.model_validate(a) for a in activities],
        )

    async def get_analytics(
        self, current_user: dict, date_from: str | None = None,
        date_to: str | None = None,
    ) -> dict:
        user_id = current_user.get("sub")

        views_result = await self.db.execute(
            select(func.count(Activity.id))
            .where(Activity.type == "view")
        )
        total_views = views_result.scalar() or 0

        downloads_result = await self.db.execute(
            select(func.count(Download.id))
        )
        total_downloads = downloads_result.scalar() or 0

        return {
            "total_views": total_views,
            "total_downloads": total_downloads,
            "views_by_day": [],
            "downloads_by_day": [],
        }

    async def _count(self, model, filters: list | None = None) -> int:
        query = select(func.count()).select_from(model)
        if filters:
            query = query.where(*filters)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def _count_photos(self, wedding_filter: list | None = None) -> int:
        query = select(func.count(Photo.id)).where(Photo.is_deleted == False)
        if wedding_filter:
            subq = select(Wedding.id).where(*wedding_filter)
            query = query.where(Photo.wedding_id.in_(subq))
        result = await self.db.execute(query)
        return result.scalar() or 0
