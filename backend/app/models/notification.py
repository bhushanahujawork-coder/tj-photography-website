from sqlalchemy import Boolean, Column, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, NotificationType


class Notification(BaseModel):
    user_id = Column(
        String,
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(20), default=NotificationType.INFO.value, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    link = Column(String(512), nullable=True)
    _metadata = Column("metadata", JSON, nullable=True, key="_metadata")

    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("ix_notification_user_id", "user_id"),
        Index("ix_notification_user_read", "user_id", "read"),
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, title={self.title})>"
