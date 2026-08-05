from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.schemas.settings import StorageUsageResponse


class UserResponse(BaseModel):
    id: str = Field(description="Unique user identifier")
    name: str = Field(description="Full name")
    email: EmailStr = Field(description="Email address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    avatar_url: Optional[str] = Field(default=None, description="Profile avatar URL")
    role: str = Field(description="User role")
    is_active: bool = Field(description="Whether the user account is active")
    is_verified: bool = Field(description="Whether the user is verified")
    created_at: datetime = Field(description="Account creation timestamp")
    last_login_at: Optional[datetime] = Field(default=None, description="Last login timestamp")

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, description="Full name")
    email: Optional[EmailStr] = Field(default=None, description="Email address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    avatar_url: Optional[str] = Field(default=None, description="Profile avatar URL")

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    id: str = Field(description="Unique user identifier")
    name: str = Field(description="Full name")
    email: EmailStr = Field(description="Email address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    avatar_url: Optional[str] = Field(default=None, description="Profile avatar URL")
    role: str = Field(description="User role")
    is_active: bool = Field(description="Whether the user account is active")
    is_verified: bool = Field(description="Whether the user is verified")
    created_at: datetime = Field(description="Account creation timestamp")
    last_login_at: Optional[datetime] = Field(default=None, description="Last login timestamp")
    storage_usage: StorageUsageResponse = Field(description="Storage usage details")
    stats: dict = Field(default_factory=dict, description="Additional user statistics")

    model_config = {"from_attributes": True}


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(description="Current password for verification")
    new_password: str = Field(min_length=8, description="New password")

    model_config = {"from_attributes": True}


class UserPreferencesRequest(BaseModel):
    language: str = Field(default="en", description="Preferred language code")
    timezone: str = Field(default="UTC", description="Preferred timezone")
    notifications: dict = Field(default_factory=dict, description="Notification preferences")

    model_config = {"from_attributes": True}
