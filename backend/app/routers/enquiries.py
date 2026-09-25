from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import pricing_config as pricing
from app.core.database import get_db
from app.core.dependencies import get_enquiry_user
from app.schemas.enquiry import (
    EnquiryCreateRequest,
    EnquiryOtpSendRequest,
    EnquiryOtpSendResponse,
    EnquiryOtpVerifyRequest,
    EnquiryTokenResponse,
    QuotationResponse,
)
from app.services.enquiry_service import EnquiryService

router = APIRouter(prefix="/api/v1", tags=["Enquiries & Quotations"])


@router.get("/enquiries/config")
async def get_enquiry_config():
    """Public pricing/package configuration — the ONLY source of package
    prices for the frontend quotation builder."""
    return pricing.get_public_config()


@router.post("/enquiries/otp/send", response_model=EnquiryOtpSendResponse)
async def send_enquiry_otp(
    data: EnquiryOtpSendRequest,
    db: AsyncSession = Depends(get_db),
) -> EnquiryOtpSendResponse:
    return await EnquiryService(db).send_otp(data.phone)


@router.post("/enquiries/otp/verify", response_model=EnquiryTokenResponse)
async def verify_enquiry_otp(
    data: EnquiryOtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> EnquiryTokenResponse:
    return await EnquiryService(db).verify_otp(data.phone, data.otp_code)


@router.post("/enquiries", response_model=QuotationResponse, status_code=201)
async def create_enquiry_quotation(
    data: EnquiryCreateRequest,
    payload: dict = Depends(get_enquiry_user),
    db: AsyncSession = Depends(get_db),
) -> QuotationResponse:
    """Create the quotation + update the lead.

    The backend recalculates ALL prices from pricing_config — any client
    total is ignored (there is no total field in the request schema).
    """
    return await EnquiryService(db).create_quotation(
        payload["sub"], payload["phone"], data,
    )
