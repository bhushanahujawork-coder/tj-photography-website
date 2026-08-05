from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, FolderVisibility


class Folder(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    cover_image_url = Column(String(512), nullable=True)
    photo_count = Column(Integer, default=0, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    visibility = Column(
        String(20),
        default=FolderVisibility.PRIVATE.value,
        nullable=False,
    )

    wedding = relationship("Wedding", back_populates="folders")
    photos = relationship(
        "Photo",
        back_populates="folder",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_folder_wedding_id", "wedding_id"),
        Index("ix_folder_wedding_sort", "wedding_id", "sort_order"),
    )

    def __repr__(self):
        return f"<Folder(id={self.id}, name={self.name})>"
