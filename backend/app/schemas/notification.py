import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: str  # purchase_request, request_accepted, request_rejected, new_message, meetup_scheduled, etc.
    title: str
    message: str
    related_listing_id: Optional[uuid.UUID] = None
    related_transaction_id: Optional[uuid.UUID] = None
    is_read: bool
    created_at: datetime


class UnreadCountResponse(BaseModel):
    unread_count: int
