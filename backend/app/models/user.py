import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("colleges.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    account_status: Mapped[str] = mapped_column(
        String(50), default="active", nullable=False
    )  # active, suspended, deactivated
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    college: Mapped["College"] = relationship("College", back_populates="users")
    profile: Mapped[Optional["StudentProfile"]] = relationship(
        "StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    listings: Mapped[list["Listing"]] = relationship(
        "Listing", back_populates="seller", cascade="all, delete-orphan"
    )
    wishlists: Mapped[list["Wishlist"]] = relationship(
        "Wishlist", back_populates="user", cascade="all, delete-orphan"
    )
    buyer_transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", foreign_keys="Transaction.buyer_id", back_populates="buyer"
    )
    seller_transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", foreign_keys="Transaction.seller_id", back_populates="seller"
    )
    conversation_memberships: Mapped[list["ConversationParticipant"]] = relationship(
        "ConversationParticipant", back_populates="user", cascade="all, delete-orphan"
    )
    sent_messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="sender", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    verification_tokens: Mapped[list["EmailVerificationToken"]] = relationship(
        "EmailVerificationToken", back_populates="user", cascade="all, delete-orphan"
    )
