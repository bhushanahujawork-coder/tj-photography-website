from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    id: str = Field(description="Unique notification identifier")
    user_id: str = Field(description="Recipient user ID")
    title: str = Field(description="Notification title")
    description: Optional[str] = Field(default=None, description="Notification body text")
    type: str = Field(description="Notification type")
    read: bool = Field(description="Whether the notification has been read")
    link: Optional[str] = Field(default=None, description="Deep link URL")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}


class NotificationUpdateRequest(BaseModel):
    read: bool = Field(description="Mark as read or unread")

    model_config = {"from_attributes": True}


class NotificationBatchUpdate(BaseModel):
    notification_ids: list[str] = Field(description="List of notification IDs to update")
    read: bool = Field(description="Mark all specified notifications as read or unread")

    model_config = {"from_attributes": True}
