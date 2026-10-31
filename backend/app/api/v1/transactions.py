import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_verified_user
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionOut
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Purchase Requests & Transactions"])


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_purchase_request(
    data: TransactionCreate,
    current_user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a purchase request for an active campus listing.
    Enforces that buyer is email-verified, prevents self-purchase, and validates listing availability.
    """
    tx = await TransactionService.create_purchase_request(db, current_user, data)
    return TransactionService.format_transaction_out(tx)


@router.get("/buyer", response_model=List[TransactionOut], status_code=status.HTTP_200_OK)
async def get_my_buyer_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch all purchase requests sent by the authenticated student."""
    txs = await TransactionService.get_buyer_transactions(db, current_user.id)
    return [TransactionService.format_transaction_out(tx) for tx in txs]


@router.get("/seller", response_model=List[TransactionOut], status_code=status.HTTP_200_OK)
async def get_my_seller_enquiries(
    status_filter: Optional[str] = Query("all", description="all, requested, accepted, rejected, etc."),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch incoming purchase requests / buyer enquiries for listings owned by the seller."""
    txs = await TransactionService.get_seller_enquiries(db, current_user.id, status_filter)
    return [TransactionService.format_transaction_out(tx) for tx in txs]


@router.get("/{transaction_id}", response_model=TransactionOut, status_code=status.HTTP_200_OK)
async def get_transaction_detail(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch transaction details. Strictly restricted to the buyer or seller."""
    tx = await TransactionService.get_transaction_by_id(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if tx.buyer_id != current_user.id and tx.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden. You are not a participant in this exchange.")

    return TransactionService.format_transaction_out(tx)


@router.post("/{transaction_id}/accept", response_model=TransactionOut, status_code=status.HTTP_200_OK)
async def accept_purchase_request(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_verified_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept a purchase request.
    Uses PostgreSQL SELECT FOR UPDATE row-level locking to atomically reserve the listing
    and prevent double-selling.
    """
    tx = await TransactionService.accept_request(db, current_user, transaction_id)
    return TransactionService.format_transaction_out(tx)


@router.post("/{transaction_id}/reject", response_model=TransactionOut, status_code=status.HTTP_200_OK)
async def reject_purchase_request(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject an incoming purchase request. Does not alter listing availability."""
    tx = await TransactionService.reject_request(db, current_user, transaction_id)
    return TransactionService.format_transaction_out(tx)
