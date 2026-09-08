import os
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings


def _sanitize_relative(path: str) -> str:
    """Reject path traversal in storage keys/relative paths.

    Accepts POSIX and Windows separators but never allows a segment to escape
    the storage root (no '..'), absolute paths, or empty paths.
    """
    if not path or path in (".", "/", "\\"):
        raise ValueError("invalid storage path")
    normalized = path.replace("\\", "/")
    if normalized.startswith("/"):
        raise ValueError("absolute storage path not allowed")
    parts = normalized.split("/")
    if any(p in ("..", "") for p in parts) or ":" in normalized:
        raise ValueError("path traversal detected")
    return normalized


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, path: str, data: bytes, content_type: str) -> str:
        ...

    @abstractmethod
    async def read(self, path: str) -> bytes | None:
        ...

    @abstractmethod
    async def delete(self, path: str) -> None:
        ...

    @abstractmethod
    async def get_url(self, path: str) -> str:
        ...

    @abstractmethod
    async def exists(self, path: str) -> bool:
        ...

    @abstractmethod
    async def list_files(self, prefix: str) -> list[str]:
        ...


class LocalStorage(StorageBackend):
    def __init__(self) -> None:
        self.root = Path(settings.STORAGE_LOCAL_PATH).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def resolve_safe(self, path: str) -> Path:
        """Rescue a relative path under the storage root, forbidding escapes."""
        relative = _sanitize_relative(path)
        full = (self.root / Path(relative)).resolve()
        if full != self.root and self.root not in full.parents:
            raise ValueError("path escapes storage root")
        return full

    async def save(self, path: str, data: bytes, content_type: str) -> str:
        full_path = self.resolve_safe(path)
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(data)
        return str(full_path)

    async def read(self, path: str) -> bytes | None:
        full_path = self.resolve_safe(path)
        if not full_path.exists():
            return None
        return full_path.read_bytes()

    async def delete(self, path: str) -> None:
        full_path = self.resolve_safe(path)
        if full_path.exists():
            full_path.unlink()

    async def get_url(self, path: str) -> str:
        full_path = self.resolve_safe(path)
        return f"file://{full_path}"

    async def exists(self, path: str) -> bool:
        try:
            return self.resolve_safe(path).exists()
        except ValueError:
            return False

    async def list_files(self, prefix: str) -> list[str]:
        relative = _sanitize_relative(prefix)
        target = self.root / Path(relative)
        if not target.exists():
            return []
        return [
            str(p.relative_to(self.root)).replace(os.sep, "/")
            for p in target.rglob("*")
            if p.is_file()
        ]


class S3Storage(StorageBackend):
    def __init__(self) -> None:
        import boto3

        self.client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
        )
        self.bucket = settings.R2_BUCKET
        if not self.bucket:
            raise ValueError("R2_BUCKET must be set when using S3 storage")

    def _key(self, path: str) -> str:
        return _sanitize_relative(path)

    async def save(self, path: str, data: bytes, content_type: str) -> str:
        key = self._key(path)
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return key

    async def read(self, path: str) -> bytes | None:
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=self._key(path))
            return response["Body"].read()
        except Exception:
            return None

    async def delete(self, path: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=self._key(path))

    async def get_url(self, path: str) -> str:
        url = f"{settings.R2_ENDPOINT}/{self.bucket}/{self._key(path)}"
        return url

    async def exists(self, path: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket, Key=self._key(path))
            return True
        except Exception:
            return False

    async def list_files(self, prefix: str) -> list[str]:
        key_prefix = _sanitize_relative(prefix)
        response = self.client.list_objects_v2(Bucket=self.bucket, Prefix=key_prefix)
        if "Contents" not in response:
            return []
        return [obj["Key"] for obj in response["Contents"]]


def get_storage() -> StorageBackend:
    if settings.STORAGE_BACKEND == "s3":
        return S3Storage()
    return LocalStorage()
