from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, DownloadStatus, DownloadType


class Download(BaseModel):
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
    type = Column(String(20), default=DownloadType.SINGLE.value, nullable=False)
    photo_count = Column(Integer, default=0, nullable=False)
    total_size = Column(Integer, default=0, nullable=False)
    status = Column(
        String(20),
        default=DownloadStatus.PROCESSING.value,
        nullable=False,
    )

    wedding = relationship("Wedding", back_populates="downloads")
    user = relationship("User", back_populates="downloads")

    __table_args__ = (
        Index("ix_download_wedding_id", "wedding_id"),
        Index("ix_download_user_id", "user_id"),
    )

    def __repr__(self):
        return f"<Download(id={self.id}, name={self.name})>"
