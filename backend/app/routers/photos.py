from fastapi import APIRouter, Depends, Query, Response, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.photo import (
    PhotoBatchDeleteRequest,
    PhotoBatchMoveRequest,
    PhotoBatchUpdateRequest,
    PhotoExifResponse,
    PhotoFilterParams,
    PhotoResponse,
    PhotoUpdateRequest,
)
from app.services.photo_service import PhotoService

router = APIRouter(prefix="/api/v1", tags=["Photos"])


async def get_photo_service(
    db: AsyncSession = Depends(get_db_session),
) -> PhotoService:
    return PhotoService(db)


@router.get(
    "/weddings/{wedding_id}/photos",
    response_model=PaginatedResponse[PhotoResponse],
    operation_id="photos_list",
    summary="List photos for a wedding with filtering",
)
async def list_photos(
    wedding_id: str,
    album_id: str | None = Query(default=None, description="Filter by album ID"),
    folder_id: str | None = Query(default=None, description="Filter by folder ID"),
    search: str | None = Query(default=None, description="Search in filename and alt text"),
    favorite: bool | None = Query(default=None, description="Filter by favorite status"),
    is_highlight: bool | None = Query(default=None, description="Filter by highlight status"),
    is_hidden: bool | None = Query(default=None, description="Filter by hidden status"),
    date_from: str | None = Query(default=None, description="Filter photos taken after this date"),
    date_to: str | None = Query(default=None, description="Filter photos taken before this date"),
    sort_by: str = Query(default="created_at", description="Field to sort by"),
    sort_order: str = Query(default="desc", description="Sort direction (asc/desc)"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=200, description="Items per page"),
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> PaginatedResponse[PhotoResponse]:
    filters = PhotoFilterParams(
        wedding_id=wedding_id,
        album_id=album_id,
        folder_id=folder_id,
        search=search,
        favorite=favorite,
        is_highlight=is_highlight,
        is_hidden=is_hidden,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return await photo_service.list_photos(filters, current_user)


@router.get(
    "/photos/{photo_id}",
    response_model=PhotoResponse,
    operation_id="photos_get",
    summary="Get a single photo by ID",
)
async def get_photo(
    photo_id: str,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> PhotoResponse:
    return await photo_service.get_photo(photo_id, current_user)


@router.put(
    "/photos/{photo_id}",
    response_model=PhotoResponse,
    operation_id="photos_update",
    summary="Update photo metadata",
)
async def update_photo(
    photo_id: str,
    request: PhotoUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> PhotoResponse:
    return await photo_service.update_photo(photo_id, request, current_user)


@router.delete(
    "/photos/{photo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="photos_delete",
    summary="Soft delete a photo",
)
async def delete_photo(
    photo_id: str,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> None:
    await photo_service.soft_delete(photo_id, current_user)


@router.post(
    "/photos/batch/update",
    response_model=list[PhotoResponse],
    operation_id="photos_batch_update",
    summary="Batch update multiple photos",
)
async def batch_update_photos(
    request: PhotoBatchUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> list[PhotoResponse]:
    return await photo_service.batch_update(request, current_user)


@router.post(
    "/photos/batch/delete",
    response_model=SuccessResponse,
    operation_id="photos_batch_delete",
    summary="Batch delete photos (soft or permanent)",
)
async def batch_delete_photos(
    request: PhotoBatchDeleteRequest,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> SuccessResponse:
    return await photo_service.batch_delete(request, current_user)


@router.post(
    "/photos/batch/move",
    response_model=list[PhotoResponse],
    operation_id="photos_batch_move",
    summary="Batch move photos to album or folder",
)
async def batch_move_photos(
    request: PhotoBatchMoveRequest,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> list[PhotoResponse]:
    return await photo_service.batch_move(request, current_user)


@router.post(
    "/photos/batch/restore",
    response_model=list[PhotoResponse],
    operation_id="photos_batch_restore",
    summary="Batch restore soft-deleted photos",
)
async def batch_restore_photos(
    request: PhotoBatchDeleteRequest,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> list[PhotoResponse]:
    return await photo_service.batch_restore(request, current_user)


@router.put(
    "/photos/{photo_id}/favorite",
    response_model=PhotoResponse,
    operation_id="photos_toggle_favorite",
    summary="Toggle favorite status on a photo",
)
async def toggle_favorite(
    photo_id: str,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> PhotoResponse:
    return await photo_service.toggle_favorite(photo_id, current_user)


@router.get(
    "/photos/{photo_id}/exif",
    response_model=PhotoExifResponse,
    operation_id="photos_exif",
    summary="Get EXIF metadata for a photo",
)
async def get_photo_exif(
    photo_id: str,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> PhotoExifResponse:
    return await photo_service.get_exif(photo_id, current_user)


@router.get(
    "/photos/{photo_id}/download",
    operation_id="photos_download",
    summary="Download a photo as PNG",
)
async def download_photo(
    photo_id: str,
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> Response:
    png_bytes, png_filename, content_type = await photo_service.download_photo(photo_id, current_user)
    return Response(
        content=png_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{png_filename}"'},
    )


@router.get(
    "/photos/download",
    operation_id="photos_download_batch",
    summary="Download multiple photos as a ZIP of PNGs",
)
async def download_photos_batch(
    photo_ids: str = Query(..., description="Comma-separated photo IDs"),
    current_user: dict = Depends(get_current_active_user),
    photo_service: PhotoService = Depends(get_photo_service),
) -> Response:
    ids = [pid.strip() for pid in photo_ids.split(",") if pid.strip()]
    zip_bytes, zip_name = await photo_service.download_photos_batch(ids, current_user)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_name}"'},
    )
