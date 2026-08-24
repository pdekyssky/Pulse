from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class IncidentCommentCreateBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1)

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Comment content must not be empty.")
        return stripped


class IncidentCommentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1)

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Comment content must not be empty.")
        return stripped


class IncidentCommentCreate(BaseModel):
    incident_id: int
    author_id: int
    content: str = Field(min_length=1)


class IncidentCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    author_id: int
    content: str
    created_at: datetime
    updated_at: datetime
