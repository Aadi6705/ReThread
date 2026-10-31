from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.category import CategoryOut
from app.services.listing_service import ListingService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut], status_code=status.HTTP_200_OK)
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Fetch all active marketplace categories."""
    categories = await ListingService.get_all_categories(db)
    return categories
