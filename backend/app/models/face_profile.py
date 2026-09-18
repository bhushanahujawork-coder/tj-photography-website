from sqlalchemy import JSON, Boolean, Column, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class FaceProfile(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=False,
    )
    photo_id = Column(
        String,
        ForeignKey("photo.id", ondelete="CASCADE"),
        nullable=False,
    )
    label = Column(String(255), nullable=True, default=None)
    embedding = Column(JSON, nullable=False)
    face_box = Column(JSON, nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    confidence = Column(Float, nullable=True)
    created_by = Column(
        String,
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )

    wedding = relationship("Wedding", back_populates="face_profiles")
    photo = relationship("Photo", back_populates="face_profiles")
    creator = relationship("User")

    __table_args__ = (
        Index("ix_face_profile_wedding_id", "wedding_id"),
        Index("ix_face_profile_photo_id", "photo_id"),
    )

    def __repr__(self):
        return f"<FaceProfile(id={self.id}, label={self.label})>"