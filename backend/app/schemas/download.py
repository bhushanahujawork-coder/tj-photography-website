from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DownloadRequest(BaseModel):
    wedding_id: str = Field(description="Wedding ID to download from")
    photo_ids: list[str] = Field(description="List of photo IDs to download")
    type: str = Field(description="Download type (single/multiple/bulk/zip)")
    pin: Optional[str] = Field(default=None, description="PIN code if required")

    model_config = {"from_attributes": True}


class DownloadResponse(BaseModel):
    id: str = Field(description="Unique download identifier")
    wedding_id: str = Field(description="Wedding ID")
    type: str = Field(description="Download type")
    photo_count: int = Field(ge=0, description="Number of photos")
    total_size: Optional[int] = Field(default=None, ge=0, description="Total download size in bytes")
    status: str = Field(description="Download status (pending/processing/completed/failed)")
    download_url: Optional[str] = Field(default=None, description="URL to download the prepared file")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}


class DownloadRecordResponse(BaseModel):
    id: str = Field(description="Unique download identifier")
    wedding_id: str = Field(description="Wedding ID")
    wedding_name: str = Field(description="Wedding name")
    user_name: Optional[str] = Field(default=None, description="User who initiated download")
    type: str = Field(description="Download type")
    photo_count: int = Field(ge=0, description="Number of photos downloaded")
    total_size: Optional[int] = Field(default=None, ge=0, description="Total size in bytes")
    status: str = Field(description="Download status")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}


class ShareLinkCreateRequest(BaseModel):
    wedding_id: str = Field(description="Wedding ID to share")
    role: str = Field(default="guest", description="Default role for shared link users")
    download_enabled: bool = Field(default=True, description="Allow downloads via this link")
    expires_at: Optional[datetime] = Field(default=None, description="Link expiration timestamp")

    model_config = {"from_attributes": True}


class ShareLinkResponse(BaseModel):
    id: str = Field(description="Unique share link identifier")
    wedding_id: str = Field(description="Wedding ID")
    code: str = Field(description="Unique share code")
    url: str = Field(description="Full share URL")
    role: str = Field(description="Default role for shared link users")
    download_enabled: bool = Field(description="Whether downloads are enabled")
    expires_at: Optional[datetime] = Field(default=None, description="Link expiration timestamp")
    access_count: int = Field(default=0, ge=0, description="Number of times accessed")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}
