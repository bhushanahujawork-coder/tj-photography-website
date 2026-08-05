import io
import logging
import zipfile
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.core.security import generate_share_token
from app.core.storage import get_storage
from app.repositories.download_repository import DownloadRepository
from app.repositories.photo_repository import PhotoRepository
from app.repositories.share_link_repository import ShareLinkRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.download import DownloadResponse, DownloadRecordResponse, ShareLinkResponse
from app.services.image_service import ImageProcessingService

logger = logging.getLogger(__name__)


class DownloadService:
    def __init__(self, db: AsyncSession):
        self.download_repo = DownloadRepository(db)
        self.share_link_repo = ShareLinkRepository(db)
        self.wedding_repo = WeddingRepository(db)

    async def create_download(self, data, current_user: dict) -> DownloadResponse:
        wedding = await self.wedding_repo.get(data.wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        download = await self.download_repo.create(
            wedding_id=data.wedding_id,
            user_id=current_user.get("sub"),
            name=f"Download_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
            type=data.type,
            photo_count=len(data.photo_ids),
            total_size=0,
            status="processing",
        )
        logger.info("Download created: %s for wedding %s", download.id, data.wedding_id)
        return DownloadResponse.model_validate(download)

    async def list_downloads(
        self, current_user: dict, page: int = 1, page_size: int = 20,
    ) -> list[DownloadRecordResponse]:
        skip = (page - 1) * page_size
        items, _ = await self.download_repo.get_multi(skip=skip, limit=page_size)
        return [DownloadRecordResponse.model_validate(d) for d in items]

    async def get_download(self, download_id: str, current_user: dict) -> DownloadResponse:
        download = await self.download_repo.get(download_id)
        if not download:
            raise NotFoundError(message="Download not found")
        return DownloadResponse.model_validate(download)

    async def create_share_link(self, wedding_id: str, data, current_user: dict) -> ShareLinkResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        code = generate_share_token()[:8].upper()
        link = await self.share_link_repo.create(
            wedding_id=wedding_id,
            code=code,
            role=data.role or "guest",
            download_enabled=data.download_enabled if hasattr(data, 'download_enabled') else True,
            access_count=0,
        )
        logger.info("Share link created: %s for wedding %s", link.id, wedding_id)
        return ShareLinkResponse(
            id=link.id,
            wedding_id=link.wedding_id,
            code=link.code,
            role=link.role,
            download_enabled=link.download_enabled,
            expires_at=link.expires_at,
            access_count=link.access_count,
            created_at=link.created_at,
        )

    async def list_share_links(self, wedding_id: str, current_user: dict) -> list[ShareLinkResponse]:
        items, _ = await self.share_link_repo.get_multi(wedding_id=wedding_id)
        return [
            ShareLinkResponse(
                id=link.id,
                wedding_id=link.wedding_id,
                code=link.code,
                role=link.role,
                download_enabled=link.download_enabled,
                expires_at=link.expires_at,
                access_count=link.access_count,
                created_at=link.created_at,
            )
            for link in items
        ]

    async def delete_share_link(self, link_id: str, current_user: dict) -> None:
        link = await self.share_link_repo.get(link_id)
        if not link:
            raise NotFoundError(message="Share link not found")
        await self.share_link_repo.delete(link_id)
        logger.info("Share link deleted: %s", link_id)

    async def generate_zip_download(self, download_id: str, current_user: dict) -> tuple[bytes, str]:
        download = await self.download_repo.get(download_id)
        if not download:
            raise NotFoundError(message="Download not found")

        _, photos = await PhotoRepository(self.db).get_multi(wedding_id=download.wedding_id)
        photo_ids = download.photo_ids or [p.id for p in photos]

        image_svc = ImageProcessingService()
        storage = get_storage()
        buf = io.BytesIO()

        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for photo_id in photo_ids:
                photo_repo = PhotoRepository(self.db)
                photo = await photo_repo.get(photo_id)
                if not photo or photo.is_deleted:
                    continue
                result = await image_svc.convert_to_png(photo.original_path)
                if result:
                    png_bytes, png_name = result
                    zf.writestr(png_name, png_bytes)

        zip_bytes = buf.getvalue()
        zip_name = f"tjphotography_{download.wedding_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.zip"
        total_size = len(zip_bytes)

        await self.download_repo.update(
            download.id,
            status="completed",
            total_size=total_size,
            download_url=f"/api/v1/downloads/{download.id}/file",
        )

        return zip_bytes, zip_name

    async def access_share_link(self, code: str) -> ShareLinkResponse:
        link = await self.share_link_repo.get_by_code(code)
        if not link:
            raise NotFoundError(message="Share link not found")

        await self.share_link_repo.update(link.id, access_count=link.access_count + 1)

        return ShareLinkResponse(
            id=link.id,
            wedding_id=link.wedding_id,
            code=link.code,
            role=link.role,
            download_enabled=link.download_enabled,
            expires_at=link.expires_at,
            access_count=link.access_count + 1,
            created_at=link.created_at,
        )
