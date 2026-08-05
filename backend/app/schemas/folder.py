from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FolderCreateRequest(BaseModel):
    wedding_id: str = Field(description="Parent wedding ID")
    name: str = Field(min_length=1, description="Folder name")
    visibility: Optional[str] = Field(default=None, description="Folder visibility (public/private)")

    model_config = {"from_attributes": True}


class FolderUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, description="Folder name")
    visibility: Optional[str] = Field(default=None, description="Folder visibility (public/private)")
    sort_order: Optional[int] = Field(default=None, description="Display sort order")

    model_config = {"from_attributes": True}


class FolderResponse(BaseModel):
    id: str = Field(description="Unique folder identifier")
    wedding_id: str = Field(description="Parent wedding ID")
    name: str = Field(description="Folder name")
    cover_image_url: Optional[str] = Field(default=None, description="Cover image URL")
    photo_count: int = Field(default=0, ge=0, description="Number of photos in folder")
    sort_order: int = Field(default=0, description="Display sort order")
    visibility: str = Field(description="Folder visibility (public/private)")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}
