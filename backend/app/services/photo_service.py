import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import NotFoundError
from app.core.storage import get_storage
from app.repositories.album_repository import AlbumRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.photo_repository import PhotoRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.photo import PhotoExifResponse, PhotoResponse

logger = logging.getLogger(__name__)


class PhotoService:
    def __init__(self, db: AsyncSession):
        self.photo_repo = PhotoRepository(db)
        self.wedding_repo = WeddingRepository(db)
        self.album_repo = AlbumRepository(db)
        self.folder_repo = FolderRepository(db)

    def _photo_to_response(self, photo) -> PhotoResponse:
        return PhotoResponse(
            id=photo.id,
            wedding_id=photo.wedding_id,
            album_id=photo.album_id,
            folder_id=photo.folder_id,
            filename=photo.filename,
            original_url=f"/storage/{photo.original_path.replace(os.sep, '/')}",
            medium_url=f"/storage/{photo.medium_path.replace(os.sep, '/')}" if photo.medium_path else None,
            thumbnail_url=f"/storage/{photo.thumbnail_path.replace(os.sep, '/')}" if photo.thumbnail_path else None,
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
            created_at=photo.created_at,
        )

    async def create_from_upload(self, data: dict) -> PhotoResponse:
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

        return self._photo_to_response(photo)

    async def get_photo(self, photo_id: str, current_user: dict) -> PhotoResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        return self._photo_to_response(photo)

    async def list_photos(self, filters, current_user: dict) -> PaginatedResponse[PhotoResponse]:
        skip = (filters.page - 1) * filters.page_size
        items, total = await self.photo_repo.get_multi_filtered(
            wedding_id=filters.wedding_id,
            album_id=filters.album_id,
            folder_id=filters.folder_id,
            search=filters.search,
            favorite=filters.favorite,
            is_highlight=filters.is_highlight,
            is_hidden=filters.is_hidden,
            date_from=filters.date_from,
            date_to=filters.date_to,
            sort_by=filters.sort_by,
            sort_order=filters.sort_order,
            skip=skip,
            limit=filters.page_size,
        )
        pages = max(0, (total + filters.page_size - 1) // filters.page_size)
        return PaginatedResponse[PhotoResponse](
            items=[self._photo_to_response(p) for p in items],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            pages=pages,
        )

    async def update_photo(self, photo_id: str, data, current_user: dict) -> PhotoResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")

        updated = await self.photo_repo.update(
            photo_id,
            album_id=data.album_id,
            folder_id=data.folder_id,
            favorite=data.favorite,
            is_highlight=data.is_highlight,
            is_hidden=data.is_hidden,
            alt_text=data.alt_text,
        )
        logger.info("Photo updated: %s", photo_id)
        return self._photo_to_response(updated)

    async def soft_delete(self, photo_id: str, current_user: dict) -> None:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")
        await self.photo_repo.soft_delete(photo_id)
        logger.info("Photo soft-deleted: %s", photo_id)

    async def batch_update(self, data, current_user: dict) -> list[PhotoResponse]:
        results = []
        for photo_id in data.photo_ids:
            photo = await self.photo_repo.get(photo_id)
            if photo and not photo.is_deleted:
                updated = await self.photo_repo.update(
                    photo_id,
                    album_id=data.updates.album_id,
                    folder_id=data.updates.folder_id,
                    favorite=data.updates.favorite,
                    is_highlight=data.updates.is_highlight,
                    is_hidden=data.updates.is_hidden,
                    alt_text=data.updates.alt_text,
                )
                results.append(self._photo_to_response(updated))
        logger.info("Batch updated %d photos", len(results))
        return results

    async def batch_delete(self, data, current_user: dict) -> dict:
        count = 0
        for photo_id in data.photo_ids:
            photo = await self.photo_repo.get(photo_id)
            if photo and not photo.is_deleted:
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
            if photo and not photo.is_deleted:
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
            if photo and photo.is_deleted:
                await self.photo_repo.update(photo_id, is_deleted=False, deleted_at=None)
                results.append(self._photo_to_response(photo))
        logger.info("Batch restored %d photos", len(results))
        return results

    async def toggle_favorite(self, photo_id: str, current_user: dict) -> PhotoResponse:
        photo = await self.photo_repo.get(photo_id)
        if not photo or photo.is_deleted:
            raise NotFoundError(message="Photo not found")

        updated = await self.photo_repo.update(
            photo_id, favorite=not photo.favorite,
        )
        logger.info("Photo %s favorite toggled: %s", photo_id, updated.favorite)
        return self._photo_to_response(updated)

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

        return PhotoExifResponse(
            camera=photo.camera,
            lens=photo.lens,
            aperture=photo.aperture,
            shutter_speed=photo.shutter_speed,
            iso=photo.iso,
            focal_length=photo.focal_length,
            date_taken=photo.date_taken,
        )
