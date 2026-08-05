from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = Field(default=None, description="User email address")
    password: Optional[str] = Field(default=None, description="User password")
    phone: Optional[str] = Field(default=None, description="Phone number for login")

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str = Field(description="JWT access token")
    refresh_token: str = Field(description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_at: datetime = Field(description="Token expiration timestamp")
    user: UserResponse = Field(description="Authenticated user details")

    model_config = {"from_attributes": True}


class OTPRequest(BaseModel):
    phone: Optional[str] = Field(default=None, description="Phone number receiving OTP")
    email: Optional[EmailStr] = Field(default=None, description="Email address receiving OTP")
    otp_code: str = Field(description="One-time password code")

    model_config = {"from_attributes": True}


class OTPResponse(BaseModel):
    success: bool = Field(description="Whether OTP verification succeeded")
    message: str = Field(description="Status message")

    model_config = {"from_attributes": True}


class OTPSendRequest(BaseModel):
    phone: Optional[str] = Field(default=None, description="Phone number to send OTP")
    email: Optional[EmailStr] = Field(default=None, description="Email address to send OTP")

    model_config = {"from_attributes": True}


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(description="JWT refresh token")

    model_config = {"from_attributes": True}


class RefreshTokenResponse(BaseModel):
    access_token: str = Field(description="New JWT access token")
    refresh_token: str = Field(description="New JWT refresh token")
    expires_at: datetime = Field(description="New token expiration timestamp")

    model_config = {"from_attributes": True}


class RegisterRequest(BaseModel):
    email: EmailStr = Field(description="User email address")
    password: str = Field(min_length=8, description="User password")
    name: str = Field(min_length=1, description="Full name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    role: str = Field(default="photographer", description="User role")

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    user: UserResponse = Field(description="Created user details")
    message: str = Field(description="Registration success message")

    model_config = {"from_attributes": True}


class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(description="Email address for password reset")

    model_config = {"from_attributes": True}


class PasswordResetConfirm(BaseModel):
    token: str = Field(description="Password reset token")
    new_password: str = Field(min_length=8, description="New password")

    model_config = {"from_attributes": True}


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = Field(default=None, description="Google ID token")
    access_token: Optional[str] = Field(default=None, description="Google access token")

    model_config = {"from_attributes": True}


class GoogleAuthResponse(BaseModel):
    access_token: str = Field(description="JWT access token")
    refresh_token: str = Field(description="JWT refresh token")
    user: UserResponse = Field(description="Authenticated user details")

    model_config = {"from_attributes": True}
