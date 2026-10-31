import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="requested", index=True, nullable=False
    )  # requested, accepted, rejected, meetup_scheduled, completed, cancelled, disputed
    buyer_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meetup_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meetup_datetime: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    buyer_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    seller_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    listing: Mapped["Listing"] = relationship("Listing", back_populates="transactions")
    buyer: Mapped["User"] = relationship(
        "User", foreign_keys=[buyer_id], back_populates="buyer_transactions"
    )
    seller: Mapped["User"] = relationship(
        "User", foreign_keys=[seller_id], back_populates="seller_transactions"
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation", back_populates="transaction"
    )

    __table_args__ = (
        Index("ix_transactions_buyer_status", "buyer_id", "status"),
        Index("ix_transactions_seller_status", "seller_id", "status"),
    )
