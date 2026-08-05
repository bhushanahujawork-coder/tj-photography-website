from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, WeddingRole


class ShareLink(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=False,
    )
    code = Column(String(50), unique=True, index=True, nullable=False)
    role = Column(String(20), default=WeddingRole.GUEST.value, nullable=False)
    download_enabled = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    access_count = Column(Integer, default=0, nullable=False)

    wedding = relationship("Wedding", back_populates="share_links")

    def __repr__(self):
        return f"<ShareLink(id={self.id}, code={self.code})>"
