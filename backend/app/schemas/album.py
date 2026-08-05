from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AlbumCreateRequest(BaseModel):
    wedding_id: str = Field(description="Parent wedding ID")
    name: str = Field(min_length=1, description="Album name")
    description: Optional[str] = Field(default=None, description="Album description")
    cover_image: Optional[str] = Field(default=None, description="Cover image URL or file path")

    model_config = {"from_attributes": True}


class AlbumUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, description="Album name")
    description: Optional[str] = Field(default=None, description="Album description")
    cover_image: Optional[str] = Field(default=None, description="Cover image URL or file path")

    model_config = {"from_attributes": True}


class AlbumResponse(BaseModel):
    id: str = Field(description="Unique album identifier")
    wedding_id: str = Field(description="Parent wedding ID")
    name: str = Field(description="Album name")
    description: Optional[str] = Field(default=None, description="Album description")
    cover_image_url: Optional[str] = Field(default=None, description="Cover image URL")
    photo_count: int = Field(default=0, ge=0, description="Number of photos in album")
    sort_order: int = Field(default=0, description="Display sort order")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}
