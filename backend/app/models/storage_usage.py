from sqlalchemy import BigInteger, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class StorageUsage(BaseModel):
    user_id = Column(
        String,
        ForeignKey("user.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    total_bytes = Column(BigInteger, default=0, nullable=False)
    limit_bytes = Column(BigInteger, default=1_073_741_824, nullable=False)
    photo_count = Column(Integer, default=0, nullable=False)
    video_count = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="storage_usage")

    def __repr__(self):
        return f"<StorageUsage(id={self.id}, user_id={self.user_id})>"
