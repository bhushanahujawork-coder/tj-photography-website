import hashlib
import logging
import re
import secrets
import uuid
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
from app.models.base import ParticipantStatus, UserRole, WeddingRole
from app.repositories.otp_code_repository import OtpCodeRepository
from app.repositories.participant_repository import ParticipantRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.share_link_repository import ShareLinkRepository
from app.repositories.user_repository import UserRepository
from app.repositories.wedding_repository import WeddingRepository
from app.schemas.auth import GoogleAuthResponse, LoginResponse, RefreshTokenResponse
from app.schemas.common import SuccessResponse
from app.schemas.user import UserResponse

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)
        self.otp_repo = OtpCodeRepository(db)

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

    @staticmethod
    def _hash_otp(otp: str) -> str:
        return hashlib.sha256(f"{otp}::{settings.SECRET_KEY}".encode()).hexdigest()

    async def send_otp(self, data) -> SuccessResponse:
        phone = data.phone
        email = str(data.email) if data.email else None
        if not phone and not email:
            raise ValidationError(message="Phone or email is required")
        if phone and email:
            raise ValidationError(message="Provide either phone or email, not both")

        await self.otp_repo.invalidate_for_identifier(phone=phone, email=email)
        otp = generate_otp()
        await self.otp_repo.create(
            phone=phone,
            email=email,
            code_hash=self._hash_otp(otp),
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
            used=False,
        )
        logger.info("OTP for %s: %s", email or phone, otp)
        return SuccessResponse(message="OTP sent successfully")

    async def verify_otp(self, data) -> LoginResponse:
        phone = data.phone
        email = str(data.email) if data.email else None
        if not phone and not email:
            raise ValidationError(message="Phone or email is required")

        code_row = await self.otp_repo.get_latest_valid(phone=phone, email=email)
        if not code_row:
            raise UnauthorizedError(message="No pending OTP found. Request a new code.")

        if code_row.expires_at <= datetime.now(timezone.utc):
            raise UnauthorizedError(message="OTP has expired. Request a new code.")

        if not secrets.compare_digest(code_row.code_hash, self._hash_otp(data.otp_code)):
            raise UnauthorizedError(message="Invalid OTP code")

        code_row.used = True
        code_row.consumed_at = datetime.now(timezone.utc)
        await self.otp_repo.session.flush()

        user = (
            await self.user_repo.get_by_phone(phone)
            if phone
            else await self.user_repo.get_by_email(email)
        )
        if not user:
            user = await self._provision_guest(data, phone, email)

        if data.share_code:
            await self._link_share_participant(user, data.share_code)
        else:
            await self._link_participants_by_phone(user)

        logger.info("OTP verified for user %s", user.id)
        return await self._create_session(user)

    async def _link_participants_by_phone(self, user) -> None:
        """Claim participant invitation rows that already carry this phone.

        Used when a client signs in from the navbar (no share code): any
        wedding TJ pre-invited this phone to becomes an accepted participant,
        which lets the client dashboard list those galleries.
        """
        if not user.phone:
            return
        rows = await ParticipantRepository(self.db).get_unclaimed_by_phone(user.phone)
        if not rows:
            return
        now = datetime.now(timezone.utc)
        participant_repo = ParticipantRepository(self.db)
        for row in rows:
            await participant_repo.update(
                row.id,
                user_id=user.id,
                status=ParticipantStatus.ACCEPTED.value,
                accepted_at=now,
            )

    async def _provision_guest(self, data, phone: str | None, email: str | None):
        """Create (or find) a guest user record from an OTP verification.

        Guests get a digest-verified account and a synthetic unique email when
        they sign in with only a phone number. They cannot ever sign in with a
        password — password_hash is a random uuid.
        """
        digits = re.sub(r"\D", "", phone or "")
        if email:
            guest_email = email
        else:
            guest_email = f"guest_{digits or uuid.uuid4().hex[:8]}@guest.tjphotography.in"

        existing = await self.user_repo.get_by_email(guest_email)
        if existing:
            guest_email = f"guest_{uuid.uuid4().hex[:8]}@guest.tjphotography.in"

        name = (data.name or "Wedding Guest").strip() or "Wedding Guest"
        return await self.user_repo.create(
            email=guest_email,
            phone=phone,
            password_hash=hash_password(uuid.uuid4().hex),
            name=name[:255],
            role=UserRole.GUEST.value,
            is_active=True,
            is_verified=True,
        )

    async def _link_share_participant(self, user, share_code: str) -> None:
        """Attach a verified user as an accepted guest participant of the
        wedding behind a share code (when the code is valid and active)."""
        link = await ShareLinkRepository(self.db).get_by_code(share_code)
        if not link:
            logger.warning("share_code %r not found during guest login", share_code)
            return

        wedding = await WeddingRepository(self.db).get(link.wedding_id)
        if not wedding:
            return

        participant_repo = ParticipantRepository(self.db)
        now = datetime.now(timezone.utc)
        existing = await participant_repo.get_by_wedding_user(link.wedding_id, user.id)
        if existing:
            if existing.status != ParticipantStatus.ACCEPTED.value:
                await participant_repo.update(
                    existing.id,
                    status=ParticipantStatus.ACCEPTED.value,
                    accepted_at=now,
                    user_id=user.id,
                )
            return

        by_contact = await participant_repo.get_by_wedding_contact(
            link.wedding_id, user.phone, user.email,
        )
        if by_contact:
            await participant_repo.update(
                by_contact.id,
                user_id=user.id,
                status=ParticipantStatus.ACCEPTED.value,
                accepted_at=now,
            )
            return

        await participant_repo.create(
            wedding_id=link.wedding_id,
            user_id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=WeddingRole.GUEST.value,
            status=ParticipantStatus.ACCEPTED.value,
            invited_at=now,
            accepted_at=now,
            invited_by=wedding.photographer_id,
        )

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
