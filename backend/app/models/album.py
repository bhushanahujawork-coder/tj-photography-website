from sqlalchemy import Column, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class Album(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String(512), nullable=True)
    photo_count = Column(Integer, default=0, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    wedding = relationship("Wedding", back_populates="albums")
    photos = relationship(
        "Photo",
        back_populates="album",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_album_wedding_id", "wedding_id"),
        Index("ix_album_wedding_sort", "wedding_id", "sort_order"),
    )

    def __repr__(self):
        return f"<Album(id={self.id}, name={self.name})>"
