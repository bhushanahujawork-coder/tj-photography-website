from typing import Literal

from fastapi import APIRouter, Depends, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session, get_optional_user, resolve_wedding_role
from app.core.errors import NotFoundError
from app.core.storage import StorageBackend, get_storage
from app.repositories.album_repository import AlbumRepository
from app.repositories.photo_repository import PhotoRepository
from app.services.download_service import DownloadService
from app.services.permission_service import PermissionService

router = APIRouter(prefix="/api/v1/media", tags=["Media"])


async def _render_photo(
    photo,
    size: str,
    storage: StorageBackend,
    can_view: bool,
    can_download: bool,
) -> Response:
    if not can_view:
        raise NotFoundError(message="Photo not found")

    relative = {
        "original": photo.original_path,
        "medium": photo.medium_path,
        "thumbnail": photo.thumbnail_path,
    }[size]
    if not relative:
        raise NotFoundError(message="Photo file not found")
    if size == "original" and not can_download:
        raise NotFoundError(message="Photo not found")

    data = await storage.read(relative)
    if data is None:
        raise NotFoundError(message="Photo file not found")

    media_type = (
        photo.content_type if size == "original" else "image/webp"
    ) or "application/octet-stream"

    return Response(
        content=data,
        media_type=media_type,
        headers={"Cache-Control": "private, max-age=3600"},
    )


async def _album_download_blocked(db: AsyncSession, photo) -> bool:
    """True when the photo's parent album has downloads disabled."""
    if not photo.album_id:
        return False
    album = await AlbumRepository(db).get(photo.album_id)
    return bool(album and not album.download_enabled)


async def _download_allowed(db: AsyncSession, photo, base_ok: bool) -> bool:
    """Hierarchy: link/gallery flag AND album flag AND photo flag."""
    if not base_ok:
        return False
    if not photo.download_enabled:
        return False
    if await _album_download_blocked(db, photo):
        return False
    return True


@router.get("/photos/{photo_id}/content")
async def get_photo_content(
    photo_id: str,
    size: Literal["original", "medium", "thumbnail"] = "medium",
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    storage: StorageBackend = Depends(get_storage),
) -> Response:
    photo = await PhotoRepository(db).get(photo_id)
    if not photo or photo.is_deleted:
        raise NotFoundError(message="Photo not found")

    role = await resolve_wedding_role(db, photo.wedding_id, current_user)
    svc = PermissionService(db)

    required = "download" if size == "original" else "view"
    can_view = await svc.has_permission(photo.wedding_id, role, required)
    hidden = required == "view" and photo.is_hidden and role in ("client", "guest")
    if hidden:
        can_view = False

    download_ok = await _download_allowed(
        db, photo, await svc.has_permission(photo.wedding_id, role, "download"),
    )

    return await _render_photo(
        photo, size, storage,
        can_view=can_view,
        can_download=download_ok,
    )


@router.get("/share/{code}/photos/{photo_id}/content")
async def get_share_photo_content(
    code: str,
    photo_id: str,
    size: Literal["original", "medium", "thumbnail"] = "medium",
    gallery_pin: str | None = Header(default=None, alias="X-Gallery-Pin"),
    current_user: dict | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db_session),
    storage: StorageBackend = Depends(get_storage),
) -> Response:
    """Public share-link media access.

    Enforces: link exists + not expired, gallery PIN, photo belongs to the
    shared wedding, the link role has view/download permission, and the
    download-enabled hierarchy (link -> album -> photo) for originals.
    Hidden photos are never exposed through share links.
    """
    svc = DownloadService(db)
    link = await svc.get_active_share_link(code)
    await svc.enforce_share_access(link, current_user=current_user, gallery_pin=gallery_pin)

    photo = await PhotoRepository(db).get(photo_id)
    if not photo or photo.is_deleted or photo.wedding_id != link.wedding_id:
        raise NotFoundError(message="Photo not found")

    view_ok = await svc.share_role_has_permission(link, "view")
    download_ok = await _download_allowed(
        db, photo,
        link.download_enabled
        and await svc.share_role_has_permission(link, "download"),
    )
    if photo.is_hidden:
        view_ok = False

    can_view = view_ok if size != "original" else (view_ok and download_ok)

    return await _render_photo(photo, size, storage, can_view=can_view, can_download=download_ok)