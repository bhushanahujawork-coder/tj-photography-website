import io
import logging
import zipfile
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.core.security import generate_share_token
from app.core.storage import get_storage
from app.repositories.download_repository import DownloadRepository
from app.repositories.photo_repository import PhotoRepository
from app.repositories.share_link_repository import ShareLinkRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.download import (
    DownloadResponse,
    DownloadRecordResponse,
    ShareGalleryResponse,
    ShareLinkResponse,
)
from app.schemas.wedding import WeddingResponse
from app.services.image_service import ImageProcessingService
from app.services.permission_service import PermissionService

logger = logging.getLogger(__name__)


def _share_url(code: str) -> str:
    return f"/s/{code}"


class DownloadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.download_repo = DownloadRepository(db)
        self.share_link_repo = ShareLinkRepository(db)
        self.wedding_repo = WeddingRepository(db)

    async def create_download(self, data, current_user: dict) -> DownloadResponse:
        from app.core.dependencies import resolve_wedding_role

        wedding = await self.wedding_repo.get(data.wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        role = await resolve_wedding_role(self.db, data.wedding_id, current_user)
        allowed = await PermissionService(self.db).has_permission(
            data.wedding_id, role, "download",
        )
        if not allowed:
            raise ForbiddenError(
                message=f"Permission 'download' denied for role '{role}'"
            )

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
        """List download records.

        Non-admin users only ever see their own records; the global history
        is reserved for admins so one authenticated account cannot enumerate
        every other user's downloads (cross-user data exposure).
        """
        skip = (page - 1) * page_size
        if current_user.get("role") == "admin":
            items = await self.download_repo.list_with_relations(skip=skip, limit=page_size)
        else:
            sub = current_user.get("sub")
            if not sub:
                return []
            items = await self.download_repo.list_with_relations(
                user_id=sub, skip=skip, limit=page_size,
            )
        return [
            DownloadRecordResponse(
                id=d.id,
                wedding_id=d.wedding_id,
                wedding_name=d.wedding.wedding_name if d.wedding else "Unknown wedding",
                user_name=d.user.name if d.user else None,
                type=d.type,
                photo_count=d.photo_count,
                total_size=d.total_size,
                status=d.status,
                created_at=d.created_at,
            )
            for d in items
        ]

    async def get_download(self, download_id: str, current_user: dict) -> DownloadResponse:
        from app.core.dependencies import resolve_wedding_role

        download = await self.download_repo.get(download_id)
        if not download:
            raise NotFoundError(message="Download not found")
        if current_user.get("role") != "admin":
            if download.user_id and download.user_id != current_user.get("sub"):
                raise NotFoundError(message="Download not found")
            await resolve_wedding_role(self.db, download.wedding_id, current_user)
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
            expires_at=getattr(data, "expires_at", None),
            access_count=0,
        )
        logger.info("Share link created: %s for wedding %s", link.id, wedding_id)
        return ShareLinkResponse(
            id=link.id,
            wedding_id=link.wedding_id,
            code=link.code,
            url=_share_url(link.code),
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
                url=_share_url(link.code),
                role=link.role,
                download_enabled=link.download_enabled,
                expires_at=link.expires_at,
                access_count=link.access_count,
                created_at=link.created_at,
            )
            for link in items
        ]

    async def delete_share_link(self, link_id: str, current_user: dict) -> None:
        from app.core.dependencies import resolve_wedding_role

        link = await self.share_link_repo.get(link_id)
        if not link:
            raise NotFoundError(message="Share link not found")
        role = await resolve_wedding_role(self.db, link.wedding_id, current_user)
        allowed = await PermissionService(self.db).has_permission(
            link.wedding_id, role, "share",
        )
        if not allowed:
            raise ForbiddenError(
                message=f"Permission 'share' denied for role '{role}'"
            )
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
        """Resolve a share code. Expired links are treated as not found."""
        link = await self.share_link_repo.get_by_code(code)
        if not link or self._is_expired(link):
            raise NotFoundError(message="Share link not found or expired")

        await self.share_link_repo.update(link.id, access_count=link.access_count + 1)

        return ShareLinkResponse(
            id=link.id,
            wedding_id=link.wedding_id,
            code=link.code,
            url=_share_url(link.code),
            role=link.role,
            download_enabled=link.download_enabled,
            expires_at=link.expires_at,
            access_count=link.access_count + 1,
            created_at=link.created_at,
        )

    @staticmethod
    def _is_expired(link) -> bool:
        if not link.expires_at:
            return False
        return link.expires_at <= datetime.now(timezone.utc)

    async def get_active_share_link(self, code: str):
        link = await self.share_link_repo.get_by_code(code)
        if not link or self._is_expired(link):
            raise NotFoundError(message="Share link not found or expired")
        return link

    async def access_share_gallery(self, code: str) -> ShareGalleryResponse:
        """Resolve a share code into the gallery context (wedding + capabilities).

        Public endpoint backing `/api/v1/share/{code}`. Validates the share
        link the same way the media route does (exists + not expired) and
        derives `download_allowed` from the link + role permission matrix so
        clients can present the correct HD/download affordances.
        """
        link = await self.get_active_share_link(code)
        wedding = await self.wedding_repo.get(link.wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        await self.share_link_repo.update(link.id, access_count=link.access_count + 1)

        download_allowed = link.download_enabled and await self.share_role_has_permission(
            link, "download",
        )

        return ShareGalleryResponse(
            wedding=WeddingResponse.model_validate(wedding),
            share=ShareLinkResponse(
                id=link.id,
                wedding_id=link.wedding_id,
                code=link.code,
                url=_share_url(link.code),
                role=link.role,
                download_enabled=link.download_enabled,
                expires_at=link.expires_at,
                access_count=link.access_count + 1,
                created_at=link.created_at,
            ),
            download_allowed=download_allowed,
        )

    async def share_role_has_permission(self, link, permission: str) -> bool:
        return await PermissionService(self.db).has_permission(
            link.wedding_id, link.role, permission,
        )
