import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.listing import ListingSummaryOut


class WishlistOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    listing_id: uuid.UUID
    created_at: datetime
    listing: ListingSummaryOut

    model_config = ConfigDict(from_attributes=True)


class WishlistStatusResponse(BaseModel):
    listing_id: uuid.UUID
    is_wishlisted: bool
