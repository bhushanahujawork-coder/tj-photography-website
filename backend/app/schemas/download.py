from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.wedding import WeddingResponse


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
    photo_ids: Optional[list[str]] = Field(default=None, description="Photo IDs included in the download")
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
    pin_code: Optional[str] = Field(default=None, description="Optional PIN required to view this gallery")
    expires_at: Optional[datetime] = Field(default=None, description="Link expiration timestamp")

    model_config = {"from_attributes": True}


class ShareLinkResponse(BaseModel):
    id: str = Field(description="Unique share link identifier")
    wedding_id: str = Field(description="Wedding ID")
    code: str = Field(description="Unique share code")
    url: str = Field(description="Full share URL")
    role: str = Field(description="Default role for shared link users")
    download_enabled: bool = Field(description="Whether downloads are enabled")
    pin_code: Optional[str] = Field(default=None, description="Optional PIN required to view this gallery")
    expires_at: Optional[datetime] = Field(default=None, description="Link expiration timestamp")
    access_count: int = Field(default=0, ge=0, description="Number of times accessed")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}


class PinVerifyRequest(BaseModel):
    pin: str = Field(min_length=1, description="PIN to verify for gallery access")

    model_config = {"from_attributes": True}


class PinVerifyResponse(BaseModel):
    valid: bool = Field(description="Whether the PIN is correct")
    code: str = Field(description="Share code the PIN applies to")

    model_config = {"from_attributes": True}


class ShareAlbumResponse(BaseModel):
    """Share-scoped album summary for the public gallery (album tab).

    `photo_count` reflects only photos the share role can actually view
    (never deleted, hidden photos stripped for client/guest roles), and
    `cover_url` is a share-scoped media URL that streams through the
    authorized media route instead of a blind static mount.
    """

    id: str = Field(description="Unique album identifier")
    name: str = Field(description="Album name")
    description: Optional[str] = Field(default=None, description="Album description")
    photo_count: int = Field(ge=0, description="Number of visible photos in the album")
    sort_order: int = Field(default=0, description="Display sort order")
    cover_url: Optional[str] = Field(default=None, description="Share-scoped cover thumbnail URL")
    download_enabled: bool = Field(default=True, description="Whether downloads are enabled for this album")

    model_config = {"from_attributes": True}


class ShareGalleryResponse(BaseModel):
    """Public share-gallery access: wedding profile + share link capabilities.

    Recycled whenever a share code is resolved so clients can render a
    branded gallery header without exposing the whole wedding object to
    unauthenticated callers (same shape the public by-code endpoint exposes).
    """

    wedding: WeddingResponse = Field(description="Wedding profile for the shared gallery")
    share: ShareLinkResponse = Field(description="Resolved share link")
    download_allowed: bool = Field(
        description="True when the link grants download of original-size files",
    )
    liveness_enabled: bool = Field(
        default=False,
        description="True when the gallery requires a selfie liveness check before guest login",
    )

    model_config = {"from_attributes": True}
