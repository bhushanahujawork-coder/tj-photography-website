from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class Photo(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=False,
    )
    album_id = Column(
        String,
        ForeignKey("album.id", ondelete="SET NULL"),
        nullable=True,
    )
    folder_id = Column(
        String,
        ForeignKey("folder.id", ondelete="SET NULL"),
        nullable=True,
    )
    filename = Column(String(255), nullable=False)
    original_path = Column(String(512), nullable=False)
    medium_path = Column(String(512), nullable=True)
    thumbnail_path = Column(String(512), nullable=True)
    blur_hash = Column(String(255), nullable=True)
    alt_text = Column(String(500), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)
    content_type = Column(String(100), nullable=True)
    camera = Column(String(255), nullable=True)
    lens = Column(String(255), nullable=True)
    aperture = Column(String(50), nullable=True)
    shutter_speed = Column(String(50), nullable=True)
    iso = Column(Integer, nullable=True)
    focal_length = Column(String(50), nullable=True)
    date_taken = Column(DateTime(timezone=True), nullable=True)
    favorite = Column(Boolean, default=False, nullable=False)
    is_highlight = Column(Boolean, default=False, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    uploaded_by = Column(
        String,
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    exif_data = Column(JSON, nullable=True)

    wedding = relationship("Wedding", back_populates="photos")
    album = relationship("Album", back_populates="photos")
    folder = relationship("Folder", back_populates="photos")
    uploader = relationship("User", back_populates="uploaded_photos")

    __table_args__ = (
        Index("ix_photo_wedding_id", "wedding_id"),
        Index("ix_photo_album_id", "album_id"),
        Index("ix_photo_folder_id", "folder_id"),
        Index("ix_photo_is_deleted", "is_deleted"),
        Index("ix_photo_favorite", "favorite"),
        Index("ix_photo_wedding_album_folder", "wedding_id", "album_id", "folder_id"),
    )

    def __repr__(self):
        return f"<Photo(id={self.id}, filename={self.filename})>"
