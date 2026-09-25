from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class EnquiryOtpSendRequest(BaseModel):
    phone: str = Field(description="10-digit Indian mobile number")


class EnquiryOtpSendResponse(BaseModel):
    message: str
    demo_otp: Optional[str] = Field(
        default=None,
        description="Only present when DEMO_OTP=true (demo mode, no real SMS)",
    )
    expires_in_minutes: int


class EnquiryOtpVerifyRequest(BaseModel):
    phone: str
    otp_code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class EnquiryTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    phone: str
    lead_id: str


class EnquiryAddOnSelection(BaseModel):
    id: str
    # Bounds are validated in the service so violations return 400 (spec),
    # not 422 from Pydantic. Fixed-price add-ons are forced to qty=1 there.
    qty: int = 1


class EnquiryCreateRequest(BaseModel):
    event_type: str
    couple_name: str = Field(min_length=1, max_length=255)
    event_date: str = Field(description="YYYY-MM-DD")
    venues: dict[str, str] = Field(default_factory=dict)
    package_id: str
    add_ons: list[EnquiryAddOnSelection] = Field(default_factory=list)
    # NOTE: no total field — a client-supplied `quotation_total` (or any
    # other extra key) is silently ignored; the backend always recalculates.


class QuotationAddOnLine(BaseModel):
    id: str
    name: str
    price: int
    per_day: bool
    qty: int
    line_total: int


class QuotationPackage(BaseModel):
    id: str
    name: str
    price: int
    inclusions: list[str] = Field(default_factory=list)
    inclusions_note: str


class QuotationResponse(BaseModel):
    """Authoritative quotation — always recalculated by the backend."""

    lead_id: str
    phone: str
    event_type: str
    couple_name: str
    event_date: str
    venues: dict[str, Any]
    package: QuotationPackage
    add_ons: list[QuotationAddOnLine]
    base_price: int
    add_on_total: int
    quotation_total: int
    status: str
    note: str
    created_at: datetime


class LeadResponse(BaseModel):
    id: str
    phone: str
    phone_verified: bool
    event_type: Optional[str] = None
    couple_name: Optional[str] = None
    event_date: Optional[str] = None
    venues: Optional[dict[str, Any]] = None
    package_id: Optional[str] = None
    package_name: Optional[str] = None
    package_price: Optional[int] = None
    add_ons: Optional[list[Any]] = None
    quotation_total: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeadListResponse(BaseModel):
    items: list[LeadResponse]
    total: int


class LeadStatusUpdateRequest(BaseModel):
    status: str
