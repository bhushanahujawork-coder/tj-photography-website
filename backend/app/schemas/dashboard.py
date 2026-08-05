from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.activity import ActivityResponse
from app.schemas.wedding import WeddingResponse


class DashboardStatsResponse(BaseModel):
    total_weddings: int = Field(default=0, ge=0, description="Total number of weddings")
    total_photos: int = Field(default=0, ge=0, description="Total number of photos")
    total_storage: int = Field(default=0, ge=0, description="Total storage used in bytes")
    total_downloads: int = Field(default=0, ge=0, description="Total number of downloads")
    active_users: int = Field(default=0, ge=0, description="Number of active users")
    storage_used: int = Field(default=0, ge=0, description="Storage used in bytes")
    storage_limit: int = Field(default=0, ge=0, description="Storage limit in bytes")
    recent_weddings: list[WeddingResponse] = Field(default_factory=list, description="Most recent weddings")

    model_config = {"from_attributes": True}


class RecentActivityResponse(BaseModel):
    activities: list[ActivityResponse] = Field(default_factory=list, description="Recent activity entries")

    model_config = {"from_attributes": True}
