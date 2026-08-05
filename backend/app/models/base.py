import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import declared_attr

from app.core.database import Base


class UserRole(Enum):
    ADMIN = "admin"
    PHOTOGRAPHER = "photographer"
    EDITOR = "editor"
    CLIENT = "client"
    GUEST = "guest"


class WeddingStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class WeddingVisibility(Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    HIDDEN = "hidden"


class FolderVisibility(Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    HIDDEN = "hidden"


class WeddingRole(Enum):
    PHOTOGRAPHER = "photographer"
    EDITOR = "editor"
    CLIENT = "client"
    GUEST = "guest"


class ParticipantStatus(Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class PermissionType(Enum):
    VIEW = "view"
    DOWNLOAD = "download"
    UPLOAD = "upload"
    DELETE = "delete"
    EDIT = "edit"
    SHARE = "share"


class ActivityType(Enum):
    UPLOAD = "upload"
    DOWNLOAD = "download"
    SHARE = "share"
    EDIT = "edit"
    DELETE = "delete"
    CREATE = "create"
    LOGIN = "login"
    INVITE = "invite"


class NotificationType(Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class DownloadType(Enum):
    SINGLE = "single"
    MULTIPLE = "multiple"
    BULK = "bulk"
    ZIP = "zip"


class DownloadStatus(Enum):
    COMPLETED = "completed"
    PROCESSING = "processing"
    FAILED = "failed"


class TimestampMixin:
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class BaseModel(TimestampMixin, Base):
    __abstract__ = True

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    def to_dict(self):
        return {c.name: getattr(self, c.key) for c in self.__table__.columns}

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
