from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_db_session
from app.schemas.wedding import WeddingResponse
from app.services.client_service import ClientService

router = APIRouter(prefix="/api/v1/client", tags=["Client"])


async def get_client_service(
    db: AsyncSession = Depends(get_db_session),
) -> ClientService:
    return ClientService(db)


@router.get(
    "/galleries",
    response_model=list[WeddingResponse],
    operation_id="client_galleries",
    summary="List the wedding galleries the current client can access",
)
async def list_client_galleries(
    current_user: dict = Depends(get_current_active_user),
    client_service: ClientService = Depends(get_client_service),
) -> list[WeddingResponse]:
    return await client_service.list_galleries(current_user)