from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    role: str = "user"

class UserCreate(UserBase):
    password: str
    email: EmailStr

class UserResponse(UserBase):
    id: UUID

    class Config:
        from_attributes = True

class GuestSessionResponse(BaseModel):
    session_id: str
    access_token: str
    user: UserResponse
