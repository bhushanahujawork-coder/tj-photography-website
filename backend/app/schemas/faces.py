from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FaceProfileCreateRequest(BaseModel):
    label: Optional[str] = Field(default=None, description="Person label/name for the face profile")
    face_box: Optional[list[int]] = Field(
        default=None,
        description="Face bounding box as [x1, y1, x2, y2] (pixels)",
    )

    model_config = {"from_attributes": True}


class FaceProfileUpdateRequest(BaseModel):
    label: Optional[str] = Field(default=None, description="Person label/name")
    is_primary: Optional[bool] = Field(default=None, description="Mark as the primary profile for a person")
    face_box: Optional[list[int]] = Field(default=None, description="Face bounding box")

    model_config = {"from_attributes": True}


class FaceProfileResponse(BaseModel):
    id: str = Field(description="Unique face profile identifier")
    wedding_id: str = Field(description="Parent wedding ID")
    photo_id: str = Field(description="Source photo ID")
    label: Optional[str] = Field(default=None, description="Person label/name")
    face_box: Optional[list[int]] = Field(default=None, description="Face bounding box")
    is_primary: bool = Field(default=False, description="Whether this is the primary profile")
    confidence: Optional[float] = Field(default=None, description="Face detection confidence")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}


class FaceSearchMatch(BaseModel):
    profile: FaceProfileResponse = Field(description="Matched face profile")
    similarity: float = Field(ge=0.0, le=1.0, description="Cosine similarity score")

    model_config = {"from_attributes": True}


class FaceSearchResponse(BaseModel):
    matches: list[FaceSearchMatch] = Field(default_factory=list, description="Ranked face matches")
    query_detected: bool = Field(default=True, description="Whether a face was detected in the query image")

    model_config = {"from_attributes": True}


class SelfieVerifyResponse(BaseModel):
    verified: bool = Field(description="Whether the selfie passed liveness checks")
    confidence: float = Field(ge=0.0, le=1.0, description="Liveness confidence score")
    message: str = Field(default="", description="Human-friendly verification message")

    model_config = {"from_attributes": True}