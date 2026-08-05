import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.folder import Folder
from app.repositories.folder_repository import FolderRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.folder import FolderResponse

logger = logging.getLogger(__name__)


class FolderService:
    def __init__(self, db: AsyncSession):
        self.folder_repo = FolderRepository(db)
        self.wedding_repo = WeddingRepository(db)

    async def create_folder(self, wedding_id: str, data, current_user: dict) -> FolderResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        max_order_stmt = (
            select(func.coalesce(func.max(Folder.sort_order), -1))
            .where(Folder.wedding_id == wedding_id)
        )
        result = await self.folder_repo.session.execute(max_order_stmt)
        next_order = (result.scalar() or -1) + 1

        folder = await self.folder_repo.create(
            wedding_id=wedding_id,
            name=data.name,
            visibility=data.visibility or "private",
            sort_order=next_order,
        )

        await self.wedding_repo.update(
            wedding_id,
            total_folders=wedding.total_folders + 1,
        )

        logger.info("Folder created: %s in wedding %s", folder.id, wedding_id)
        return FolderResponse.model_validate(folder)

    async def get_folder(self, folder_id: str, current_user: dict) -> FolderResponse:
        folder = await self.folder_repo.get(folder_id)
        if not folder:
            raise NotFoundError(message="Folder not found")
        return FolderResponse.model_validate(folder)

    async def list_folders(self, wedding_id: str, current_user: dict) -> list[FolderResponse]:
        items, _ = await self.folder_repo.get_multi(wedding_id=wedding_id)
        items.sort(key=lambda f: f.sort_order)
        return [FolderResponse.model_validate(f) for f in items]

    async def update_folder(self, folder_id: str, data, current_user: dict) -> FolderResponse:
        folder = await self.folder_repo.get(folder_id)
        if not folder:
            raise NotFoundError(message="Folder not found")

        updated = await self.folder_repo.update(
            folder_id,
            name=data.name,
            visibility=data.visibility,
            sort_order=data.sort_order,
        )
        logger.info("Folder updated: %s", folder_id)
        return FolderResponse.model_validate(updated)

    async def delete_folder(self, folder_id: str, current_user: dict) -> None:
        folder = await self.folder_repo.get(folder_id)
        if not folder:
            raise NotFoundError(message="Folder not found")

        wedding = await self.wedding_repo.get(folder.wedding_id)
        await self.folder_repo.delete(folder_id)

        if wedding:
            await self.wedding_repo.update(
                folder.wedding_id,
                total_folders=max(0, wedding.total_folders - 1),
            )

        logger.info("Folder deleted: %s", folder_id)

    async def reorder_folder(self, folder_id: str, data, current_user: dict) -> FolderResponse:
        folder = await self.folder_repo.get(folder_id)
        if not folder:
            raise NotFoundError(message="Folder not found")

        updated = await self.folder_repo.update(
            folder_id,
            sort_order=data.sort_order,
        )
        logger.info("Folder %s reordered to %s", folder_id, data.sort_order)
        return FolderResponse.model_validate(updated)
