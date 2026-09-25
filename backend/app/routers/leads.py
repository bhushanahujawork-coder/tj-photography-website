from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.schemas.enquiry import (
    LeadListResponse,
    LeadResponse,
    LeadStatusUpdateRequest,
)
from app.services.enquiry_service import EnquiryService

router = APIRouter(prefix="/api/v1", tags=["Leads"])


@router.get("/leads", response_model=LeadListResponse)
async def list_leads(
    status: str | None = Query(default=None),
    event: str | None = Query(default=None),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    current_user: dict = Depends(require_role("admin", "photographer")),
    db: AsyncSession = Depends(get_db),
) -> LeadListResponse:
    items, total = await EnquiryService(db).list_leads(
        status=status, event_type=event, search=search, skip=skip, limit=limit,
    )
    return LeadListResponse(items=items, total=total)


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead_status(
    lead_id: str,
    data: LeadStatusUpdateRequest,
    current_user: dict = Depends(require_role("admin", "photographer")),
    db: AsyncSession = Depends(get_db),
) -> LeadResponse:
    return await EnquiryService(db).update_lead_status(lead_id, data.status)
