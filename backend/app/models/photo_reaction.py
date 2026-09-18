from sqlalchemy import Column, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class PhotoReaction(BaseModel):
    photo_id = Column(
        String,
        ForeignKey("photo.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        String,
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )

    photo = relationship("Photo", back_populates="reactions")
    user = relationship("User", back_populates="photo_reactions")

    __table_args__ = (
        UniqueConstraint("photo_id", "user_id", name="uq_photo_reaction_photo_user"),
        Index("ix_photo_reaction_photo_id", "photo_id"),
        Index("ix_photo_reaction_user_id", "user_id"),
    )

    def __repr__(self):
        return f"<PhotoReaction(photo_id={self.photo_id}, user_id={self.user_id})>"