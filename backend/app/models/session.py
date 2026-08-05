from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class Session(BaseModel):
    user_id = Column(
        String,
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    token = Column(String(512), unique=True, index=True, nullable=False)
    refresh_token = Column(String(512), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<Session(id={self.id})>"
