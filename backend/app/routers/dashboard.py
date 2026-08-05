from fastapi import APIRouter, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.activity import ActivityResponse
from app.schemas.dashboard import DashboardStatsResponse, RecentActivityResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


async def get_dashboard_service(
    db: AsyncSession = Depends(get_db_session),
) -> DashboardService:
    return DashboardService(db)


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    operation_id="dashboard_stats",
    summary="Get dashboard statistics",
)
async def get_stats(
    current_user: dict = Depends(get_current_active_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> DashboardStatsResponse:
    return await dashboard_service.get_stats(current_user)


@router.get(
    "/recent-activity",
    response_model=RecentActivityResponse,
    operation_id="dashboard_recent_activity",
    summary="Get recent activity feed",
)
async def get_recent_activity(
    limit: int = Query(default=10, ge=1, le=50, description="Number of recent activities"),
    current_user: dict = Depends(get_current_active_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> RecentActivityResponse:
    return await dashboard_service.get_recent_activity(current_user, limit=limit)


@router.get(
    "/analytics",
    response_model=dict,
    operation_id="dashboard_analytics",
    summary="Get analytics data",
)
async def get_analytics(
    date_from: str | None = Query(default=None, description="Start date for analytics"),
    date_to: str | None = Query(default=None, description="End date for analytics"),
    current_user: dict = Depends(get_current_active_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> dict:
    return await dashboard_service.get_analytics(current_user, date_from=date_from, date_to=date_to)
