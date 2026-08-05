from sqlalchemy import Column, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import ActivityType, BaseModel


class Activity(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=True,
    )
    user_id = Column(
        String,
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    action = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(20), default=ActivityType.CREATE.value, nullable=False)
    _metadata = Column("metadata", JSON, nullable=True, key="_metadata")

    wedding = relationship("Wedding", back_populates="activities")
    user = relationship("User", back_populates="activities")

    __table_args__ = (
        Index("ix_activity_wedding_id", "wedding_id"),
        Index("ix_activity_user_id", "user_id"),
        Index("ix_activity_type", "type"),
        Index("ix_activity_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Activity(id={self.id}, action={self.action})>"
