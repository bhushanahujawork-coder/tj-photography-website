from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.common import PaginatedResponse


class WeddingCreateRequest(BaseModel):
    wedding_name: str = Field(min_length=1, description="Wedding name/title")
    bride_name: str = Field(min_length=1, description="Bride's full name")
    groom_name: str = Field(min_length=1, description="Groom's full name")
    wedding_date: datetime = Field(description="Wedding date and time")
    location: str = Field(min_length=1, description="Wedding venue/location")
    wedding_code: Optional[str] = Field(default=None, description="Custom wedding code (auto-generated if omitted)")
    cover_image: Optional[str] = Field(default=None, description="Cover image URL or file path")
    status: str = Field(default="draft", description="Wedding status (draft/published/archived)")
    visibility: str = Field(default="private", description="Gallery visibility (public/private/unlisted)")

    model_config = {"from_attributes": True}


class WeddingUpdateRequest(BaseModel):
    wedding_name: Optional[str] = Field(default=None, min_length=1, description="Wedding name/title")
    bride_name: Optional[str] = Field(default=None, min_length=1, description="Bride's full name")
    groom_name: Optional[str] = Field(default=None, min_length=1, description="Groom's full name")
    wedding_date: Optional[datetime] = Field(default=None, description="Wedding date and time")
    location: Optional[str] = Field(default=None, min_length=1, description="Wedding venue/location")
    wedding_code: Optional[str] = Field(default=None, description="Custom wedding code")
    cover_image: Optional[str] = Field(default=None, description="Cover image URL or file path")
    status: Optional[str] = Field(default=None, description="Wedding status (draft/published/archived)")
    visibility: Optional[str] = Field(default=None, description="Gallery visibility (public/private/unlisted)")

    model_config = {"from_attributes": True}


class WeddingResponse(BaseModel):
    id: str = Field(description="Unique wedding identifier")
    wedding_name: str = Field(description="Wedding name/title")
    bride_name: str = Field(description="Bride's full name")
    groom_name: str = Field(description="Groom's full name")
    wedding_date: datetime = Field(description="Wedding date and time")
    location: str = Field(description="Wedding venue/location")
    wedding_code: str = Field(description="Unique wedding access code")
    cover_image_url: Optional[str] = Field(default=None, description="Cover image URL")
    status: str = Field(description="Wedding status (draft/published/archived)")
    visibility: str = Field(description="Gallery visibility (public/private/unlisted)")
    total_photos: int = Field(default=0, ge=0, description="Total photo count")
    total_albums: int = Field(default=0, ge=0, description="Total album count")
    total_folders: int = Field(default=0, ge=0, description="Total folder count")
    photographer_id: str = Field(description="Photographer user ID")
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Last update timestamp")
    published_at: Optional[datetime] = Field(default=None, description="Publication timestamp")

    model_config = {"from_attributes": True}


WeddingListResponse = PaginatedResponse[WeddingResponse]


class WeddingPublishRequest(BaseModel):
    action: str = Field(description="Publish action (publish/unpublish)")

    model_config = {"from_attributes": True}


class WeddingDuplicateRequest(BaseModel):
    new_wedding_name: Optional[str] = Field(default=None, min_length=1, description="Name for the duplicated wedding")

    model_config = {"from_attributes": True}
