import logging

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.common import SuccessResponse
from app.schemas.photo import PhotoResponse
from app.schemas.upload import (
    UploadCompleteRequest,
    UploadInitRequest,
    UploadInitResponse,
    UploadProgressResponse,
)
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/upload", tags=["Uploads"])


async def get_upload_service(
    db: AsyncSession = Depends(get_db_session),
) -> UploadService:
    return UploadService(db)


@router.post(
    "/init",
    response_model=UploadInitResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="upload_init",
    summary="Initialize an upload session",
)
async def init_upload(
    request: UploadInitRequest,
    current_user: dict = Depends(get_current_active_user),
    upload_service: UploadService = Depends(get_upload_service),
) -> UploadInitResponse:
    return await upload_service.init_upload(request, current_user)


@router.post(
    "/{upload_id}/files/{file_id}",
    response_model=PhotoResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="upload_file",
    summary="Upload a single file within a session",
)
async def upload_file(
    upload_id: str,
    file_id: str,
    file: UploadFile = File(..., description="Image file to upload"),
    current_user: dict = Depends(get_current_active_user),
    upload_service: UploadService = Depends(get_upload_service),
) -> PhotoResponse:
    file_data = await file.read()
    return await upload_service.upload_file(upload_id, file_id, file_data, current_user)


@router.post(
    "/{upload_id}/complete",
    response_model=SuccessResponse,
    operation_id="upload_complete",
    summary="Mark a file upload as completed",
)
async def complete_upload(
    upload_id: str,
    request: UploadCompleteRequest,
    current_user: dict = Depends(get_current_active_user),
    upload_service: UploadService = Depends(get_upload_service),
) -> SuccessResponse:
    return await upload_service.complete_upload(upload_id, request, current_user)


@router.get(
    "/{upload_id}/progress",
    response_model=UploadProgressResponse,
    operation_id="upload_progress",
    summary="Get upload session progress",
)
async def get_upload_progress(
    upload_id: str,
    current_user: dict = Depends(get_current_active_user),
    upload_service: UploadService = Depends(get_upload_service),
) -> UploadProgressResponse:
    return await upload_service.get_progress(upload_id, current_user)


@router.post(
    "/{upload_id}/cancel",
    response_model=SuccessResponse,
    operation_id="upload_cancel",
    summary="Cancel an upload session",
)
async def cancel_upload(
    upload_id: str,
    current_user: dict = Depends(get_current_active_user),
    upload_service: UploadService = Depends(get_upload_service),
) -> SuccessResponse:
    return await upload_service.cancel_upload(upload_id, current_user)
