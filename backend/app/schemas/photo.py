from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PhotoUploadResponse(BaseModel):
    id: str = Field(description="Unique photo identifier")
    filename: str = Field(description="Original filename")
    status: str = Field(description="Upload status")
    url: str = Field(description="Original size image URL")
    medium_url: Optional[str] = Field(default=None, description="Medium size image URL")
    thumbnail_url: Optional[str] = Field(default=None, description="Thumbnail size image URL")

    model_config = {"from_attributes": True}


class PhotoResponse(BaseModel):
    id: str = Field(description="Unique photo identifier")
    wedding_id: str = Field(description="Parent wedding ID")
    album_id: Optional[str] = Field(default=None, description="Album ID if assigned")
    folder_id: Optional[str] = Field(default=None, description="Folder ID if assigned")
    filename: str = Field(description="Original filename")
    original_url: str = Field(description="Original size image URL")
    medium_url: Optional[str] = Field(default=None, description="Medium size image URL")
    thumbnail_url: Optional[str] = Field(default=None, description="Thumbnail size image URL")
    blur_hash: Optional[str] = Field(default=None, description="Blur hash for placeholder")
    alt_text: Optional[str] = Field(default=None, description="Alt text for accessibility")
    width: Optional[int] = Field(default=None, description="Image width in pixels")
    height: Optional[int] = Field(default=None, description="Image height in pixels")
    file_size: Optional[int] = Field(default=None, ge=0, description="File size in bytes")
    content_type: Optional[str] = Field(default=None, description="MIME content type")
    camera: Optional[str] = Field(default=None, description="Camera model")
    lens: Optional[str] = Field(default=None, description="Lens model")
    aperture: Optional[str] = Field(default=None, description="Aperture value")
    shutter_speed: Optional[str] = Field(default=None, description="Shutter speed")
    iso: Optional[int] = Field(default=None, description="ISO value")
    focal_length: Optional[str] = Field(default=None, description="Focal length")
    date_taken: Optional[datetime] = Field(default=None, description="Photo capture timestamp")
    favorite: bool = Field(default=False, description="Whether marked as favorite")
    is_highlight: bool = Field(default=False, description="Whether marked as highlight")
    is_hidden: bool = Field(default=False, description="Whether hidden from gallery")
    created_at: datetime = Field(description="Upload timestamp")

    model_config = {"from_attributes": True}


class PhotoUpdateRequest(BaseModel):
    album_id: Optional[str] = Field(default=None, description="Album ID to assign")
    folder_id: Optional[str] = Field(default=None, description="Folder ID to assign")
    favorite: Optional[bool] = Field(default=None, description="Mark as favorite")
    is_highlight: Optional[bool] = Field(default=None, description="Mark as highlight")
    is_hidden: Optional[bool] = Field(default=None, description="Hide from gallery")
    alt_text: Optional[str] = Field(default=None, description="Alt text for accessibility")

    model_config = {"from_attributes": True}


class PhotoBatchUpdateRequest(BaseModel):
    photo_ids: list[str] = Field(description="List of photo IDs to update")
    updates: PhotoUpdateRequest = Field(description="Updates to apply to all specified photos")

    model_config = {"from_attributes": True}


class PhotoBatchDeleteRequest(BaseModel):
    photo_ids: list[str] = Field(description="List of photo IDs to delete")
    permanent: Optional[bool] = Field(default=False, description="Permanently delete instead of soft-delete")

    model_config = {"from_attributes": True}


class PhotoBatchMoveRequest(BaseModel):
    photo_ids: list[str] = Field(description="List of photo IDs to move")
    album_id: Optional[str] = Field(default=None, description="Target album ID")
    folder_id: Optional[str] = Field(default=None, description="Target folder ID")

    model_config = {"from_attributes": True}


class PhotoFilterParams(BaseModel):
    wedding_id: Optional[str] = Field(default=None, description="Filter by wedding ID")
    album_id: Optional[str] = Field(default=None, description="Filter by album ID")
    folder_id: Optional[str] = Field(default=None, description="Filter by folder ID")
    search: Optional[str] = Field(default=None, description="Search in filename and alt text")
    favorite: Optional[bool] = Field(default=None, description="Filter by favorite status")
    is_highlight: Optional[bool] = Field(default=None, description="Filter by highlight status")
    is_hidden: Optional[bool] = Field(default=None, description="Filter by hidden status")
    date_from: Optional[datetime] = Field(default=None, description="Filter photos taken after this date")
    date_to: Optional[datetime] = Field(default=None, description="Filter photos taken before this date")
    sort_by: str = Field(default="created_at", description="Field to sort by")
    sort_order: str = Field(default="desc", description="Sort direction (asc/desc)")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=50, ge=1, le=200, description="Items per page")

    model_config = {"from_attributes": True}


class PhotoExifResponse(BaseModel):
    camera: Optional[str] = Field(default=None, description="Camera model")
    lens: Optional[str] = Field(default=None, description="Lens model")
    aperture: Optional[str] = Field(default=None, description="Aperture value")
    shutter_speed: Optional[str] = Field(default=None, description="Shutter speed")
    iso: Optional[int] = Field(default=None, description="ISO value")
    focal_length: Optional[str] = Field(default=None, description="Focal length")
    date_taken: Optional[datetime] = Field(default=None, description="Photo capture timestamp")

    model_config = {"from_attributes": True}
