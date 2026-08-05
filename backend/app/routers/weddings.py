from fastapi import APIRouter, Depends, Query, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_current_user, get_db_session
from app.schemas.common import SuccessResponse
from app.schemas.wedding import (
    WeddingCreateRequest,
    WeddingDuplicateRequest,
    WeddingListResponse,
    WeddingPublishRequest,
    WeddingResponse,
    WeddingUpdateRequest,
)
from app.services.wedding_service import WeddingService

router = APIRouter(prefix="/api/v1/weddings", tags=["Weddings"])


async def get_wedding_service(
    db: AsyncSession = Depends(get_db_session),
) -> WeddingService:
    return WeddingService(db)


@router.get(
    "/",
    response_model=WeddingListResponse,
    operation_id="weddings_list",
    summary="List weddings with pagination and filtering",
)
async def list_weddings(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status: str | None = Query(default=None, description="Filter by status"),
    search: str | None = Query(default=None, description="Search by wedding name"),
    sort_by: str = Query(default="created_at", description="Field to sort by"),
    sort_order: str = Query(default="desc", description="Sort direction (asc/desc)"),
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingListResponse:
    return await wedding_service.list_weddings(
        user=current_user,
        page=page,
        page_size=page_size,
        status=status,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
    "/",
    response_model=WeddingResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="weddings_create",
    summary="Create a new wedding",
)
async def create_wedding(
    request: WeddingCreateRequest,
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingResponse:
    return await wedding_service.create_wedding(request, current_user)


@router.get(
    "/{wedding_id}",
    response_model=WeddingResponse,
    operation_id="weddings_get",
    summary="Get wedding by ID",
)
async def get_wedding(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingResponse:
    return await wedding_service.get_wedding(wedding_id, current_user)


@router.put(
    "/{wedding_id}",
    response_model=WeddingResponse,
    operation_id="weddings_update",
    summary="Update wedding details",
)
async def update_wedding(
    wedding_id: str,
    request: WeddingUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingResponse:
    return await wedding_service.update_wedding(wedding_id, request, current_user)


@router.delete(
    "/{wedding_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="weddings_delete",
    summary="Delete a wedding",
)
async def delete_wedding(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> None:
    await wedding_service.delete_wedding(wedding_id, current_user)


@router.post(
    "/{wedding_id}/duplicate",
    response_model=WeddingResponse,
    operation_id="weddings_duplicate",
    summary="Duplicate a wedding with all its contents",
)
async def duplicate_wedding(
    wedding_id: str,
    request: WeddingDuplicateRequest,
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingResponse:
    return await wedding_service.duplicate_wedding(wedding_id, request, current_user)


@router.post(
    "/{wedding_id}/publish",
    response_model=WeddingResponse,
    operation_id="weddings_publish",
    summary="Publish or unpublish a wedding gallery",
)
async def publish_wedding(
    wedding_id: str,
    request: WeddingPublishRequest,
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingResponse:
    return await wedding_service.publish_wedding(wedding_id, request, current_user)


@router.post(
    "/{wedding_id}/archive",
    response_model=WeddingResponse,
    operation_id="weddings_archive",
    summary="Archive a wedding gallery",
)
async def archive_wedding(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingResponse:
    return await wedding_service.archive_wedding(wedding_id, current_user)


@router.get(
    "/by-code/{code}",
    response_model=WeddingResponse,
    operation_id="weddings_get_by_code",
    summary="Lookup wedding by unique access code",
)
async def get_wedding_by_code(
    code: str,
    wedding_service: WeddingService = Depends(get_wedding_service),
) -> WeddingResponse:
    return await wedding_service.get_by_code(code)
