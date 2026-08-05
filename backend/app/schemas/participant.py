from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ParticipantInviteRequest(BaseModel):
    wedding_id: str = Field(description="Wedding ID to invite participant to")
    email: Optional[str] = Field(default=None, description="Participant email address")
    phone: Optional[str] = Field(default=None, description="Participant phone number")
    name: str = Field(min_length=1, description="Participant name")
    role: str = Field(default="guest", description="Participant role (guest/partner/coordinator)")

    model_config = {"from_attributes": True}


class ParticipantBulkInviteRequest(BaseModel):
    wedding_id: str = Field(description="Wedding ID to invite participants to")
    participants: list[ParticipantInviteRequest] = Field(description="List of participants to invite")

    model_config = {"from_attributes": True}


class ParticipantResponse(BaseModel):
    id: str = Field(description="Unique participant identifier")
    wedding_id: str = Field(description="Wedding ID")
    user_id: Optional[str] = Field(default=None, description="User ID if registered")
    name: str = Field(description="Participant name")
    email: Optional[str] = Field(default=None, description="Participant email")
    phone: Optional[str] = Field(default=None, description="Participant phone")
    role: str = Field(description="Participant role")
    status: str = Field(description="Invitation status (pending/accepted/declined)")
    invited_at: datetime = Field(description="Invitation timestamp")
    accepted_at: Optional[datetime] = Field(default=None, description="Acceptance timestamp")

    model_config = {"from_attributes": True}


class ParticipantUpdateRequest(BaseModel):
    role: Optional[str] = Field(default=None, description="Updated participant role")

    model_config = {"from_attributes": True}


class ParticipantStatusUpdate(BaseModel):
    status: str = Field(description="New invitation status (accept/decline)")

    model_config = {"from_attributes": True}
