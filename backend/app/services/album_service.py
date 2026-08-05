import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.album import Album
from app.repositories.album_repository import AlbumRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.album import AlbumResponse

logger = logging.getLogger(__name__)


class AlbumService:
    def __init__(self, db: AsyncSession):
        self.album_repo = AlbumRepository(db)
        self.wedding_repo = WeddingRepository(db)

    async def create_album(self, wedding_id: str, data, current_user: dict) -> AlbumResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        max_order_stmt = (
            select(func.coalesce(func.max(Album.sort_order), -1))
            .where(Album.wedding_id == wedding_id)
        )
        result = await self.album_repo.session.execute(max_order_stmt)
        next_order = (result.scalar() or -1) + 1

        album = await self.album_repo.create(
            wedding_id=wedding_id,
            name=data.name,
            description=data.description,
            cover_image_url=data.cover_image,
            sort_order=next_order,
        )

        await self.wedding_repo.update(
            wedding_id,
            total_albums=wedding.total_albums + 1,
        )

        logger.info("Album created: %s in wedding %s", album.id, wedding_id)
        return AlbumResponse.model_validate(album)

    async def get_album(self, album_id: str, current_user: dict) -> AlbumResponse:
        album = await self.album_repo.get(album_id)
        if not album:
            raise NotFoundError(message="Album not found")
        return AlbumResponse.model_validate(album)

    async def list_albums(self, wedding_id: str, current_user: dict) -> list[AlbumResponse]:
        items, _ = await self.album_repo.get_multi(wedding_id=wedding_id)
        items.sort(key=lambda a: a.sort_order)
        return [AlbumResponse.model_validate(a) for a in items]

    async def update_album(self, album_id: str, data, current_user: dict) -> AlbumResponse:
        album = await self.album_repo.get(album_id)
        if not album:
            raise NotFoundError(message="Album not found")

        updated = await self.album_repo.update(
            album_id,
            name=data.name,
            description=data.description,
            cover_image_url=data.cover_image,
        )
        logger.info("Album updated: %s", album_id)
        return AlbumResponse.model_validate(updated)

    async def delete_album(self, album_id: str, current_user: dict) -> None:
        album = await self.album_repo.get(album_id)
        if not album:
            raise NotFoundError(message="Album not found")

        wedding = await self.wedding_repo.get(album.wedding_id)
        await self.album_repo.delete(album_id)

        if wedding:
            await self.wedding_repo.update(
                album.wedding_id,
                total_albums=max(0, wedding.total_albums - 1),
            )

        logger.info("Album deleted: %s", album_id)

    async def reorder_albums(self, album_ids: list[str]) -> list[AlbumResponse]:
        albums = []
        for i, album_id in enumerate(album_ids):
            album = await self.album_repo.get(album_id)
            if album:
                await self.album_repo.update(album_id, sort_order=i)
                album.sort_order = i
                albums.append(album)
        logger.info("Albums reordered")
        return [AlbumResponse.model_validate(a) for a in albums]
