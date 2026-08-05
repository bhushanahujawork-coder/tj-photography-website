from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.settings import (
    AppSettingsResponse,
    BrandingSettingsRequest,
    DownloadSettingsRequest,
    GallerySettingsRequest,
    ThemeSettingsRequest,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])


async def get_settings_service(
    db: AsyncSession = Depends(get_db_session),
) -> SettingsService:
    return SettingsService(db)


@router.get(
    "/",
    response_model=AppSettingsResponse,
    operation_id="settings_get_all",
    summary="Get all application settings",
)
async def get_settings(
    current_user: dict = Depends(get_current_active_user),
    settings_service: SettingsService = Depends(get_settings_service),
) -> AppSettingsResponse:
    return await settings_service.get_settings(current_user)


@router.put(
    "/gallery",
    response_model=AppSettingsResponse,
    operation_id="settings_update_gallery",
    summary="Update gallery settings",
)
async def update_gallery_settings(
    request: GallerySettingsRequest,
    current_user: dict = Depends(get_current_active_user),
    settings_service: SettingsService = Depends(get_settings_service),
) -> AppSettingsResponse:
    return await settings_service.update_gallery(request, current_user)


@router.put(
    "/downloads",
    response_model=AppSettingsResponse,
    operation_id="settings_update_downloads",
    summary="Update download settings",
)
async def update_download_settings(
    request: DownloadSettingsRequest,
    current_user: dict = Depends(get_current_active_user),
    settings_service: SettingsService = Depends(get_settings_service),
) -> AppSettingsResponse:
    return await settings_service.update_downloads(request, current_user)


@router.put(
    "/branding",
    response_model=AppSettingsResponse,
    operation_id="settings_update_branding",
    summary="Update branding settings",
)
async def update_branding_settings(
    request: BrandingSettingsRequest,
    current_user: dict = Depends(get_current_active_user),
    settings_service: SettingsService = Depends(get_settings_service),
) -> AppSettingsResponse:
    return await settings_service.update_branding(request, current_user)


@router.put(
    "/theme",
    response_model=AppSettingsResponse,
    operation_id="settings_update_theme",
    summary="Update theme settings",
)
async def update_theme_settings(
    request: ThemeSettingsRequest,
    current_user: dict = Depends(get_current_active_user),
    settings_service: SettingsService = Depends(get_settings_service),
) -> AppSettingsResponse:
    return await settings_service.update_theme(request, current_user)
