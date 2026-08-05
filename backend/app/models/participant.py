from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, ParticipantStatus, WeddingRole


class Participant(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        String,
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), default=WeddingRole.GUEST.value, nullable=False)
    status = Column(
        String(20),
        default=ParticipantStatus.PENDING.value,
        nullable=False,
    )
    invited_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    invited_by = Column(
        String,
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )

    wedding = relationship("Wedding", back_populates="participants")
    user = relationship("User", back_populates="participations", foreign_keys="Participant.user_id")
    invited_by_user = relationship(
        "User",
        back_populates="invited_participations",
        foreign_keys="Participant.invited_by",
    )

    __table_args__ = (
        Index("ix_participant_wedding_id", "wedding_id"),
        Index("ix_participant_user_id", "user_id"),
        Index("ix_participant_status", "status"),
    )

    def __repr__(self):
        return f"<Participant(id={self.id}, name={self.name})>"
