from fastapi import APIRouter, Depends, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.folder import FolderCreateRequest, FolderResponse, FolderUpdateRequest
from app.services.folder_service import FolderService

router = APIRouter(
    prefix="/api/v1/weddings/{wedding_id}/folders",
    tags=["Folders"],
)


async def get_folder_service(
    db: AsyncSession = Depends(get_db_session),
) -> FolderService:
    return FolderService(db)


@router.get(
    "/",
    response_model=list[FolderResponse],
    operation_id="folders_list",
    summary="List all folders for a wedding",
)
async def list_folders(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    folder_service: FolderService = Depends(get_folder_service),
) -> list[FolderResponse]:
    return await folder_service.list_folders(wedding_id, current_user)


@router.post(
    "/",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="folders_create",
    summary="Create a new folder in a wedding",
)
async def create_folder(
    wedding_id: str,
    request: FolderCreateRequest,
    current_user: dict = Depends(get_current_active_user),
    folder_service: FolderService = Depends(get_folder_service),
) -> FolderResponse:
    return await folder_service.create_folder(wedding_id, request, current_user)


@router.get(
    "/{folder_id}",
    response_model=FolderResponse,
    operation_id="folders_get",
    summary="Get folder by ID",
)
async def get_folder(
    wedding_id: str,
    folder_id: str,
    current_user: dict = Depends(get_current_active_user),
    folder_service: FolderService = Depends(get_folder_service),
) -> FolderResponse:
    return await folder_service.get_folder(folder_id, current_user)


@router.put(
    "/{folder_id}",
    response_model=FolderResponse,
    operation_id="folders_update",
    summary="Update folder details",
)
async def update_folder(
    wedding_id: str,
    folder_id: str,
    request: FolderUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    folder_service: FolderService = Depends(get_folder_service),
) -> FolderResponse:
    return await folder_service.update_folder(folder_id, request, current_user)


@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="folders_delete",
    summary="Delete a folder",
)
async def delete_folder(
    wedding_id: str,
    folder_id: str,
    current_user: dict = Depends(get_current_active_user),
    folder_service: FolderService = Depends(get_folder_service),
) -> None:
    await folder_service.delete_folder(folder_id, current_user)


@router.put(
    "/{folder_id}/reorder",
    response_model=FolderResponse,
    operation_id="folders_reorder",
    summary="Update folder sort order",
)
async def reorder_folder(
    wedding_id: str,
    folder_id: str,
    request: FolderUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    folder_service: FolderService = Depends(get_folder_service),
) -> FolderResponse:
    return await folder_service.reorder_folder(folder_id, request, current_user)
