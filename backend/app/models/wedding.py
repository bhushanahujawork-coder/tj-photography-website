from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, WeddingStatus, WeddingVisibility


class Wedding(BaseModel):
    wedding_name = Column(String(255), nullable=False)
    bride_name = Column(String(255), nullable=False)
    groom_name = Column(String(255), nullable=False)
    wedding_date = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=True)
    wedding_code = Column(String(50), unique=True, index=True, nullable=False)
    cover_image_url = Column(String(512), nullable=True)
    status = Column(String(20), default=WeddingStatus.DRAFT.value, nullable=False)
    visibility = Column(String(20), default=WeddingVisibility.PRIVATE.value, nullable=False)
    photographer_id = Column(
        String,
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    settings = Column(JSON, nullable=True)
    total_photos = Column(Integer, default=0, nullable=False)
    total_albums = Column(Integer, default=0, nullable=False)
    total_folders = Column(Integer, default=0, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

    photographer = relationship(
        "User",
        back_populates="weddings_created",
        foreign_keys="Wedding.photographer_id",
    )
    albums = relationship(
        "Album",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )
    folders = relationship(
        "Folder",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )
    photos = relationship(
        "Photo",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )
    participants = relationship(
        "Participant",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )
    permissions = relationship(
        "Permission",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )
    activities = relationship(
        "Activity",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )
    downloads = relationship(
        "Download",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )
    share_links = relationship(
        "ShareLink",
        back_populates="wedding",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_wedding_photographer_id", "photographer_id"),
        Index("ix_wedding_status", "status"),
        Index("ix_wedding_visibility", "visibility"),
    )

    def __repr__(self):
        return f"<Wedding(id={self.id}, code={self.wedding_code})>"
