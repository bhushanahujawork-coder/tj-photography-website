from fastapi import APIRouter, Depends, Query, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.common import SuccessResponse
from app.schemas.download import (
    DownloadRequest,
    DownloadResponse,
    DownloadRecordResponse,
    ShareLinkCreateRequest,
    ShareLinkResponse,
)
from app.services.download_service import DownloadService

router = APIRouter(prefix="/api/v1", tags=["Downloads & Share Links"])


async def get_download_service(
    db: AsyncSession = Depends(get_db_session),
) -> DownloadService:
    return DownloadService(db)


@router.post(
    "/downloads",
    response_model=DownloadResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="downloads_create",
    summary="Create a download request for photos",
)
async def create_download(
    request: DownloadRequest,
    current_user: dict = Depends(get_current_active_user),
    download_service: DownloadService = Depends(get_download_service),
) -> DownloadResponse:
    return await download_service.create_download(request, current_user)


@router.get(
    "/downloads",
    response_model=list[DownloadRecordResponse],
    operation_id="downloads_list",
    summary="List download history",
)
async def list_downloads(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_active_user),
    download_service: DownloadService = Depends(get_download_service),
) -> list[DownloadRecordResponse]:
    return await download_service.list_downloads(current_user, page=page, page_size=page_size)


@router.get(
    "/downloads/{download_id}",
    response_model=DownloadResponse,
    operation_id="downloads_get",
    summary="Get download status and details",
)
async def get_download(
    download_id: str,
    current_user: dict = Depends(get_current_active_user),
    download_service: DownloadService = Depends(get_download_service),
) -> DownloadResponse:
    return await download_service.get_download(download_id, current_user)


@router.get(
    "/weddings/{wedding_id}/share-links",
    response_model=list[ShareLinkResponse],
    operation_id="share_links_list",
    summary="List share links for a wedding",
)
async def list_share_links(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    download_service: DownloadService = Depends(get_download_service),
) -> list[ShareLinkResponse]:
    return await download_service.list_share_links(wedding_id, current_user)


@router.post(
    "/weddings/{wedding_id}/share-links",
    response_model=ShareLinkResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="share_links_create",
    summary="Create a share link for a wedding",
)
async def create_share_link(
    wedding_id: str,
    request: ShareLinkCreateRequest,
    current_user: dict = Depends(get_current_active_user),
    download_service: DownloadService = Depends(get_download_service),
) -> ShareLinkResponse:
    return await download_service.create_share_link(wedding_id, request, current_user)


@router.delete(
    "/share-links/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="share_links_delete",
    summary="Delete a share link",
)
async def delete_share_link(
    link_id: str,
    current_user: dict = Depends(get_current_active_user),
    download_service: DownloadService = Depends(get_download_service),
) -> None:
    await download_service.delete_share_link(link_id, current_user)


@router.get(
    "/share-links/{code}",
    response_model=ShareLinkResponse,
    operation_id="share_links_access",
    summary="Access a wedding gallery via share code (public)",
)
async def access_share_link(
    code: str,
    download_service: DownloadService = Depends(get_download_service),
) -> ShareLinkResponse:
    return await download_service.access_share_link(code)
