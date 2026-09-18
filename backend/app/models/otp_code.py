from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String

from app.core.database import Base
from app.models.base import BaseModel


class OtpCode(BaseModel):
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    code_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<OtpCode(id={self.id}, phone={self.phone}, email={self.email})>"