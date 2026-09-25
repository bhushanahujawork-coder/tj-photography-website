from sqlalchemy import JSON, Boolean, Column, Integer, String

from app.core.database import Base
from app.models.base import BaseModel


class EnquiryLead(BaseModel):
    """A quotation/enquiry lead captured from the /quote flow.

    Created when the customer's phone is OTP-verified, updated with the
    quotation when Generate Quotation is submitted. No guest count is stored.
    """

    phone = Column(String(20), nullable=False, index=True)
    phone_verified = Column(Boolean, default=False, nullable=False)
    event_type = Column(String(20), nullable=True)          # wedding | engagement
    couple_name = Column(String(255), nullable=True)
    event_date = Column(String(10), nullable=True)          # YYYY-MM-DD
    venues = Column(JSON, nullable=True)                    # {"day1": ..., "day2": ...} or {"venue": ...}
    package_id = Column(String(100), nullable=True)
    package_name = Column(String(100), nullable=True)
    package_price = Column(Integer, nullable=True)
    add_ons = Column(JSON, nullable=True)                   # [{id, name, price, per_day, qty, line_total}]
    quotation_total = Column(Integer, nullable=True)
    status = Column(String(30), default="NEW", nullable=False, index=True)

    def __repr__(self):
        return f"<EnquiryLead(id={self.id}, phone={self.phone}, status={self.status})>"
