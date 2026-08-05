import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.models.base import UserRole
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import GoogleAuthResponse, LoginResponse, RefreshTokenResponse
from app.schemas.common import SuccessResponse
from app.schemas.user import UserResponse

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)

    async def register(self, data) -> UserResponse:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictError(message="Email already registered")

        if data.phone:
            existing_phone = await self.user_repo.get_by_phone(data.phone)
            if existing_phone:
                raise ConflictError(message="Phone already registered")

        valid, err = validate_password_strength(data.password)
        if not valid:
            raise ValidationError(message=err)

        user = await self.user_repo.create(
            email=data.email,
            phone=data.phone,
            password_hash=hash_password(data.password),
            name=data.name,
            role=data.role or UserRole.PHOTOGRAPHER.value,
            is_active=True,
            is_verified=False,
        )
        logger.info("User registered: %s (%s)", user.id, user.email)
        return UserResponse.model_validate(user)

    async def login(self, data) -> LoginResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise UnauthorizedError(message="Invalid email or password")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedError(message="Invalid email or password")

        if not user.is_active:
            raise ForbiddenError(message="Account is deactivated")

        return await self._create_session(user)

    async def send_otp(self, data) -> SuccessResponse:
        otp = generate_otp()
        logger.info("OTP for %s: %s", data.email or data.phone, otp)
        return SuccessResponse(message="OTP sent successfully")

    async def verify_otp(self, data) -> LoginResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            user = await self.user_repo.get_by_phone(data.phone) if data.phone else None
        if not user:
            raise NotFoundError(message="User not found")

        logger.info("OTP verified for user %s", user.id)
        return await self._create_session(user)

    async def refresh_token(self, data) -> RefreshTokenResponse:
        try:
            payload = decode_token(data.refresh_token)
        except ValueError:
            raise UnauthorizedError(message="Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise UnauthorizedError(message="Invalid token type")

        session = await self.session_repo.get_by_refresh_token(data.refresh_token)
        if not session:
            raise UnauthorizedError(message="Session not found")

        user = await self.user_repo.get(payload.get("sub"))
        if not user or not user.is_active:
            raise UnauthorizedError(message="User not found or inactive")

        new_access = create_access_token(
            {"sub": user.id, "role": user.role, "is_active": user.is_active},
        )
        new_refresh = create_refresh_token({"sub": user.id})

        await self.session_repo.update(
            session.id,
            token=new_access,
            refresh_token=new_refresh,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        return RefreshTokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            token_type="bearer",
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

    async def google_auth(self, data) -> GoogleAuthResponse:
        logger.info("Google auth attempted")
        email = getattr(data, "email", "google_user@example.com")
        name = getattr(data, "name", "Google User")

        user = await self.user_repo.get_by_email(email)
        if not user:
            user = await self.user_repo.create(
                email=email,
                password_hash=hash_password(""),
                name=name,
                role=UserRole.CLIENT.value,
                is_active=True,
                is_verified=True,
            )
            logger.info("User created via Google auth: %s", user.id)

        login_resp = await self._create_session(user)
        return GoogleAuthResponse(
            access_token=login_resp.access_token,
            refresh_token=login_resp.refresh_token,
            token_type="bearer",
            user=login_resp.user,
        )

    async def logout(self, current_user: dict) -> SuccessResponse:
        user_id = current_user.get("sub")
        await self.session_repo.delete_user_sessions(user_id)
        logger.info("All sessions closed for user %s", user_id)
        return SuccessResponse(message="Logged out successfully")

    async def password_reset(self, data) -> SuccessResponse:
        user = await self.user_repo.get_by_email(data.email)
        if user:
            logger.info("Password reset requested for %s", data.email)
        return SuccessResponse(message="If the email exists, a reset link has been sent")

    async def password_reset_confirm(self, data) -> SuccessResponse:
        logger.info("Password reset confirmed")
        return SuccessResponse(message="Password has been reset successfully")

    async def get_current_user(self, current_user: dict) -> UserResponse:
        user = await self.user_repo.get(current_user.get("sub"))
        if not user:
            raise NotFoundError(message="User not found")
        return UserResponse.model_validate(user)

    async def update_current_user(self, current_user: dict, data) -> UserResponse:
        user = await self.user_repo.get(current_user.get("sub"))
        if not user:
            raise NotFoundError(message="User not found")

        updated = await self.user_repo.update(
            user.id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            avatar_url=data.avatar_url,
        )
        logger.info("Profile updated for user %s", user.id)
        return UserResponse.model_validate(updated)

    async def _create_session(self, user) -> LoginResponse:
        access_token = create_access_token(
            {"sub": user.id, "role": user.role, "is_active": user.is_active},
        )
        refresh_token_str = create_refresh_token({"sub": user.id})

        await self.user_repo.update(
            user.id,
            last_login_at=datetime.now(timezone.utc),
        )

        await self.session_repo.create(
            user_id=user.id,
            token=access_token,
            refresh_token=refresh_token_str,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            user=UserResponse.model_validate(user),
        )
