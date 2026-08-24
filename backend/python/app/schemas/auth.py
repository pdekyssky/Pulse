from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
