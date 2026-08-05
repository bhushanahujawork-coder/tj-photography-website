from fastapi import APIRouter, Depends, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.album import AlbumCreateRequest, AlbumResponse, AlbumUpdateRequest
from app.services.album_service import AlbumService

router = APIRouter(
    prefix="/api/v1/weddings/{wedding_id}/albums",
    tags=["Albums"],
)


async def get_album_service(
    db: AsyncSession = Depends(get_db_session),
) -> AlbumService:
    return AlbumService(db)


@router.get(
    "/",
    response_model=list[AlbumResponse],
    operation_id="albums_list",
    summary="List all albums for a wedding",
)
async def list_albums(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    album_service: AlbumService = Depends(get_album_service),
) -> list[AlbumResponse]:
    return await album_service.list_albums(wedding_id, current_user)


@router.post(
    "/",
    response_model=AlbumResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="albums_create",
    summary="Create a new album in a wedding",
)
async def create_album(
    wedding_id: str,
    request: AlbumCreateRequest,
    current_user: dict = Depends(get_current_active_user),
    album_service: AlbumService = Depends(get_album_service),
) -> AlbumResponse:
    return await album_service.create_album(wedding_id, request, current_user)


@router.get(
    "/{album_id}",
    response_model=AlbumResponse,
    operation_id="albums_get",
    summary="Get album by ID",
)
async def get_album(
    wedding_id: str,
    album_id: str,
    current_user: dict = Depends(get_current_active_user),
    album_service: AlbumService = Depends(get_album_service),
) -> AlbumResponse:
    return await album_service.get_album(album_id, current_user)


@router.put(
    "/{album_id}",
    response_model=AlbumResponse,
    operation_id="albums_update",
    summary="Update album details",
)
async def update_album(
    wedding_id: str,
    album_id: str,
    request: AlbumUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    album_service: AlbumService = Depends(get_album_service),
) -> AlbumResponse:
    return await album_service.update_album(album_id, request, current_user)


@router.delete(
    "/{album_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="albums_delete",
    summary="Delete an album",
)
async def delete_album(
    wedding_id: str,
    album_id: str,
    current_user: dict = Depends(get_current_active_user),
    album_service: AlbumService = Depends(get_album_service),
) -> None:
    await album_service.delete_album(album_id, current_user)
