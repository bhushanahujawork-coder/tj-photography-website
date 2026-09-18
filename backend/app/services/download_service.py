import io
import logging
import re
import zipfile
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.core.security import generate_share_token
from app.core.storage import get_storage
from app.models.album import Album
from app.models.photo import Photo
from app.repositories.download_repository import DownloadRepository
from app.repositories.photo_repository import PhotoRepository
from app.repositories.share_link_repository import ShareLinkRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.download import (
    DownloadResponse,
    DownloadRecordResponse,
    ShareAlbumResponse,
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

        if getattr(data, "pin", None):
            self._check_wedding_pin(wedding, data.pin)

        download = await self.download_repo.create(
            wedding_id=data.wedding_id,
            user_id=current_user.get("sub"),
            name=f"Download_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
            type=data.type,
            photo_count=len(data.photo_ids),
            photo_ids=data.photo_ids,
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
            pin_code=getattr(data, "pin_code", None),
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
            pin_code=link.pin_code,
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
                pin_code=link.pin_code,
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
            pin_code=link.pin_code,
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

    @staticmethod
    def _gallery_flag(wedding, key: str, default):
        settings = wedding.settings or {}
        gallery = settings.get("gallery") if isinstance(settings.get("gallery"), dict) else {}
        return gallery.get(key, default)

    @staticmethod
    def _check_wedding_pin(wedding, pin: str | None) -> None:
        """Validate the gallery PIN stored in wedding settings when pin_protection is on."""
        settings = wedding.settings or {}
        gallery = settings.get("gallery") if isinstance(settings.get("gallery"), dict) else {}
        if gallery.get("pin_protection") and gallery.get("pin_code"):
            if not pin or pin != str(gallery.get("pin_code")):
                raise ForbiddenError(message="Invalid or missing gallery PIN")

    async def enforce_share_access(
        self, link, current_user: dict | None = None, gallery_pin: str | None = None,
    ) -> None:
        """Enforce gallery PIN + anonymous-viewing policy for a share access.

        * PIN: when the share link has a pin_code, the ``X-Gallery-Pin`` header
          must match before any gallery data or media is served.
        * Anonymous: when the wedding disables ``anonymous_viewing``, an
          authenticated participant of the wedding is required.
        """
        if link.pin_code:
            if not gallery_pin or gallery_pin != str(link.pin_code):
                raise ForbiddenError(
                    message="Gallery PIN required",
                    code="gallery_pin_required",
                )

        wedding = await self.wedding_repo.get(link.wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        anonymous_ok = self._gallery_flag(wedding, "anonymous_viewing", True)
        if anonymous_ok:
            return

        if not current_user or not current_user.get("sub"):
            raise ForbiddenError(
                message="Authentication required to view this gallery",
                code="participant_required",
            )

        from app.core.dependencies import resolve_wedding_role

        try:
            await resolve_wedding_role(self.db, link.wedding_id, current_user)
        except ForbiddenError:
            raise ForbiddenError(
                message="Authentication required to view this gallery",
                code="participant_required",
            )

    async def verify_share_pin(self, code: str, pin: str) -> bool:
        link = await self.get_active_share_link(code)
        if not link.pin_code:
            return True
        return str(link.pin_code) == str(pin)

    async def access_share_gallery(
        self, code: str, current_user: dict | None = None, gallery_pin: str | None = None,
    ) -> ShareGalleryResponse:
        """Resolve a share code into the gallery context (wedding + capabilities).

        Public endpoint backing `/api/v1/share/{code}`. Validates the share
        link the same way the media route does (exists + not expired) and
        derives `download_allowed` from the link + role permission matrix so
        clients can present the correct HD/download affordances.
        """
        link = await self.get_active_share_link(code)
        await self.enforce_share_access(link, current_user=current_user, gallery_pin=gallery_pin)
        wedding = await self.wedding_repo.get(link.wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        await self.share_link_repo.update(link.id, access_count=link.access_count + 1)

        download_allowed = link.download_enabled and await self.share_role_has_permission(
            link, "download",
        )

        group_settings = (wedding.settings or {}).get("group") or {}
        liveness_enabled = bool(
            group_settings.get("liveness_enabled", False)
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
                pin_code=link.pin_code,
                expires_at=link.expires_at,
                access_count=link.access_count + 1,
                created_at=link.created_at,
            ),
            download_allowed=download_allowed,
            liveness_enabled=liveness_enabled,
        )

    async def share_role_has_permission(self, link, permission: str) -> bool:
        return await PermissionService(self.db).has_permission(
            link.wedding_id, link.role, permission,
        )

    async def list_share_albums(
        self, code: str, current_user: dict | None = None, gallery_pin: str | None = None,
    ) -> list[ShareAlbumResponse]:
        """Public share-scoped album listing backing ``/share/{code}/albums``.

        Mirrors the photo-listing security model: active link + PIN/anonymous
        access + the link role must hold ``view``. Photo counts count only
        photos the role can actually see (never deleted; hidden stripped for
        client/guest roles), and covers are share-scoped thumbnail URLs so a
        custom absolute cover can be honored without ever exposing admin-only
        media routes.
        """
        link = await self.get_active_share_link(code)
        await self.enforce_share_access(link, current_user=current_user, gallery_pin=gallery_pin)

        allowed = await PermissionService(self.db).has_permission(
            link.wedding_id, link.role, "view",
        )
        if not allowed:
            raise ForbiddenError(message=f"Permission 'view' denied for role '{link.role}'")

        hide_invisible = link.role in ("client", "guest")
        visible_filter = [Photo.is_deleted == False]
        if hide_invisible:
            visible_filter.append(Photo.is_hidden == False)

        albums_result = await self.db.execute(
            select(Album)
            .where(Album.wedding_id == link.wedding_id)
            .order_by(Album.sort_order.asc(), Album.created_at.asc())
        )
        albums = list(albums_result.scalars().all())
        if not albums:
            return []

        album_ids = [a.id for a in albums]

        count_result = await self.db.execute(
            select(Album.id, func.count(Photo.id))
            .join(Photo, Photo.album_id == Album.id)
            .where(Album.id.in_(album_ids), *visible_filter)
            .group_by(Album.id)
        )
        counts: dict[str, int] = {pid: 0 for pid in album_ids}
        for album_id, count in count_result.all():
            counts[album_id] = int(count)

        cover_result = await self.db.execute(
            select(Photo.album_id, Photo.id)
            .where(Photo.album_id.in_(album_ids), *visible_filter)
            .order_by(Photo.created_at.desc())
        )
        covers: dict[str, str] = {}
        for album_id, photo_id in cover_result.all():
            covers.setdefault(album_id, photo_id)

        def _cover_url(album: Album) -> str | None:
            custom = album.cover_image_url
            if custom and re.match(r"^https?://", custom):
                return custom
            photo_id = covers.get(album.id)
            if photo_id:
                return f"/api/v1/media/share/{code}/photos/{photo_id}/content?size=thumbnail"
            return None

        return [
            ShareAlbumResponse(
                id=album.id,
                name=album.name,
                description=album.description,
                photo_count=counts.get(album.id, 0),
                sort_order=album.sort_order,
                cover_url=_cover_url(album),
            )
            for album in albums
        ]
