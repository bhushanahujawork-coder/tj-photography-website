from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_current_user, get_db_session
from app.schemas.auth import (
    GoogleAuthRequest,
    GoogleAuthResponse,
    LoginRequest,
    LoginResponse,
    OTPRequest,
    OTPSendRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.schemas.common import SuccessResponse
from app.schemas.user import UserResponse, UserUpdateRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


async def get_auth_service(
    db: AsyncSession = Depends(get_db_session),
) -> AuthService:
    return AuthService(db)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="auth_register",
    summary="Register a new user account",
)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> RegisterResponse:
    return await auth_service.register(request)


@router.post(
    "/login",
    response_model=LoginResponse,
    operation_id="auth_login",
    summary="Authenticate user and return tokens",
)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    return await auth_service.login(request)


@router.post(
    "/otp/send",
    response_model=SuccessResponse,
    operation_id="auth_otp_send",
    summary="Send OTP code to phone or email",
)
async def send_otp(
    request: OTPSendRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> SuccessResponse:
    return await auth_service.send_otp(request)


@router.post(
    "/otp/verify",
    response_model=LoginResponse,
    operation_id="auth_otp_verify",
    summary="Verify OTP code and authenticate user",
)
async def verify_otp(
    request: OTPRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    return await auth_service.verify_otp(request)


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    operation_id="auth_refresh_token",
    summary="Refresh access token using refresh token",
)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse:
    return await auth_service.refresh_token(request)


@router.post(
    "/google",
    response_model=GoogleAuthResponse,
    operation_id="auth_google",
    summary="Authenticate with Google OAuth",
)
async def google_auth(
    request: GoogleAuthRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> GoogleAuthResponse:
    return await auth_service.google_auth(request)


@router.post(
    "/logout",
    response_model=SuccessResponse,
    operation_id="auth_logout",
    summary="Logout and invalidate current session",
)
async def logout(
    current_user: dict = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> SuccessResponse:
    return await auth_service.logout(current_user)


@router.post(
    "/password/reset",
    response_model=SuccessResponse,
    operation_id="auth_password_reset_request",
    summary="Request password reset email",
)
async def password_reset(
    request: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> SuccessResponse:
    return await auth_service.password_reset(request)


@router.post(
    "/password/reset/confirm",
    response_model=SuccessResponse,
    operation_id="auth_password_reset_confirm",
    summary="Confirm password reset with token",
)
async def password_reset_confirm(
    request: PasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service),
) -> SuccessResponse:
    return await auth_service.password_reset_confirm(request)


@router.get(
    "/me",
    response_model=UserResponse,
    operation_id="auth_get_me",
    summary="Get current authenticated user profile",
)
async def get_me(
    current_user: dict = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    return await auth_service.get_current_user(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    operation_id="auth_update_me",
    summary="Update current user profile",
)
async def update_me(
    request: UserUpdateRequest,
    current_user: dict = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    return await auth_service.update_current_user(current_user, request)
