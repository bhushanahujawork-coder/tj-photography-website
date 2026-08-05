from sqlalchemy import Boolean, Column, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel, PermissionType, WeddingRole


class Permission(BaseModel):
    wedding_id = Column(
        String,
        ForeignKey("wedding.id", ondelete="CASCADE"),
        nullable=False,
    )
    role = Column(String(20), nullable=False)
    permission = Column(String(20), nullable=False)
    allowed = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("wedding_id", "role", "permission", name="uq_wedding_role_permission"),
    )

    wedding = relationship("Wedding", back_populates="permissions")

    def __repr__(self):
        return f"<Permission(id={self.id}, role={self.role}, permission={self.permission})>"
