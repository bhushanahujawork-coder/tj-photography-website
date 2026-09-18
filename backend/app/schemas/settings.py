from typing import Optional
from pydantic import BaseModel, Field


class BrandingSettingsRequest(BaseModel):
    photographer_logo: Optional[str] = Field(default=None, description="Photographer logo URL")
    watermark_position: Optional[str] = Field(default="bottom-center", description="Watermark position")
    watermark_size: Optional[str] = Field(default="medium", description="Watermark size (small/medium/large)")
    watermark_type: Optional[str] = Field(default="text", description="Watermark type (text/logo)")
    watermark_text: Optional[str] = Field(default="TJ Photography", description="Watermark text")
    gallery_theme: Optional[str] = Field(default="light", description="Gallery theme (light/dark)")
    primary_color: Optional[str] = Field(default="#D4AF37", description="Primary brand color (hex)")
    typography: Optional[dict] = Field(default=None, description="Typography settings")

    model_config = {"from_attributes": True}


class GallerySettingsRequest(BaseModel):
    visibility: Optional[str] = Field(default=None, description="Default gallery visibility")
    download_enabled: Optional[bool] = Field(default=True, description="Allow downloads")
    share_enabled: Optional[bool] = Field(default=True, description="Allow sharing")
    screenshot_protection: Optional[bool] = Field(default=False, description="Enable screenshot protection")
    anonymous_viewing: Optional[bool] = Field(default=False, description="Allow anonymous viewing")
    watermark_enabled: Optional[bool] = Field(default=False, description="Enable watermark on photos")
    pin_protection: Optional[bool] = Field(default=False, description="Enable PIN protection")
    pin_code: Optional[str] = Field(default=None, description="PIN required to view the gallery")

    model_config = {"from_attributes": True}


class GroupSettingsRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="Group display name")
    icon_url: Optional[str] = Field(default=None, description="Group icon URL")
    welcome_message: Optional[str] = Field(default=None, description="Welcome message shown to guests")
    hide_deleted: Optional[bool] = Field(default=True, description="Hide deleted photos from guests")
    liveness_enabled: Optional[bool] = Field(default=False, description="Require selfie liveness for guest access")
    anonymous_viewing: Optional[bool] = Field(default=True, description="Allow anonymous viewing")
    uploads_enabled: Optional[bool] = Field(default=False, description="Allow guests to upload photos")

    model_config = {"from_attributes": True}


class GroupSettingsResponse(GroupSettingsRequest):
    pass


class DownloadSettingsRequest(BaseModel):
    single_enabled: Optional[bool] = Field(default=True, description="Allow single photo downloads")
    multiple_enabled: Optional[bool] = Field(default=True, description="Allow multiple photo downloads")
    bulk_enabled: Optional[bool] = Field(default=False, description="Allow bulk downloads")
    zip_enabled: Optional[bool] = Field(default=True, description="Allow ZIP archive downloads")
    pin_required: Optional[bool] = Field(default=False, description="Require PIN for downloads")

    model_config = {"from_attributes": True}


class ThemeSettingsRequest(BaseModel):
    mode: Optional[str] = Field(default="dark", description="Theme mode (light/dark)")
    primary_color: Optional[str] = Field(default="#D4AF37", description="Primary brand color (hex)")

    model_config = {"from_attributes": True}


class AppSettingsResponse(BaseModel):
    general: dict = Field(default_factory=dict, description="General application settings")
    gallery: GallerySettingsRequest = Field(description="Gallery settings")
    downloads: DownloadSettingsRequest = Field(description="Download settings")
    branding: BrandingSettingsRequest = Field(description="Branding settings")
    theme: dict = Field(default_factory=dict, description="Theme settings")

    model_config = {"from_attributes": True}


class StorageUsageResponse(BaseModel):
    used_bytes: int = Field(default=0, ge=0, description="Storage used in bytes")
    limit_bytes: int = Field(default=0, ge=0, description="Storage limit in bytes")
    photo_count: int = Field(default=0, ge=0, description="Number of photos stored")
    video_count: int = Field(default=0, ge=0, description="Number of videos stored")
    album_count: int = Field(default=0, ge=0, description="Number of albums")
    used_percentage: float = Field(default=0.0, ge=0.0, le=100.0, description="Percentage of storage used")

    model_config = {"from_attributes": True}
