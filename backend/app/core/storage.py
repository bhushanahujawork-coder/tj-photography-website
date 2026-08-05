import os
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings


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

    async def save(self, path: str, data: bytes, content_type: str) -> str:
        full_path = self.root / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(data)
        return str(full_path)

    async def read(self, path: str) -> bytes | None:
        full_path = self.root / path
        if not full_path.exists():
            return None
        return full_path.read_bytes()

    async def delete(self, path: str) -> None:
        full_path = self.root / path
        if full_path.exists():
            full_path.unlink()

    async def get_url(self, path: str) -> str:
        full_path = self.root / path
        return f"file://{full_path.resolve()}"

    async def exists(self, path: str) -> bool:
        return (self.root / path).exists()

    async def list_files(self, prefix: str) -> list[str]:
        target = self.root / prefix
        if not target.exists():
            return []
        return [
            str(p.relative_to(self.root))
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

    async def save(self, path: str, data: bytes, content_type: str) -> str:
        self.client.put_object(
            Bucket=self.bucket,
            Key=path,
            Body=data,
            ContentType=content_type,
        )
        return path

    async def read(self, path: str) -> bytes | None:
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=path)
            return response["Body"].read()
        except Exception:
            return None

    async def delete(self, path: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=path)

    async def get_url(self, path: str) -> str:
        url = f"{settings.R2_ENDPOINT}/{self.bucket}/{path}"
        return url

    async def exists(self, path: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket, Key=path)
            return True
        except Exception:
            return False

    async def list_files(self, prefix: str) -> list[str]:
        response = self.client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        if "Contents" not in response:
            return []
        return [obj["Key"] for obj in response["Contents"]]


def get_storage() -> StorageBackend:
    if settings.STORAGE_BACKEND == "s3":
        return S3Storage()
    return LocalStorage()
