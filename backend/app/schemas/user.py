import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.schemas.college import CollegeOut


class StudentProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    profile_image: Optional[str] = None
    department: Optional[str] = Field(None, max_length=100)
    course: Optional[str] = Field(None, max_length=100)
    academic_year: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=1000)


class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    profile_image: Optional[str] = None
    department: Optional[str] = Field(None, max_length=100)
    course: Optional[str] = Field(None, max_length=100)
    academic_year: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=1000)


class StudentProfileOut(StudentProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    course: Optional[str] = Field(None, max_length=100)
    academic_year: Optional[str] = Field(None, max_length=50)
    college_id: Optional[uuid.UUID] = None  # If not provided, inferred from domain


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=6, description="Verification token or code")


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    is_email_verified: bool
    account_status: str
    created_at: datetime
    college: Optional[CollegeOut] = None
    profile: Optional[StudentProfileOut] = None

    model_config = ConfigDict(from_attributes=True)


class PublicUserOut(BaseModel):
    id: uuid.UUID
    college_name: str
    campus_name: str
    is_email_verified: bool
    profile: Optional[StudentProfileOut] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
