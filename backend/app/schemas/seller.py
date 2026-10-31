import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.listing import ListingSummaryOut
from app.schemas.user import PublicUserOut


class SellerListingPerformance(BaseModel):
    id: uuid.UUID
    title: str
    price: Decimal
    status: str
    category_name: str
    primary_image_url: Optional[str] = None
    views: int
    enquiries: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SellerRecentActivity(BaseModel):
    id: uuid.UUID
    type: str  # new_enquiry, requested, meetup_scheduled, completed, message
    buyer_name: str
    buyer_avatar_url: Optional[str] = None
    listing_title: str
    listing_price: Optional[Decimal] = None
    snippet: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SellerPendingNotice(BaseModel):
    transaction_id: uuid.UUID
    buyer_name: str
    listing_title: str


class SellerDashboardMetrics(BaseModel):
    active_listings: int
    total_views: int
    buyer_enquiries: int
    total_conversations: int
    unread_conversations: int
    items_sold: int
    total_earned_offline: Decimal
    categories_count: int


class SellerDashboardOut(BaseModel):
    metrics: SellerDashboardMetrics
    pending_notice: Optional[SellerPendingNotice] = None
    listing_performance: List[SellerListingPerformance]
    recent_activity: List[SellerRecentActivity]


class SellerListingCounts(BaseModel):
    all: int
    active: int
    draft: int
    reserved: int
    sold: int
    archived: int


class SellerReputationOut(BaseModel):
    user: "PublicUserOut"
    active_listings_count: int
    categories_count: int
    completed_sales_count: int
    total_earned_offline: Decimal
    community_rating: float = 5.0
    reviews_count: int = 0
    active_listings: List["ListingSummaryOut"]
