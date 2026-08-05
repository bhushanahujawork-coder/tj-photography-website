import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.wedding import Wedding
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.settings import (
    AppSettingsResponse,
    BrandingSettingsRequest,
    DownloadSettingsRequest,
    GallerySettingsRequest,
)

logger = logging.getLogger(__name__)

_DEFAULT_SETTINGS = {
    "general": {
        "site_name": "TJ Photography",
        "date_format": "MMM DD, YYYY",
        "timezone": "America/New_York",
        "language": "en",
    },
    "gallery": {
        "visibility": "public",
        "download_enabled": True,
        "share_enabled": True,
        "screenshot_protection": False,
        "anonymous_viewing": True,
        "watermark_enabled": False,
        "pin_protection": False,
    },
    "downloads": {
        "single_enabled": True,
        "multiple_enabled": True,
        "bulk_enabled": True,
        "zip_enabled": True,
        "pin_required": False,
    },
    "branding": {
        "photographer_logo": "",
        "watermark_position": "bottom-center",
        "watermark_size": "medium",
        "watermark_type": "text",
        "watermark_text": "TJ Photography",
        "gallery_theme": "dark",
        "primary_color": "#D4AF37",
        "typography": {"headings": "Playfair Display", "body": "Inter"},
    },
    "theme": {"mode": "dark", "primary_color": "#D4AF37"},
    "sorting": {"default_sort": "newest"},
}


class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.wedding_repo = WeddingRepository(db)

    async def get_settings(self, current_user: dict) -> AppSettingsResponse:
        return await self._build_response(current_user)

    async def update_gallery(
        self, request: GallerySettingsRequest, current_user: dict,
    ) -> AppSettingsResponse:
        await self._update_wedding_settings(current_user, "gallery", request.model_dump(exclude_none=True))
        return await self._build_response(current_user)

    async def update_downloads(
        self, request: DownloadSettingsRequest, current_user: dict,
    ) -> AppSettingsResponse:
        await self._update_wedding_settings(current_user, "downloads", request.model_dump(exclude_none=True))
        return await self._build_response(current_user)

    async def update_branding(
        self, request: BrandingSettingsRequest, current_user: dict,
    ) -> AppSettingsResponse:
        await self._update_wedding_settings(current_user, "branding", request.model_dump(exclude_none=True))
        return await self._build_response(current_user)

    async def update_theme(
        self, request: dict, current_user: dict,
    ) -> AppSettingsResponse:
        await self._update_wedding_settings(current_user, "theme", request)
        return await self._build_response(current_user)

    async def _update_wedding_settings(
        self, current_user: dict, section: str, data: dict,
    ) -> None:
        weddings_list, _ = await self.wedding_repo.get_photographer_weddings(
            photographer_id=current_user.get("sub"),
        )
        for wedding in weddings_list:
            current = wedding.settings or {}
            if section not in current:
                current[section] = {}
            current[section].update(data)
            await self.wedding_repo.update(wedding.id, settings=current)

    async def _build_response(self, current_user: dict) -> AppSettingsResponse:
        user_id = current_user.get("sub")
        weddings, _ = await self.wedding_repo.get_photographer_weddings(
            photographer_id=user_id,
        )
        merged = dict(_DEFAULT_SETTINGS)
        for wedding in weddings:
            if wedding.settings:
                for section, values in wedding.settings.items():
                    if section in merged and isinstance(values, dict):
                        merged[section].update(values)

        return AppSettingsResponse(**merged)
