import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.listing import ListingSummaryOut
from app.schemas.user import PublicUserOut


class TransactionCreate(BaseModel):
    listing_id: uuid.UUID
    buyer_message: Optional[str] = Field(None, max_length=1000)


class TransactionScheduleMeetup(BaseModel):
    meetup_location: str = Field(..., min_length=3, max_length=255)
    meetup_datetime: datetime


class TransactionCancel(BaseModel):
    reason: str = Field(..., min_length=2, max_length=500)


class TransactionDispute(BaseModel):
    reason: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=5, max_length=2000)


class SalesSummaryOut(BaseModel):
    completed_sales: int
    total_earned_offline: Decimal
    products_sold: int


class TransactionOut(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    status: str  # requested, accepted, rejected, meetup_scheduled, completed, cancelled, disputed
    buyer_message: Optional[str] = None
    meetup_location: Optional[str] = None
    meetup_datetime: Optional[datetime] = None
    buyer_confirmed: bool
    seller_confirmed: bool
    requested_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    listing: Optional[ListingSummaryOut] = None
    buyer: Optional[PublicUserOut] = None
    seller: Optional[PublicUserOut] = None

    model_config = ConfigDict(from_attributes=True)
