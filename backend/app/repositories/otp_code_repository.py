from typing import Optional

from sqlalchemy import select

from app.models.otp_code import OtpCode
from app.repositories.base import BaseRepository


class OtpCodeRepository(BaseRepository[OtpCode]):
    def __init__(self, session):
        super().__init__(OtpCode, session)

    async def get_latest_valid(self, phone: str | None = None, email: str | None = None) -> Optional[OtpCode]:
        stmt = select(OtpCode)
        if phone:
            stmt = stmt.where(OtpCode.phone == phone)
        else:
            stmt = stmt.where(OtpCode.email == email)
        stmt = stmt.where(OtpCode.used == False).order_by(OtpCode.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_latest_for_phone(self, phone: str) -> Optional[OtpCode]:
        """Latest OTP row for a phone regardless of used/expiry (cooldown checks)."""
        stmt = (
            select(OtpCode)
            .where(OtpCode.phone == phone)
            .order_by(OtpCode.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def invalidate_for_identifier(
        self, phone: str | None = None, email: str | None = None,
    ) -> None:
        stmt = select(OtpCode)
        if phone:
            stmt = stmt.where(OtpCode.phone == phone)
        else:
            stmt = stmt.where(OtpCode.email == email)
        stmt = stmt.where(OtpCode.used == False)
        result = await self.session.execute(stmt)
        for code in result.scalars().all():
            code.used = True
        await self.session.flush()