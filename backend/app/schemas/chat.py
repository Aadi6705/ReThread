import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ParticipantPublic(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str] = None
    is_email_verified: bool = False
    campus_name: Optional[str] = None


class ListingSnippet(BaseModel):
    id: uuid.UUID
    title: str
    price: Decimal
    status: str
    primary_image_url: Optional[str] = None
    seller_id: uuid.UUID


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    message_text: str
    created_at: datetime
    is_mine: bool = False


class MessageCreate(BaseModel):
    message_text: str = Field(..., min_length=1, max_length=2000)


class ConversationSummary(BaseModel):
    id: uuid.UUID
    listing_id: Optional[uuid.UUID] = None
    transaction_id: Optional[uuid.UUID] = None
    listing: Optional[ListingSnippet] = None
    other_participant: ParticipantPublic
    role: str  # "buying" or "selling"
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    updated_at: datetime


class ConversationDetail(BaseModel):
    id: uuid.UUID
    listing_id: Optional[uuid.UUID] = None
    transaction_id: Optional[uuid.UUID] = None
    listing: Optional[ListingSnippet] = None
    other_participant: ParticipantPublic
    role: str
    messages: List[MessageResponse] = []


class ConversationStartRequest(BaseModel):
    listing_id: uuid.UUID
    initial_message: Optional[str] = Field(None, max_length=2000)
