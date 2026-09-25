import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.core.media import media_url
from app.models.photo_reaction import PhotoReaction
from app.repositories.album_repository import AlbumRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.photo_repository import PhotoRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.photo import PhotoExifResponse, PhotoFilterParams, PhotoReactionResponse, PhotoResponse
from app.services.permission_service import PermissionService

logger = logging.getLogger(__name__)


class PhotoService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.photo_repo = PhotoRepository(db)
        self.wedding_repo = WeddingRepository(db)
        self.album_repo = AlbumRepository(db)
        self.folder_repo = FolderRepository(db)

    async def _require_photo_access(
        self, photo, current_user: dict, permission: str
    ) -> str:
        """Resolve the caller's wedding role and enforce a photo permission.

        Uses 404 on both missing-photo and denied-permission to avoid leaking
        photo existence to unauthorized callers.
        """
        from app.core.dependencies import resolve_wedding_role

        role = await resolve_wedding_role(self.db, photo.wedding_id, current_user)
        allowed = await PermissionService(self.db).has_permission(
            photo.wedding_id, role, permission,
        )
        if not allowed:
            raise NotFoundError(message="Photo not found")
        if permission == "view" and photo.is_hidden and role in ("client", "guest"):
            raise NotFoundError(message="Photo not found")
        return role

    async def _reaction_stats(self, photo_id: str, current_user: dict) -> tuple[int, bool]:
        user_id = current_user.get("sub")
        count_stmt = (
            select(func.count(PhotoReaction.id))
            .where(PhotoReaction.photo_id == photo_id)
        )
        count = (await self.db.execute(count_stmt)).scalar() or 0
        reacted = False
        if user_id:
            mine = await self.db.execute(
                select(PhotoReaction.id).where(
                    PhotoReaction.photo_id == photo_id,
                    PhotoReaction.user_id == user_id,
                )
            )
            reacted = mine.scalar_one_or_none() is not None
        return int(count), reacted

    async def _reaction_stats_map(
        self, photo_ids: list[str], current_user: dict,
    ) -> dict[str, tuple[int, bool]]:
        """Bulk reaction stats for a page of photos: {photo_id: (count, mine)}."""
        if not photo_ids:
            return {}
        user_id = current_user.get("sub")

        rows = await self.db.execute(
            select(
                PhotoReaction.photo_id,
                PhotoReaction.user_id,
            ).where(PhotoReaction.photo_id.in_(photo_ids))
        )
        counts: dict[str, int] = {pid: 0 for pid in photo_ids}
        mine_for: dict[str, bool] = {}
        for photo_id, reactor_id in rows.all():
            counts[photo_id] = counts.get(photo_id, 0) + 1
            if user_id and reactor_id == user_id:
                mine_for[photo_id] = True

        return {
            pid: (counts.get(pid, 0), mine_for.get(pid, False))
            for pid in photo_ids
        }

    def to_response(self, photo) -> PhotoResponse:
        """Public wrapper so sibling services (e.g. UploadService) can build
        a PhotoResponse from a Photo model without touching a private helper."""
        return self._photo_to_response(photo)

    def _photo_to_response(self, photo, reaction_count: int = 0, reacted_by_me: bool = False) -> PhotoResponse:
        return PhotoResponse(
            id=photo.id,
            wedding_id=photo.wedding_id,
            album_id=photo.album_id,
            folder_id=photo.folder_id,
            filename=photo.filename,
            original_url=media_url(photo.id, "original"),
            medium_url=media_url(photo.id, "medium") if photo.medium_path else None,
            thumbnail_url=media_url(photo.id, "thumbnail") if photo.thumbnail_path else None,
            blur_hash=photo.blur_hash,
            alt_text=photo.alt_text,
            width=photo.width,
            height=photo.height,
            file_size=photo.file_size,
            content_type=photo.content_type,
            camera=photo.camera,
            lens=photo.lens,
            aperture=photo.aperture,
            shutter_speed=photo.shutter_speed,
            iso=photo.iso,
            focal_length=photo.focal_length,
            date_taken=photo.date_taken,
            favorite=photo.favorite,
            is_highlight=photo.is_highlight,
            is_hidden=photo.is_hidden,
            download_enabled=photo.download_enabled,
            uploaded_by=photo.uploaded_by,
            reaction_count=reaction_count,
            reacted_by_me=reacted_by_me,
            created_at=photo.created_at,
        )

    @staticmethod
    def _share_media_url(photo_id: str, code: str, size: str) -> str:
        """Public share-scoped media URL. Same content served by the authorized
        media route, but keyed by the share code so unauthenticated gallery
        visitors can stream bytes without any static storage mount."""
        return f"/api/v1/media/share/{code}/photos/{photo_id}/content?size={size}"

    def _share_photo_to_response(self, photo, code: str, reaction_count: int = 0, reacted_by_me: bool = False) -> PhotoResponse:
        return PhotoResponse(
            id=photo.id,
            wedding_id=photo.wedding_id,
            album_id=photo.album_id,
            folder_id=photo.folder_id,
            filename=photo.filename,
            original_url=self._share_media_url(photo.id, code, "original"),
            medium_url=(
                self._share_media_url(photo.id, code, "medium")
                if photo.medium_path else None
            ),
            thumbnail_url=(
                self._share_media_url(photo.id, code, "thumbnail")
                if photo.thumbnail_path else None
            ),
            blur_hash=photo.blur_hash,
            alt_text=photo.alt_text,
            width=photo.width,
            height=photo.height,
            file_size=photo.file_size,
            content_type=photo.content_type,
            camera=photo.camera,
            lens=photo.lens,
            aperture=photo.aperture,
            shutter_speed=photo.shutter_speed,
            iso=photo.iso,
            focal_length=photo.focal_length,
            date_taken=photo.date_taken,
            favorite=photo.favorite,
            is_highlight=photo.is_highlight,
            is_hidden=photo.is_hidden,
            download_enabled=photo.download_enabled,
            uploaded_by=photo.uploaded_by,
            reaction_count=reaction_count,
            reacted_by_me=reacted_by_me,
            created_at=photo.created_at,
        )

    async def list_share_photos(
        self, code: str, filters: PhotoFilterParams,
        current_user: dict | None = None, gallery_pin: str | None = None,
    ) -> PaginatedResponse[PhotoResponse]:
        """Public share-scoped photo listing.

        Requires an active share link whose role has the `view` permission.
        Hidden photos are excluded for client/guest roles. Only photos that
        belong to the shared wedding can ever appear, so a share code can never
        enumerate another wedding's gallery.
        """
        from app.services.download_service import DownloadService

        svc = DownloadService(self.db)
        link = await svc.get_active_share_link(code)
        await svc.enforce_share_access(link, current_user=current_user, gallery_pin=gallery_pin)

        allowed = await PermissionService(self.db).has_permission(link.wedding_id, link.role, "view")
        if not allowed:
            raise ForbiddenError(message=f"Permission 'view' denied for role '{link.role}'")

        hide_invisible = link.role in ("client", "guest")

        # Group setting: "Hide deleted photos from guests" (default ON).
        # When the photographer turns it OFF, soft-deleted photos are listed too.
        wedding = await self.wedding_repo.get(link.wedding_id)
        group = (
            wedding.settings.get("group")
            if wedding and isinstance(wedding.settings, dict)
            and isinstance(wedding.settings.get("group"), dict)
            else {}
        )
        show_deleted = not bool(group.get("hide_deleted", True))

        skip = (filters.page - 1) * filters.page_size
        items, total = await self.photo_repo.get_multi_filtered(
            wedding_id=link.wedding_id,
            album_id=filters.album_id,
            folder_id=filters.folder_id,
            search=filters.search,
            favorite=filters.favorite,
            is_highlight=filters.is_highlight,
            is_hidden=False if hide_invisible else filters.is_hidden,
            include_deleted=show_deleted,
            date_from=filters.date_from,
            date_to=filters.date_to,
            sort_by=filters.sort_by,
            sort_order=filters.sort_order,
            skip=skip,
            limit=filters.page_size,
        )
        stats = await self._reaction_stats_map([p.id for p in items], current_user or {})
        pages = max(0, (total + filters.page_size - 1) // filters.page_size)
        return PaginatedResponse[PhotoResponse](
            items=[
                self._share_photo_to_response(
                    p, code,
                    reaction_count=stats[p.id][0] if p.id in stats else 0,
                    reacted_by_me=stats[p.id][1] if p.id in stats else False,
                )
                for p in items
            ],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            pages=pages,
        )

    async def create_from_upload(self, data: dict, created_by: dict | None = None) -> PhotoResponse:
        photo = await self.photo_repo.create(**data)
        logger.info("Photo created: %s", photo.id)

        wedding = await self.wedding_repo.get(photo.wedding_id)
        if wedding:
            await self.wedding_repo.update(
                photo.wedding_id, total_photos=wedding.total_photos + 1,
            )

        if photo.album_id:
            album = await self.album_repo.get(photo.album_id)
            if album:
                await self.album_repo.update(
                    photo.album_id, photo_count=album.photo_count + 1,
                )

        if photo.folder_id:
            folder = await self.folder_repo.get(photo.folder_id)
            if folder:
                await self.folder_repo.update(
                    photo.folder_id, photo_count=folder.photo_count + 1,
                )

        # Register face profile from photo (offline Pillow heuristic, no GPU needed)
        if created_by:
            from app.services.face_service import FaceService

            face_service = FaceService(self.db)
            try:
                await face_service.register_photo_face(
                    photo_id=photo.id,
                    label=None,
                    face_box=None,
                    created_by=created_by,
                )
                logger.info("Face profile auto-registered for photo: %s", photo.id)
            except Exception as e:
                logger.warning("Face profile registration failed for photo %s: %s", photo.id, e)

        return self._photo_to_response(photo)

    async def get_photo(self, photo_id: str, current_user: dict) -> PhotoResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self._require_photo_access(photo, current_user, "view")
        count, reacted = await self._reaction_stats(photo_id, current_user)
        return self._photo_to_response(photo, count, reacted)

    async def list_photos(self, filters, current_user: dict) -> PaginatedResponse[PhotoResponse]:
        from app.core.dependencies import resolve_wedding_role

        role = await resolve_wedding_role(self.db, filters.wedding_id, current_user)
        allowed = await PermissionService(self.db).has_permission(
            filters.wedding_id, role, "view",
        )
        if not allowed:
            raise ForbiddenError(message=f"Permission 'view' denied for role '{role}'")

        hide_invisible = role in ("client", "guest")
        if hide_invisible:
            filters.is_hidden = False

        if filters.include_deleted:
            delete_allowed = await PermissionService(self.db).has_permission(
                filters.wedding_id, role, "delete",
            )
            if not delete_allowed:
                raise ForbiddenError(
                    message=f"Permission 'delete' denied for role '{role}'"
                )

        skip = (filters.page - 1) * filters.page_size
        items, total = await self.photo_repo.get_multi_filtered(
            wedding_id=filters.wedding_id,
            album_id=filters.album_id,
            folder_id=filters.folder_id,
            search=filters.search,
            favorite=filters.favorite,
            is_highlight=filters.is_highlight,
            is_hidden=filters.is_hidden,
            uploaded_by=filters.uploaded_by,
            is_deleted=True if filters.include_deleted else None,
            date_from=filters.date_from,
            date_to=filters.date_to,
            sort_by=filters.sort_by,
            sort_order=filters.sort_order,
            skip=skip,
            limit=filters.page_size,
        )
        stats = await self._reaction_stats_map([p.id for p in items], current_user)
        pages = max(0, (total + filters.page_size - 1) // filters.page_size)
        return PaginatedResponse[PhotoResponse](
            items=[
                self._photo_to_response(
                    p,
                    reaction_count=stats[p.id][0] if p.id in stats else 0,
                    reacted_by_me=stats[p.id][1] if p.id in stats else False,
                )
                for p in items
            ],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            pages=pages,
        )

    async def update_photo(self, photo_id: str, data, current_user: dict) -> PhotoResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self._require_photo_access(photo, current_user, "edit")

        updated = await self.photo_repo.update(
            photo_id,
            album_id=data.album_id,
            folder_id=data.folder_id,
            favorite=data.favorite,
            is_highlight=data.is_highlight,
            is_hidden=data.is_hidden,
            download_enabled=data.download_enabled,
            alt_text=data.alt_text,
        )
        logger.info("Photo updated: %s", photo_id)
        count, reacted = await self._reaction_stats(photo_id, current_user)
        return self._photo_to_response(updated, count, reacted)

    async def soft_delete(self, photo_id: str, current_user: dict) -> None:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self._require_photo_access(photo, current_user, "delete")
        await self.photo_repo.soft_delete(photo_id)
        logger.info("Photo soft-deleted: %s", photo_id)

    async def batch_update(self, data, current_user: dict) -> list[PhotoResponse]:
        results = []
        for photo_id in data.photo_ids:
            photo = await self.photo_repo.get(photo_id)
            if not photo or photo.is_deleted:
                continue
            try:
                await self._require_photo_access(photo, current_user, "edit")
            except NotFoundError:
                continue
            updated = await self.photo_repo.update(
                photo_id,
                album_id=data.updates.album_id,
                folder_id=data.updates.folder_id,
                favorite=data.updates.favorite,
                is_highlight=data.updates.is_highlight,
                is_hidden=data.updates.is_hidden,
                download_enabled=data.updates.download_enabled,
                alt_text=data.updates.alt_text,
            )
            results.append(self._photo_to_response(updated))
        logger.info("Batch updated %d photos", len(results))
        return results

    async def batch_delete(self, data, current_user: dict) -> dict:
        count = 0
        for photo_id in data.photo_ids:
            photo = await self.photo_repo.get(photo_id)
            if not photo or photo.is_deleted:
                continue
            try:
                await self._require_photo_access(photo, current_user, "delete")
            except NotFoundError:
                continue
            if data.permanent:
                await self.photo_repo.delete(photo_id)
            else:
                await self.photo_repo.soft_delete(photo_id)
            count += 1
        logger.info("Batch deleted %d photos", count)
        return SuccessResponse(message=f"{count} photos deleted", data={"deleted": count})

    async def batch_move(self, data, current_user: dict) -> list[PhotoResponse]:
        results = []
        for photo_id in data.photo_ids:
            photo = await self.photo_repo.get(photo_id)
            if not photo or photo.is_deleted:
                continue
            try:
                await self._require_photo_access(photo, current_user, "edit")
            except NotFoundError:
                continue
            updated = await self.photo_repo.update(
                photo_id,
                album_id=data.album_id,
                folder_id=data.folder_id,
            )
            results.append(self._photo_to_response(updated))
        logger.info("Batch moved %d photos", len(results))
        return results

    async def batch_restore(self, data, current_user: dict) -> list[PhotoResponse]:
        results = []
        for photo_id in data.photo_ids:
            photo = await self.photo_repo.get(photo_id)
            if not photo or not photo.is_deleted:
                continue
            try:
                await self._require_photo_access(photo, current_user, "delete")
            except NotFoundError:
                continue
            await self.photo_repo.update(photo_id, is_deleted=False, deleted_at=None)
            results.append(self._photo_to_response(photo))
        logger.info("Batch restored %d photos", len(results))
        return results

    async def set_reaction(
        self, photo_id: str, reacted: bool, current_user: dict,
    ) -> PhotoReactionResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self._require_photo_access(photo, current_user, "view")

        user_id = current_user.get("sub")
        from app.repositories.photo_reaction_repository import PhotoReactionRepository

        reaction_repo = PhotoReactionRepository(self.db)
        existing = await reaction_repo.get_by_photo_user(photo_id, user_id)

        if reacted and not existing:
            await reaction_repo.create(photo_id=photo_id, user_id=user_id)
        elif not reacted and existing:
            await reaction_repo.delete(existing.id)

        count, mine = await self._reaction_stats(photo_id, current_user)
        logger.info("Photo %s reaction set to %s (count=%d)", photo_id, reacted, count)
        return PhotoReactionResponse(
            photo_id=photo_id,
            reacted=mine,
            reaction_count=count,
            reacted_by_me=mine,
        )

    async def toggle_favorite(self, photo_id: str, current_user: dict) -> PhotoResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self._require_photo_access(photo, current_user, "view")

        updated = await self.photo_repo.update(
            photo_id, favorite=not photo.favorite,
        )
        logger.info("Photo %s favorite toggled: %s", photo_id, updated.favorite)
        count, reacted = await self._reaction_stats(photo_id, current_user)
        return self._photo_to_response(updated, count, reacted)

    async def _require_download_access(self, photo, current_user: dict) -> str:
        """Photo download permission + the gallery-level download switch.

        The photographer/platform admin can always download their own photos;
        everyone else is blocked when settings → Gallery → downloads are off.
        """
        role = await self._require_photo_access(photo, current_user, "download")
        if role in ("photographer", "admin"):
            return role
        wedding = await self.wedding_repo.get(photo.wedding_id)
        settings = wedding.settings if wedding and isinstance(wedding.settings, dict) else {}
        gallery = settings.get("gallery") if isinstance(settings.get("gallery"), dict) else {}
        if not bool(gallery.get("download_enabled", True)):
            raise ForbiddenError(message="Downloads are disabled for this gallery")
        return role

    async def download_photos_batch(self, photo_ids: list[str], current_user: dict) -> tuple[bytes, str]:
        import io
        import zipfile
        from datetime import datetime, timezone
        from app.services.image_service import ImageProcessingService

        svc = ImageProcessingService()
        buf = io.BytesIO()

        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for pid in photo_ids:
                photo = await self.photo_repo.get(pid)
                if not photo or photo.is_deleted:
                    continue
                try:
                    await self._require_download_access(photo, current_user)
                except NotFoundError:
                    continue
                result = await svc.convert_to_png(photo.original_path)
                if result:
                    png_bytes, png_name = result
                    zf.writestr(png_name, png_bytes)

        zip_name = f"tjphotography_download_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.zip"
        return buf.getvalue(), zip_name

    async def download_photo(self, photo_id: str, current_user: dict) -> tuple[bytes, str, str]:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self._require_download_access(photo, current_user)

        from app.services.image_service import ImageProcessingService
        svc = ImageProcessingService()
        result = await svc.convert_to_png(photo.original_path)
        if result is None:
            raise NotFoundError(message="Photo file not found on storage")

        png_bytes, png_filename = result
        return png_bytes, png_filename, "image/png"

    async def get_exif(self, photo_id: str, current_user: dict) -> PhotoExifResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self._require_photo_access(photo, current_user, "view")

        return PhotoExifResponse(
            camera=photo.camera,
            lens=photo.lens,
            aperture=photo.aperture,
            shutter_speed=photo.shutter_speed,
            iso=photo.iso,
            focal_length=photo.focal_length,
            date_taken=photo.date_taken,
        )
