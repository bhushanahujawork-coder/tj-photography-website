from fastapi import APIRouter, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.activity import ActivityFilterParams, ActivityResponse
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/api/v1/activity", tags=["Activity"])


async def get_activity_service(
    db: AsyncSession = Depends(get_db_session),
) -> ActivityService:
    return ActivityService(db)


@router.get(
    "/",
    response_model=list[ActivityResponse],
    operation_id="activity_list",
    summary="List activities with filtering and pagination",
)
async def list_activities(
    wedding_id: str | None = Query(default=None, description="Filter by wedding ID"),
    user_id: str | None = Query(default=None, description="Filter by user ID"),
    type: str | None = Query(default=None, description="Filter by activity type"),
    date_from: str | None = Query(default=None, description="Filter activities after this date"),
    date_to: str | None = Query(default=None, description="Filter activities before this date"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=200, description="Items per page"),
    current_user: dict = Depends(get_current_active_user),
    activity_service: ActivityService = Depends(get_activity_service),
) -> list[ActivityResponse]:
    filters = ActivityFilterParams(
        wedding_id=wedding_id,
        user_id=user_id,
        type=type,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    return await activity_service.list_activities(filters, current_user)


@router.get(
    "/weddings/{wedding_id}",
    response_model=list[ActivityResponse],
    operation_id="activity_get_wedding",
    summary="Get wedding-specific activities",
)
async def get_wedding_activities(
    wedding_id: str,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=200, description="Items per page"),
    current_user: dict = Depends(get_current_active_user),
    activity_service: ActivityService = Depends(get_activity_service),
) -> list[ActivityResponse]:
    filters = ActivityFilterParams(
        wedding_id=wedding_id,
        page=page,
        page_size=page_size,
    )
    return await activity_service.get_wedding_activities(wedding_id, filters, current_user)
