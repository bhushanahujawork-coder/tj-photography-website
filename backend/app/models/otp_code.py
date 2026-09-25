from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.core.database import Base
from app.models.base import BaseModel


class OtpCode(BaseModel):
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    code_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    # Brute-force guard: count of failed verification attempts for this code.
    attempts = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<OtpCode(id={self.id}, phone={self.phone}, email={self.email})>"