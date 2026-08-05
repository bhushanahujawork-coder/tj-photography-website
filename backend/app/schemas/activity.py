from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ActivityResponse(BaseModel):
    id: str = Field(description="Unique activity identifier")
    wedding_id: Optional[str] = Field(default=None, description="Related wedding ID")
    user_id: Optional[str] = Field(default=None, description="User who performed the action")
    user_name: Optional[str] = Field(default=None, description="Display name of the user")
    action: str = Field(description="Action performed")
    description: Optional[str] = Field(default=None, description="Human-readable description")
    type: str = Field(description="Activity type category")
    metadata: Optional[dict] = Field(default=None, description="Additional activity metadata")
    created_at: datetime = Field(description="Activity timestamp")

    model_config = {"from_attributes": True}


class ActivityFilterParams(BaseModel):
    wedding_id: Optional[str] = Field(default=None, description="Filter by wedding ID")
    user_id: Optional[str] = Field(default=None, description="Filter by user ID")
    type: Optional[str] = Field(default=None, description="Filter by activity type")
    date_from: Optional[datetime] = Field(default=None, description="Filter activities after this date")
    date_to: Optional[datetime] = Field(default=None, description="Filter activities before this date")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=50, ge=1, le=200, description="Items per page")

    model_config = {"from_attributes": True}
