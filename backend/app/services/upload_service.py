import io
import logging
import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import NotFoundError, RateLimitError, ValidationError
from app.core.storage import get_storage
from app.repositories.album_repository import AlbumRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.photo_repository import PhotoRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.common import SuccessResponse
from app.schemas.photo import PhotoResponse
from app.schemas.upload import FileAllocation, UploadCompleteRequest, UploadInitResponse, UploadProgressResponse
from app.services.image_service import ImageProcessingService
from app.services.photo_service import PhotoService

logger = logging.getLogger(__name__)


class UploadService:
    _sessions: dict[str, dict] = {}

    def __init__(self, db: AsyncSession):
        self.photo_repo = PhotoRepository(db)
        self.photo_service = PhotoService(db)
        self.wedding_repo = WeddingRepository(db)
        self.album_repo = AlbumRepository(db)
        self.folder_repo = FolderRepository(db)
        self.image_service = ImageProcessingService()
        self.storage = get_storage()

    async def init_upload(self, data, current_user: dict) -> UploadInitResponse:
        wedding = await self.wedding_repo.get(data.wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        if len(data.files) > settings.UPLOAD_MAX_FILES_PER_SESSION:
            raise ValidationError(
                message=f"Upload session exceeds maximum of {settings.UPLOAD_MAX_FILES_PER_SESSION} files"
            )

        user_id = current_user.get("sub")
        active = sum(
            1 for s in self._sessions.values()
            if s.get("user_id") == user_id
            and len(s.get("completed", set())) + len(s.get("failed", set())) < len(s.get("files", []))
        )
        if active >= settings.UPLOAD_MAX_SESSIONS_PER_USER:
            raise RateLimitError(
                message=(
                    f"Maximum of {settings.UPLOAD_MAX_SESSIONS_PER_USER} active upload "
                    "sessions exceeded. Cancel or complete a session first."
                )
            )

        upload_id = str(uuid.uuid4())
        file_allocations: list[FileAllocation] = []
        for i, file_info in enumerate(data.files):
            file_id = str(uuid.uuid4())
            ext = Path(file_info.name).suffix.lower()
            upload_path = self._file_storage_path(data.wedding_id, file_id, ext)
            file_allocations.append(FileAllocation(
                file_id=file_id,
                filename=file_info.name,
                size=file_info.size,
                content_type=file_info.content_type or "image/jpeg",
                upload_url=upload_path,
            ))

        self._sessions[upload_id] = {
            "user_id": user_id,
            "wedding_id": data.wedding_id,
            "album_id": data.album_id,
            "folder_id": data.folder_id,
            "files": file_allocations,
            "completed": set(),
            "failed": set(),
        }

        logger.info("Upload session initialized: %s (%d files)", upload_id, len(file_allocations))
        return UploadInitResponse(
            upload_id=upload_id,
            files=file_allocations,
        )

    def _file_storage_path(self, wedding_id: str, file_id: str, ext: str) -> str:
        return f"weddings/{wedding_id}/originals/{file_id}{ext}"

    async def upload_file(
        self,
        upload_id: str,
        file_id: str,
        file_data: bytes,
        current_user: dict,
    ) -> PhotoResponse:
        session = self._sessions.get(upload_id)
        if not session:
            raise NotFoundError(message="Upload session not found")

        file_info = None
        for f in session["files"]:
            if f.file_id == file_id:
                file_info = f
                break

        if not file_info:
            raise NotFoundError(message="File not found in upload session")

        wedding_id = session["wedding_id"]
        filename = file_info.filename
        content_type = file_info.content_type or "image/jpeg"
        storage_path = self._file_storage_path(wedding_id, file_id, Path(filename).suffix.lower())

        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            session["failed"].add(file_id)
            raise ValidationError(message=f"File type not allowed: {ext}")

        try:
            await self.image_service.validate_bytes(file_data, filename)
        except ValidationError:
            session["failed"].add(file_id)
            raise

        content_type = self.image_service.mime_for_ext(ext)
        await self.storage.save(storage_path, file_data, content_type)

        try:
            exif_data = await self.image_service.extract_exif(file_data)

            wedding = await self.wedding_repo.get(wedding_id)
            watermark_settings = None
            if wedding and wedding.settings:
                gallery = wedding.settings.get("gallery", {})
                branding = wedding.settings.get("branding", {})
                if gallery.get("watermark_enabled", False):
                    watermark_settings = {
                        "enabled": True,
                        "type": branding.get("watermark_type", "text"),
                        "text": branding.get("watermark_text", "TJ Photography"),
                        "position": branding.get("watermark_position", "bottom-center"),
                        "size": branding.get("watermark_size", "medium"),
                        "logo_url": branding.get("photographer_logo", ""),
                    }

            processed = await self.image_service.process(
                storage_path, filename, wedding_id, file_id,
                watermark_settings=watermark_settings,
            )

            uploader_id = current_user.get("sub")

            # PhotoService.create_from_upload creates the row AND bumps the
            # wedding/album/folder photo counters (and registers the face
            # profile) — do not duplicate those increments below.
            photo = await self.photo_service.create_from_upload(
                {
                    "wedding_id": wedding_id,
                    "album_id": session.get("album_id"),
                    "folder_id": session.get("folder_id"),
                    "filename": filename,
                    "original_path": processed.get("original", storage_path),
                    "medium_path": processed.get("medium"),
                    "thumbnail_path": processed.get("thumbnail"),
                    "blur_hash": processed.get("blur_hash"),
                    "width": processed.get("width"),
                    "height": processed.get("height"),
                    "file_size": processed.get("file_size", len(file_data)),
                    "content_type": content_type,
                    "exif_data": exif_data or None,
                    "uploaded_by": uploader_id,
                },
                created_by={"sub": uploader_id},
            )

            if exif_data:
                await self.photo_repo.update(
                    photo.id,
                    camera=exif_data.get("camera"),
                    lens=exif_data.get("lens"),
                    aperture=exif_data.get("aperture"),
                    shutter_speed=exif_data.get("shutter_speed"),
                    iso=exif_data.get("iso"),
                    focal_length=exif_data.get("focal_length"),
                    date_taken=exif_data.get("date_taken"),
                )

            session["completed"].add(file_id)

            model = await self.photo_repo.get(photo.id)
            resp = (
                self.photo_service.to_response(model)
                if model
                else photo
            )
            logger.info("Upload completed: %s for file %s", upload_id, file_id)
            return resp
        except Exception as e:
            session["failed"].add(file_id)
            for orphan in (
                storage_path,
                f"weddings/{wedding_id}/optimized/{file_id}.webp",
                f"weddings/{wedding_id}/thumbnails/{file_id}.webp",
            ):
                try:
                    await self.storage.delete(orphan)
                except Exception:
                    logger.warning("Failed to clean up orphan media: %s", orphan)
            logger.error("Upload processing failed: %s", e)
            raise

    async def complete_upload(
        self, upload_id: str, data: UploadCompleteRequest, current_user: dict
    ) -> UploadProgressResponse:
        """Mark a file as complete and return the session progress.

        The photo is created during ``upload_file``, so this endpoint only
        finalizes the session accounting and reports progress.
        """
        session = self._sessions.get(upload_id)
        if not session:
            raise NotFoundError(message="Upload session not found")

        expected = {f["file_id"] for f in session.get("files", [])}
        if data.file_id not in expected:
            raise ValidationError(message="File not part of this upload session")

        if data.status == "completed":
            session["completed"].add(data.file_id)
        elif data.status == "failed":
            session["failed"].add(data.file_id)

        total = len(expected)
        completed = len(session["completed"])
        failed = len(session["failed"])
        percent = (completed + failed) / total * 100 if total > 0 else 0
        logger.info("Upload complete: %s for file %s", upload_id, data.file_id)
        return UploadProgressResponse(
            upload_id=upload_id,
            total_files=total,
            completed=completed,
            failed=failed,
            progress_percent=round(percent, 2),
        )

    async def get_progress(self, upload_id: str, current_user: dict) -> UploadProgressResponse:
        session = self._sessions.get(upload_id)
        if not session:
            raise NotFoundError(message="Upload session not found")

        total = len(session["files"])
        completed = len(session["completed"])
        failed = len(session["failed"])
        percent = (completed + failed) / total * 100 if total > 0 else 0

        return UploadProgressResponse(
            upload_id=upload_id,
            total_files=total,
            completed=completed,
            failed=failed,
            progress_percent=round(percent, 2),
        )

    async def cancel_upload(self, upload_id: str, current_user: dict) -> SuccessResponse:
        if upload_id not in self._sessions:
            raise NotFoundError(message="Upload session not found")
        del self._sessions[upload_id]
        logger.info("Upload session cancelled: %s", upload_id)
        return SuccessResponse(message="Upload cancelled")
