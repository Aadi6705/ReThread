import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CollegeBase(BaseModel):
    name: str
    email_domain: str
    campus_name: str
    location: str


class CollegeCreate(CollegeBase):
    pass


class CollegeOut(CollegeBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
