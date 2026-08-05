from datetime import datetime
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T] = Field(description="List of items for the current page")
    total: int = Field(ge=0, description="Total number of items across all pages")
    page: int = Field(ge=1, description="Current page number")
    page_size: int = Field(ge=1, description="Number of items per page")
    pages: int = Field(ge=0, description="Total number of pages")

    model_config = {"from_attributes": True}


class ErrorResponse(BaseModel):
    code: str = Field(description="Machine-readable error code")
    message: str = Field(description="Human-readable error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")

    model_config = {"from_attributes": True}


class SuccessResponse(BaseModel):
    message: str = Field(description="Success message")
    data: Optional[dict] = Field(default=None, description="Optional response payload")

    model_config = {"from_attributes": True}


class DateRange(BaseModel):
    start_date: datetime = Field(description="Start of the date range")
    end_date: datetime = Field(description="End of the date range")

    model_config = {"from_attributes": True}
