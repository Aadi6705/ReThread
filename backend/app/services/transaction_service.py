import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, and_, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.transaction import Transaction
from app.models.listing import Listing
from app.models.user import User
from app.models.college import College
from decimal import Decimal
from app.schemas.transaction import (
    TransactionCreate,
    TransactionOut,
    TransactionScheduleMeetup,
    TransactionCancel,
    TransactionDispute,
    SalesSummaryOut,
)
from app.schemas.listing import ListingSummaryOut
from app.schemas.user import PublicUserOut, StudentProfileOut
from app.services.notification_service import NotificationService
from app.core.sanitizer import sanitize_text


class TransactionService:
    @staticmethod
    async def create_purchase_request(
        db: AsyncSession, buyer: User, data: TransactionCreate
    ) -> Transaction:
        """Create a purchase request from buyer to seller."""
        # 1. Fetch listing
        stmt = (
            select(Listing)
            .where(Listing.id == data.listing_id)
            .options(selectinload(Listing.seller))
        )
        res = await db.execute(stmt)
        listing = res.scalar_one_or_none()

        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found.",
            )

        # 2. Prevent self-purchase
        if listing.seller_id == buyer.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot submit a purchase request for your own listing.",
            )

        # 3. Verify listing availability
        if listing.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This listing is currently {listing.status} and cannot accept new purchase requests.",
            )

        # 4. Check for existing active/pending request by this buyer
        existing_stmt = select(Transaction).where(
            and_(
                Transaction.listing_id == listing.id,
                Transaction.buyer_id == buyer.id,
                Transaction.status.in_(["requested", "accepted", "meetup_scheduled"]),
            )
        )
        existing = (await db.execute(existing_stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active purchase request for this item.",
            )

        # 5. Create transaction in 'requested' state
        now = datetime.now(timezone.utc)
        transaction = Transaction(
            listing_id=listing.id,
            buyer_id=buyer.id,
            seller_id=listing.seller_id,
            status="requested",
            buyer_message=sanitize_text(data.buyer_message) if data.buyer_message else None,
            requested_at=now,
        )
        db.add(transaction)
        await db.commit()

        # Trigger notification to seller
        buyer_name = buyer.profile.full_name if buyer.profile and buyer.profile.full_name else "A campus student"
        try:
            await NotificationService.create_notification(
                db=db,
                user_id=listing.seller_id,
                type="purchase_request",
                title=f"New Purchase Request for {listing.title}",
                message=f"{buyer_name} submitted a purchase request for campus meetup.",
                related_listing_id=listing.id,
                related_transaction_id=transaction.id,
            )
        except Exception:
            pass

        return await TransactionService.get_transaction_by_id(db, transaction.id)

    @staticmethod
    async def get_transaction_by_id(
        db: AsyncSession, transaction_id: uuid.UUID
    ) -> Optional[Transaction]:
        """Fetch transaction with preloaded relations."""
        stmt = (
            select(Transaction)
            .where(Transaction.id == transaction_id)
            .options(
                selectinload(Transaction.listing).selectinload(Listing.images),
                selectinload(Transaction.listing).selectinload(Listing.category),
                selectinload(Transaction.listing).selectinload(Listing.college),
                selectinload(Transaction.buyer).selectinload(User.profile),
                selectinload(Transaction.buyer).selectinload(User.college),
                selectinload(Transaction.seller).selectinload(User.profile),
                selectinload(Transaction.seller).selectinload(User.college),
            )
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def get_buyer_transactions(
        db: AsyncSession, buyer_id: uuid.UUID
    ) -> List[Transaction]:
        """Fetch all purchase requests sent by the student."""
        stmt = (
            select(Transaction)
            .where(Transaction.buyer_id == buyer_id)
            .options(
                selectinload(Transaction.listing).selectinload(Listing.images),
                selectinload(Transaction.listing).selectinload(Listing.category),
                selectinload(Transaction.listing).selectinload(Listing.college),
                selectinload(Transaction.seller).selectinload(User.profile),
                selectinload(Transaction.seller).selectinload(User.college),
            )
            .order_by(desc(Transaction.requested_at))
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_seller_enquiries(
        db: AsyncSession, seller_id: uuid.UUID, status_filter: Optional[str] = None
    ) -> List[Transaction]:
        """Fetch all incoming purchase requests received by the seller."""
        stmt = (
            select(Transaction)
            .where(Transaction.seller_id == seller_id)
            .options(
                selectinload(Transaction.listing).selectinload(Listing.images),
                selectinload(Transaction.listing).selectinload(Listing.category),
                selectinload(Transaction.listing).selectinload(Listing.college),
                selectinload(Transaction.buyer).selectinload(User.profile),
                selectinload(Transaction.buyer).selectinload(User.college),
            )
            .order_by(desc(Transaction.requested_at))
        )
        if status_filter and status_filter != "all":
            stmt = stmt.where(Transaction.status == status_filter)

        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def accept_request(
        db: AsyncSession, seller: User, transaction_id: uuid.UUID
    ) -> Transaction:
        """
        Accept a purchase request with PostgreSQL row-level locking (SELECT FOR UPDATE)
        to prevent double-selling.
        """
        # Fetch transaction
        tx = await TransactionService.get_transaction_by_id(db, transaction_id)
        if not tx:
            raise HTTPException(status_code=404, detail="Purchase request not found.")

        if tx.seller_id != seller.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own the listing associated with this request.",
            )

        if tx.status != "requested":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot accept request currently in '{tx.status}' state.",
            )

        # LOCK LISTING ROW USING SELECT FOR UPDATE
        lock_stmt = (
            select(Listing)
            .where(Listing.id == tx.listing_id)
            .with_for_update()
        )
        lock_res = await db.execute(lock_stmt)
        listing = lock_res.scalar_one_or_none()

        if not listing:
            raise HTTPException(status_code=404, detail="Associated listing not found.")

        if listing.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot accept request. Listing is currently '{listing.status}'.",
            )

        now = datetime.now(timezone.utc)

        # Atomically update transaction and listing status
        tx.status = "accepted"
        tx.updated_at = now
        listing.status = "reserved"
        listing.updated_at = now

        await db.commit()

        # Trigger notification to buyer
        try:
            await NotificationService.create_notification(
                db=db,
                user_id=tx.buyer_id,
                type="request_accepted",
                title=f"Purchase Request Accepted: {listing.title}",
                message="The seller accepted your request and reserved the item! Check Messages to coordinate campus meetup.",
                related_listing_id=listing.id,
                related_transaction_id=tx.id,
            )
        except Exception:
            pass

        return await TransactionService.get_transaction_by_id(db, tx.id)

    @staticmethod
    async def reject_request(
        db: AsyncSession, seller: User, transaction_id: uuid.UUID
    ) -> Transaction:
        """Reject a purchase request."""
        tx = await TransactionService.get_transaction_by_id(db, transaction_id)
        if not tx:
            raise HTTPException(status_code=404, detail="Purchase request not found.")

        if tx.seller_id != seller.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to decline this request.",
            )

        if tx.status != "requested":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject request in '{tx.status}' state.",
            )

        now = datetime.now(timezone.utc)
        tx.status = "rejected"
        tx.updated_at = now
        await db.commit()

        # Trigger notification to buyer
        try:
            await NotificationService.create_notification(
                db=db,
                user_id=tx.buyer_id,
                type="request_rejected",
                title=f"Request Declined: {tx.listing.title if tx.listing else 'Item'}",
                message="The seller has declined this purchase request.",
                related_listing_id=tx.listing_id,
                related_transaction_id=tx.id,
            )
        except Exception:
            pass

        return await TransactionService.get_transaction_by_id(db, tx.id)

    @staticmethod
    async def schedule_meetup(
        db: AsyncSession,
        user: User,
        transaction_id: uuid.UUID,
        data: TransactionScheduleMeetup,
    ) -> Transaction:
        """Schedule in-person campus meetup location and time."""
        tx = await TransactionService.get_transaction_by_id(db, transaction_id)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found.")

        if user.id != tx.buyer_id and user.id != tx.seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this transaction.",
            )

        if tx.status not in ["accepted", "meetup_scheduled"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot schedule meetup for transaction in '{tx.status}' state.",
            )

        now = datetime.now(timezone.utc)
        tx.meetup_location = sanitize_text(data.meetup_location)
        tx.meetup_datetime = data.meetup_datetime
        tx.status = "meetup_scheduled"
        tx.updated_at = now
        await db.commit()

        # Notify counterparty
        recipient_id = tx.buyer_id if user.id == tx.seller_id else tx.seller_id
        try:
            listing_title = tx.listing.title if tx.listing else "item"
            dt_str = tx.meetup_datetime.strftime("%d %b at %I:%M %p")
            await NotificationService.create_notification(
                db=db,
                user_id=recipient_id,
                type="meetup_scheduled",
                title=f"Meetup Scheduled: {listing_title}",
                message=f"Meetup set at {tx.meetup_location} on {dt_str}.",
                related_listing_id=tx.listing_id,
                related_transaction_id=tx.id,
            )
        except Exception:
            pass

        return await TransactionService.get_transaction_by_id(db, tx.id)

    @staticmethod
    async def confirm_exchange(
        db: AsyncSession, user: User, transaction_id: uuid.UUID
    ) -> Transaction:
        """
        Dual-confirmation workflow: both Buyer and Seller must confirm the offline exchange.
        When both confirm, transaction transitions to 'completed' and listing to 'sold'.
        """
        tx = await TransactionService.get_transaction_by_id(db, transaction_id)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found.")

        if user.id != tx.buyer_id and user.id != tx.seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this transaction.",
            )

        if tx.status not in ["accepted", "meetup_scheduled"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot confirm exchange in '{tx.status}' state.",
            )

        now = datetime.now(timezone.utc)
        if user.id == tx.buyer_id:
            tx.buyer_confirmed = True
        elif user.id == tx.seller_id:
            tx.seller_confirmed = True

        listing_title = tx.listing.title if tx.listing else "item"

        # Check dual confirmation
        if tx.buyer_confirmed and tx.seller_confirmed:
            tx.status = "completed"
            tx.completed_at = now

            # Atomically lock and transition listing to 'sold'
            stmt = (
                select(Listing)
                .where(Listing.id == tx.listing_id)
                .with_for_update()
            )
            listing = (await db.execute(stmt)).scalar_one_or_none()
            if listing:
                listing.status = "sold"
                listing.updated_at = now

            await db.commit()

            # Notify both students of completed exchange
            try:
                for uid in [tx.buyer_id, tx.seller_id]:
                    await NotificationService.create_notification(
                        db=db,
                        user_id=uid,
                        type="exchange_completed",
                        title=f"Exchange Completed: {listing_title}",
                        message="Both students confirmed the campus exchange. Circular thrift complete!",
                        related_listing_id=tx.listing_id,
                        related_transaction_id=tx.id,
                    )
            except Exception:
                pass
        else:
            await db.commit()
            # Notify the other party that one confirmation has been submitted
            recipient_id = tx.buyer_id if user.id == tx.seller_id else tx.seller_id
            user_name = user.profile.full_name if user.profile else "The other student"
            try:
                await NotificationService.create_notification(
                    db=db,
                    user_id=recipient_id,
                    type="confirmation_pending",
                    title=f"Confirmation Received: {listing_title}",
                    message=f"{user_name} confirmed the exchange. Please submit your confirmation once meetup is done.",
                    related_listing_id=tx.listing_id,
                    related_transaction_id=tx.id,
                )
            except Exception:
                pass

        return await TransactionService.get_transaction_by_id(db, tx.id)

    @staticmethod
    async def cancel_transaction(
        db: AsyncSession,
        user: User,
        transaction_id: uuid.UUID,
        reason: str,
    ) -> Transaction:
        """Cancel an ongoing transaction and release listing back to 'active'."""
        tx = await TransactionService.get_transaction_by_id(db, transaction_id)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found.")

        if user.id != tx.buyer_id and user.id != tx.seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this transaction.",
            )

        if tx.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed exchanges cannot be cancelled.",
            )

        now = datetime.now(timezone.utc)
        tx.status = "cancelled"
        tx.updated_at = now

        # Release listing back to active
        stmt = (
            select(Listing)
            .where(Listing.id == tx.listing_id)
            .with_for_update()
        )
        listing = (await db.execute(stmt)).scalar_one_or_none()
        if listing and listing.status == "reserved":
            listing.status = "active"
            listing.updated_at = now

        await db.commit()

        # Notify counterparty
        recipient_id = tx.buyer_id if user.id == tx.seller_id else tx.seller_id
        listing_title = tx.listing.title if tx.listing else "item"
        try:
            await NotificationService.create_notification(
                db=db,
                user_id=recipient_id,
                type="transaction_cancelled",
                title=f"Exchange Cancelled: {listing_title}",
                message=f"Transaction cancelled: {reason}",
                related_listing_id=tx.listing_id,
                related_transaction_id=tx.id,
            )
        except Exception:
            pass

        return await TransactionService.get_transaction_by_id(db, tx.id)

    @staticmethod
    async def report_dispute(
        db: AsyncSession,
        user: User,
        transaction_id: uuid.UUID,
        reason: str,
        description: str,
    ) -> Transaction:
        """Flag transaction as disputed for campus review."""
        tx = await TransactionService.get_transaction_by_id(db, transaction_id)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found.")

        if user.id != tx.buyer_id and user.id != tx.seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this transaction.",
            )

        now = datetime.now(timezone.utc)
        tx.status = "disputed"
        tx.updated_at = now
        await db.commit()

        return await TransactionService.get_transaction_by_id(db, tx.id)

    @staticmethod
    async def get_seller_sales_history(
        db: AsyncSession, seller_id: uuid.UUID
    ) -> List[Transaction]:
        """Fetch all completed transactions for a seller."""
        stmt = (
            select(Transaction)
            .where(Transaction.seller_id == seller_id, Transaction.status == "completed")
            .options(
                selectinload(Transaction.listing).selectinload(Listing.images),
                selectinload(Transaction.listing).selectinload(Listing.category),
                selectinload(Transaction.listing).selectinload(Listing.college),
                selectinload(Transaction.buyer).selectinload(User.profile),
                selectinload(Transaction.buyer).selectinload(User.college),
            )
            .order_by(desc(Transaction.completed_at))
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_seller_sales_summary(
        db: AsyncSession, seller_id: uuid.UUID
    ) -> SalesSummaryOut:
        """Compute live sales aggregations directly from the database."""
        completed_txs = await TransactionService.get_seller_sales_history(db, seller_id)
        total_earned = sum(
            (Decimal(str(tx.listing.price)) for tx in completed_txs if tx.listing),
            Decimal("0.00"),
        )
        count = len(completed_txs)
        return SalesSummaryOut(
            completed_sales=count,
            total_earned_offline=total_earned,
            products_sold=count,
        )

    @staticmethod
    def format_transaction_out(tx: Transaction) -> TransactionOut:
        """Format Transaction entity into typed response schema."""
        listing_summary = None
        if tx.listing:
            l = tx.listing
            primary_img = l.images[0].image_url if l.images else None
            seller_name = (
                tx.seller.profile.full_name
                if tx.seller and tx.seller.profile
                else "Student"
            )
            listing_summary = ListingSummaryOut(
                id=l.id,
                seller_id=l.seller_id,
                college_id=l.college_id,
                category_id=l.category_id,
                category_name=l.category.name if l.category else "Category",
                category_slug=l.category.slug if l.category else "all",
                title=l.title,
                price=l.price,
                original_price=l.original_price,
                condition=l.condition,
                brand=l.brand,
                status=l.status,
                primary_image_url=primary_img,
                campus_name=l.college.campus_name if l.college else "Campus",
                college_name=l.college.name if l.college else "College",
                seller_name=seller_name,
                seller_is_verified=tx.seller.is_email_verified if tx.seller else False,
                created_at=l.created_at,
            )

        buyer_out = None
        if tx.buyer:
            buyer_profile = (
                StudentProfileOut.model_validate(tx.buyer.profile)
                if tx.buyer.profile
                else None
            )
            buyer_out = PublicUserOut(
                id=tx.buyer.id,
                college_name=tx.buyer.college.name if tx.buyer.college else "Campus",
                campus_name=tx.buyer.college.campus_name if tx.buyer.college else "Campus",
                is_email_verified=tx.buyer.is_email_verified,
                profile=buyer_profile,
            )

        seller_out = None
        if tx.seller:
            seller_profile = (
                StudentProfileOut.model_validate(tx.seller.profile)
                if tx.seller.profile
                else None
            )
            seller_out = PublicUserOut(
                id=tx.seller.id,
                college_name=tx.seller.college.name if tx.seller.college else "Campus",
                campus_name=tx.seller.college.campus_name if tx.seller.college else "Campus",
                is_email_verified=tx.seller.is_email_verified,
                profile=seller_profile,
            )

        return TransactionOut(
            id=tx.id,
            listing_id=tx.listing_id,
            buyer_id=tx.buyer_id,
            seller_id=tx.seller_id,
            status=tx.status,
            buyer_message=tx.buyer_message,
            meetup_location=tx.meetup_location,
            meetup_datetime=tx.meetup_datetime,
            buyer_confirmed=tx.buyer_confirmed,
            seller_confirmed=tx.seller_confirmed,
            requested_at=tx.requested_at,
            updated_at=tx.updated_at,
            completed_at=tx.completed_at,
            listing=listing_summary,
            buyer=buyer_out,
            seller=seller_out,
        )
