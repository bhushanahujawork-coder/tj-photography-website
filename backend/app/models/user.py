from sqlalchemy import Boolean, Column, DateTime, JSON, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, UserRole


class User(BaseModel):
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    role = Column(String(20), default=UserRole.GUEST.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    _metadata = Column("metadata", JSON, nullable=True, key="_metadata")

    weddings_created = relationship(
        "Wedding",
        back_populates="photographer",
        foreign_keys="Wedding.photographer_id",
        cascade="all, delete-orphan",
    )
    participations = relationship(
        "Participant",
        back_populates="user",
        foreign_keys="Participant.user_id",
        cascade="all, delete-orphan",
    )
    invited_participations = relationship(
        "Participant",
        back_populates="invited_by_user",
        foreign_keys="Participant.invited_by",
        cascade="all, delete-orphan",
    )
    uploaded_photos = relationship(
        "Photo",
        back_populates="uploader",
        foreign_keys="Photo.uploaded_by",
        cascade="all, delete-orphan",
    )
    activities = relationship(
        "Activity",
        back_populates="user",
        foreign_keys="Activity.user_id",
        cascade="all, delete-orphan",
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    downloads = relationship(
        "Download",
        back_populates="user",
        foreign_keys="Download.user_id",
        cascade="all, delete-orphan",
    )
    sessions = relationship(
        "Session",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    storage_usage = relationship(
        "StorageUsage",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
