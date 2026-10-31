import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
