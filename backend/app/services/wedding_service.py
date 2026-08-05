import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.security import generate_wedding_code
from app.models.base import WeddingStatus
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.common import PaginatedResponse
from app.schemas.wedding import WeddingResponse

logger = logging.getLogger(__name__)


class WeddingService:
    def __init__(self, db: AsyncSession):
        self.wedding_repo = WeddingRepository(db)

    async def create_wedding(self, data, current_user: dict) -> WeddingResponse:
        code = data.wedding_code or generate_wedding_code()

        existing = await self.wedding_repo.get_by_code(code)
        if existing:
            raise ConflictError(message="Wedding code already in use")

        wedding = await self.wedding_repo.create(
            wedding_name=data.wedding_name,
            bride_name=data.bride_name,
            groom_name=data.groom_name,
            wedding_date=data.wedding_date,
            location=data.location,
            wedding_code=code,
            cover_image_url=data.cover_image,
            status=data.status or WeddingStatus.DRAFT.value,
            visibility=data.visibility or "private",
            photographer_id=current_user.get("sub"),
        )
        logger.info("Wedding created: %s by photographer %s", wedding.id, current_user.get("sub"))
        return WeddingResponse.model_validate(wedding)

    async def get_wedding(self, wedding_id: str, current_user: dict) -> WeddingResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")
        return WeddingResponse.model_validate(wedding)

    async def list_weddings(
        self, user: dict, page: int = 1, page_size: int = 20,
        status: str | None = None, search: str | None = None,
        sort_by: str = "created_at", sort_order: str = "desc",
    ) -> PaginatedResponse[WeddingResponse]:
        skip = (page - 1) * page_size
        filters = {}
        if status:
            filters["status"] = status

        items, total = await self.wedding_repo.get_photographer_weddings(
            photographer_id=user.get("sub"),
            skip=skip,
            limit=page_size,
            **filters,
        )
        pages = max(0, (total + page_size - 1) // page_size)
        return PaginatedResponse[WeddingResponse](
            items=[WeddingResponse.model_validate(w) for w in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def update_wedding(self, wedding_id: str, data, current_user: dict) -> WeddingResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        updated = await self.wedding_repo.update(
            wedding_id,
            wedding_name=data.wedding_name,
            bride_name=data.bride_name,
            groom_name=data.groom_name,
            wedding_date=data.wedding_date,
            location=data.location,
            wedding_code=data.wedding_code,
            cover_image_url=data.cover_image,
            status=data.status,
            visibility=data.visibility,
        )
        logger.info("Wedding updated: %s", wedding_id)
        return WeddingResponse.model_validate(updated)

    async def delete_wedding(self, wedding_id: str, current_user: dict) -> None:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")
        await self.wedding_repo.delete(wedding_id)
        logger.info("Wedding deleted: %s", wedding_id)

    async def duplicate_wedding(
        self, wedding_id: str, data, current_user: dict,
    ) -> WeddingResponse:
        original = await self.wedding_repo.get(wedding_id)
        if not original:
            raise NotFoundError(message="Wedding not found")

        code = generate_wedding_code()
        wedding = await self.wedding_repo.create(
            wedding_name=data.new_name or f"{original.wedding_name} (Copy)",
            bride_name=original.bride_name,
            groom_name=original.groom_name,
            wedding_date=original.wedding_date,
            location=original.location,
            wedding_code=code,
            cover_image_url=original.cover_image_url,
            status=WeddingStatus.DRAFT.value,
            visibility=original.visibility,
            photographer_id=original.photographer_id,
        )
        logger.info("Wedding duplicated: %s -> %s", wedding_id, wedding.id)
        return WeddingResponse.model_validate(wedding)

    async def publish_wedding(self, wedding_id: str, data, current_user: dict) -> WeddingResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        updated = await self.wedding_repo.update(
            wedding_id,
            status=WeddingStatus.ACTIVE.value,
            published_at=datetime.now(timezone.utc),
        )
        logger.info("Wedding published: %s", wedding_id)
        return WeddingResponse.model_validate(updated)

    async def archive_wedding(self, wedding_id: str, current_user: dict) -> WeddingResponse:
        wedding = await self.wedding_repo.get(wedding_id)
        if not wedding:
            raise NotFoundError(message="Wedding not found")

        updated = await self.wedding_repo.update(
            wedding_id, status=WeddingStatus.ARCHIVED.value,
        )
        logger.info("Wedding archived: %s", wedding_id)
        return WeddingResponse.model_validate(updated)

    async def get_by_code(self, code: str) -> WeddingResponse:
        wedding = await self.wedding_repo.get_by_code(code)
        if not wedding:
            raise NotFoundError(message="Wedding not found")
        return WeddingResponse.model_validate(wedding)
