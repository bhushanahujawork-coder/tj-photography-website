import logging

from fastapi import APIRouter, Depends, File, UploadFile, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_active_user, get_db_session
from app.core.errors import ValidationError
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

_READ_CHUNK = 1024 * 1024  # 1 MiB


async def _read_limited(file: UploadFile) -> bytes:
    """Read an upload in bounded chunks, rejecting anything over UPLOAD_MAX_SIZE.

    Guards against oversized bodies being buffered entirely into memory.
    """
    max_size = settings.UPLOAD_MAX_SIZE
    total = 0
    chunks: list[bytes] = []
    while True:
        chunk = await file.read(_READ_CHUNK)
        if not chunk:
            break
        total += len(chunk)
        if total > max_size:
            raise ValidationError(
                message=f"File exceeds maximum upload size of {max_size // (1024 * 1024)} MB"
            )
        chunks.append(chunk)
    return b"".join(chunks)


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
    file_data = await _read_limited(file)
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
