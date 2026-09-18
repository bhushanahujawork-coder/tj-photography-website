from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.core.errors import ValidationError
from app.schemas.common import SuccessResponse
from app.schemas.faces import (
    FaceProfileCreateRequest,
    FaceProfileResponse,
    FaceProfileUpdateRequest,
    FaceSearchResponse,
    SelfieVerifyResponse,
)
from app.services.face_service import FaceService

router = APIRouter(prefix="/api/v1", tags=["Faces"])


async def get_face_service(
    db: AsyncSession = Depends(get_db_session),
) -> FaceService:
    return FaceService(db)


@router.get(
    "/weddings/{wedding_id}/faces",
    response_model=list[FaceProfileResponse],
    operation_id="faces_list",
    summary="List face profiles for a wedding",
)
async def list_faces(
    wedding_id: str,
    current_user: dict = Depends(get_current_active_user),
    face_service: FaceService = Depends(get_face_service),
) -> list[FaceProfileResponse]:
    return await face_service.list_faces(wedding_id, current_user)


@router.post(
    "/photos/{photo_id}/face",
    response_model=FaceProfileResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="faces_register",
    summary="Register a face profile from a photo",
)
async def register_face(
    photo_id: str,
    request: FaceProfileCreateRequest,
    current_user: dict = Depends(get_current_active_user),
    face_service: FaceService = Depends(get_face_service),
) -> FaceProfileResponse:
    return await face_service.register_photo_face(
        photo_id, request.label, request.face_box, current_user,
    )


@router.put(
    "/faces/{face_id}",
    response_model=FaceProfileResponse,
    operation_id="faces_update",
    summary="Update a face profile (label / primary / box)",
)
async def update_face(
    face_id: str,
    request: FaceProfileUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    face_service: FaceService = Depends(get_face_service),
) -> FaceProfileResponse:
    return await face_service.update_face(face_id, request, current_user)


@router.delete(
    "/faces/{face_id}",
    response_model=SuccessResponse,
    operation_id="faces_delete",
    summary="Delete a face profile",
)
async def delete_face(
    face_id: str,
    current_user: dict = Depends(get_current_active_user),
    face_service: FaceService = Depends(get_face_service),
) -> SuccessResponse:
    await face_service.delete_face(face_id, current_user)
    return SuccessResponse(message="Face profile deleted", data={"id": face_id})


@router.post(
    "/faces/search",
    response_model=FaceSearchResponse,
    operation_id="faces_search",
    summary="Search faces by uploading a query photo",
)
async def search_faces(
    wedding_id: str = Form(...),
    image: UploadFile = File(...),
    limit: int = Form(default=10),
    current_user: dict = Depends(get_current_active_user),
    face_service: FaceService = Depends(get_face_service),
) -> FaceSearchResponse:
    raw = await image.read()
    if not raw:
        raise ValidationError(message="Empty upload")
    return await face_service.search_faces(raw, wedding_id, current_user, limit=limit)


@router.post(
    "/auth/selfie/liveness",
    response_model=SelfieVerifyResponse,
    operation_id="selfie_liveness",
    summary="Verify a guest selfie for liveness (no auth required)",
)
async def verify_selfie(
    image: UploadFile = File(...),
) -> SelfieVerifyResponse:
    raw = await image.read()
    if not raw:
        raise ValidationError(message="Empty upload")
    return FaceService.verify_selfie(raw)