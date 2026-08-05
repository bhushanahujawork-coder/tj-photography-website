import logging

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity import ActivityResponse
from app.schemas.common import PaginatedResponse

logger = logging.getLogger(__name__)


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.activity_repo = ActivityRepository(db)

    async def log(
        self,
        user_id: str,
        action: str,
        description: str,
        type: str,
        wedding_id: str | None = None,
        metadata: dict | None = None,
    ) -> ActivityResponse:
        activity = await self.activity_repo.create(
            user_id=user_id,
            wedding_id=wedding_id,
            action=action,
            description=description,
            type=type,
            _metadata=metadata,
        )
        logger.info("Activity logged: %s by user %s", action, user_id)
        return ActivityResponse.model_validate(activity)

    async def list_activities(self, filters, current_user: dict) -> PaginatedResponse[ActivityResponse]:
        conditions = []

        if filters.wedding_id:
            conditions.append(Activity.wedding_id == filters.wedding_id)
        if filters.user_id:
            conditions.append(Activity.user_id == filters.user_id)
        if filters.type:
            conditions.append(Activity.type == filters.type)
        if filters.date_from:
            conditions.append(Activity.created_at >= filters.date_from)
        if filters.date_to:
            conditions.append(Activity.created_at <= filters.date_to)

        where_clause = and_(*conditions) if conditions else True

        count_stmt = select(func.count(Activity.id)).where(where_clause)
        total_result = await self.activity_repo.session.execute(count_stmt)
        total = total_result.scalar() or 0

        skip = (filters.page - 1) * filters.page_size
        stmt = (
            select(Activity)
            .where(where_clause)
            .order_by(Activity.created_at.desc())
            .offset(skip)
            .limit(filters.page_size)
        )
        result = await self.activity_repo.session.execute(stmt)
        items = list(result.scalars().all())

        pages = max(0, (total + filters.page_size - 1) // filters.page_size)
        return PaginatedResponse[ActivityResponse](
            items=[ActivityResponse.model_validate(a) for a in items],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            pages=pages,
        )

    async def get_wedding_activities(
        self, wedding_id: str, filters, current_user: dict,
    ) -> list[ActivityResponse]:
        items, _ = await self.activity_repo.get_by_wedding(
            wedding_id=wedding_id,
            skip=(filters.page - 1) * filters.page_size,
            limit=filters.page_size,
        )
        return [ActivityResponse.model_validate(a) for a in items]
