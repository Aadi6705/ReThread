import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.category import CategoryOut
from app.schemas.college import CollegeOut
from app.schemas.user import PublicUserOut


class ListingImageBase(BaseModel):
    image_url: str
    cloudinary_public_id: str
    display_order: int = 0


class ListingImageCreate(ListingImageBase):
    pass


class ListingImageOut(ListingImageBase):
    id: uuid.UUID
    listing_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ListingCreate(BaseModel):
    category_id: uuid.UUID
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Price in INR")
    original_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    condition: str = Field(..., pattern="^(like_new|excellent|good|fair)$")
    brand: Optional[str] = Field(None, max_length=100)
    status: str = Field("active", pattern="^(draft|active)$")
    images: List[ListingImageCreate] = Field(..., max_length=5)


class ListingUpdate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    original_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    condition: Optional[str] = Field(None, pattern="^(like_new|excellent|good|fair)$")
    brand: Optional[str] = Field(None, max_length=100)
    images: Optional[List[ListingImageCreate]] = Field(None, max_length=5)


class ListingSummaryOut(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    college_id: uuid.UUID
    category_id: uuid.UUID
    category_name: str
    category_slug: str
    title: str
    price: Decimal
    original_price: Optional[Decimal] = None
    condition: str
    brand: Optional[str] = None
    status: str
    primary_image_url: Optional[str] = None
    campus_name: str
    college_name: str
    seller_name: str
    seller_is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ListingDetailOut(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    college_id: uuid.UUID
    category_id: uuid.UUID
    title: str
    description: str
    price: Decimal
    original_price: Optional[Decimal] = None
    condition: str
    brand: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    category: CategoryOut
    college: CollegeOut
    seller: PublicUserOut
    images: List[ListingImageOut]

    model_config = ConfigDict(from_attributes=True)


class PaginatedListingsResponse(BaseModel):
    items: List[ListingSummaryOut]
    total: int
    page: int
    limit: int
    total_pages: int
