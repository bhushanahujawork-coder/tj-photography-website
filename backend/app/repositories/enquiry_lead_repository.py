from typing import Optional

from sqlalchemy import func, or_, select

from app.models.enquiry_lead import EnquiryLead
from app.repositories.base import BaseRepository


class EnquiryLeadRepository(BaseRepository[EnquiryLead]):
    def __init__(self, session):
        super().__init__(EnquiryLead, session)

    async def get_latest_by_phone(self, phone: str) -> Optional[EnquiryLead]:
        stmt = (
            select(EnquiryLead)
            .where(EnquiryLead.phone == phone)
            .order_by(EnquiryLead.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_filtered(
        self,
        status: str | None = None,
        event_type: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[EnquiryLead], int]:
        conditions = []
        if status:
            conditions.append(EnquiryLead.status == status)
        if event_type:
            conditions.append(EnquiryLead.event_type == event_type)
        if search:
            term = f"%{search.strip()}%"
            conditions.append(
                or_(
                    EnquiryLead.phone.ilike(term),
                    EnquiryLead.couple_name.ilike(term),
                )
            )

        count_stmt = select(func.count(EnquiryLead.id))
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(EnquiryLead)
        if conditions:
            stmt = stmt.where(*conditions)
        stmt = stmt.order_by(EnquiryLead.created_at.desc()).offset(skip).limit(limit)
        items = list((await self.session.execute(stmt)).scalars().all())
        return items, total
