from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IncidentEventCreate(BaseModel):
    incident_id: int
    author_id: int
    event_type: str = Field(max_length=30)
    message: str


class IncidentEventCreateBody(BaseModel):
    event_type: str = Field(max_length=30)
    message: str


class IncidentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    author_id: int
    event_type: str
    message: str
    created_at: datetime
