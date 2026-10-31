import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation, ConversationParticipant
from app.models.message import Message
from app.models.listing import Listing
from app.models.user import User
from app.schemas.chat import (
    ConversationSummary,
    ConversationDetail,
    ParticipantPublic,
    ListingSnippet,
    MessageResponse,
)
from app.services.notification_service import NotificationService
from app.websocket.manager import manager
from app.core.sanitizer import sanitize_text


class ChatService:
    @staticmethod
    async def get_or_create_conversation(
        db: AsyncSession, current_user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> Conversation:
        # 1. Fetch listing
        result = await db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found"
            )

        if listing.seller_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot start a conversation with yourself on your own listing.",
            )

        seller_id = listing.seller_id

        # 2. Check if a conversation between these two participants already exists for this listing
        stmt = (
            select(Conversation)
            .where(Conversation.listing_id == listing_id)
            .options(selectinload(Conversation.participants))
        )
        existing_convs = (await db.execute(stmt)).scalars().all()

        for conv in existing_convs:
            p_ids = {p.user_id for p in conv.participants}
            if current_user_id in p_ids and seller_id in p_ids:
                return conv

        # 3. Create new conversation
        new_conv = Conversation(listing_id=listing_id)
        db.add(new_conv)
        await db.flush()

        # Add both participants
        buyer_part = ConversationParticipant(
            conversation_id=new_conv.id,
            user_id=current_user_id,
            last_read_at=datetime.now(timezone.utc),
        )
        seller_part = ConversationParticipant(
            conversation_id=new_conv.id,
            user_id=seller_id,
        )
        db.add_all([buyer_part, seller_part])
        await db.commit()
        await db.refresh(new_conv)
        return new_conv

    @staticmethod
    async def get_user_conversations(
        db: AsyncSession, current_user_id: uuid.UUID
    ) -> List[ConversationSummary]:
        # Fetch conversations where current_user is a participant
        stmt = (
            select(Conversation)
            .join(ConversationParticipant, Conversation.id == ConversationParticipant.conversation_id)
            .where(ConversationParticipant.user_id == current_user_id)
            .options(
                selectinload(Conversation.listing).selectinload(Listing.images),
                selectinload(Conversation.participants)
                .selectinload(ConversationParticipant.user)
                .selectinload(User.profile),
                selectinload(Conversation.participants)
                .selectinload(ConversationParticipant.user)
                .selectinload(User.college),
                selectinload(Conversation.messages),
            )
            .order_by(Conversation.updated_at.desc())
        )
        conversations = (await db.execute(stmt)).scalars().all()

        summaries: List[ConversationSummary] = []
        for conv in conversations:
            # Current user's participant info & other participant info
            current_part = None
            other_part = None
            for p in conv.participants:
                if p.user_id == current_user_id:
                    current_part = p
                else:
                    other_part = p

            if not other_part or not other_part.user:
                continue

            # Participant public profile
            other_user = other_part.user
            profile_name = other_user.profile.full_name if other_user.profile else other_user.email.split('@')[0]
            avatar_url = other_user.profile.profile_image if other_user.profile else None
            campus = other_user.college.name if other_user.college else None

            other_pub = ParticipantPublic(
                id=other_user.id,
                full_name=profile_name,
                avatar_url=avatar_url,
                is_email_verified=other_user.is_email_verified,
                campus_name=campus,
            )

            # Listing snippet
            listing_snip = None
            role = "buying"
            if conv.listing:
                prim_img = None
                if conv.listing.images:
                    prim_img = conv.listing.images[0].image_url
                listing_snip = ListingSnippet(
                    id=conv.listing.id,
                    title=conv.listing.title,
                    price=conv.listing.price,
                    status=conv.listing.status,
                    primary_image_url=prim_img,
                    seller_id=conv.listing.seller_id,
                )
                if conv.listing.seller_id == current_user_id:
                    role = "selling"

            # Last message & unread count
            last_msg_resp = None
            unread_count = 0
            if conv.messages:
                # Messages ordered by created_at in model relationship
                last_m = conv.messages[-1]
                last_msg_resp = MessageResponse(
                    id=last_m.id,
                    conversation_id=last_m.conversation_id,
                    sender_id=last_m.sender_id,
                    message_text=last_m.message_text,
                    created_at=last_m.created_at,
                    is_mine=last_m.sender_id == current_user_id,
                )

                last_read = current_part.last_read_at if current_part else None
                for m in conv.messages:
                    if m.sender_id != current_user_id:
                        if last_read is None or m.created_at > last_read:
                            unread_count += 1

            summaries.append(
                ConversationSummary(
                    id=conv.id,
                    listing_id=conv.listing_id,
                    transaction_id=conv.transaction_id,
                    listing=listing_snip,
                    other_participant=other_pub,
                    role=role,
                    last_message=last_msg_resp,
                    unread_count=unread_count,
                    updated_at=conv.updated_at,
                )
            )

        return summaries

    @staticmethod
    async def get_conversation_detail(
        db: AsyncSession, conversation_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> ConversationDetail:
        stmt = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(
                selectinload(Conversation.listing).selectinload(Listing.images),
                selectinload(Conversation.participants)
                .selectinload(ConversationParticipant.user)
                .selectinload(User.profile),
                selectinload(Conversation.participants)
                .selectinload(ConversationParticipant.user)
                .selectinload(User.college),
                selectinload(Conversation.messages),
            )
        )
        conv = (await db.execute(stmt)).scalar_one_or_none()
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
            )

        # Check membership
        is_member = False
        other_part = None
        current_part = None
        for p in conv.participants:
            if p.user_id == current_user_id:
                is_member = True
                current_part = p
            else:
                other_part = p

        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this conversation.",
            )

        # Update last_read_at
        if current_part:
            current_part.last_read_at = datetime.now(timezone.utc)
            await db.commit()

        # Build response
        other_user = other_part.user if other_part else None
        other_pub = ParticipantPublic(
            id=other_user.id if other_user else current_user_id,
            full_name=other_user.profile.full_name if (other_user and other_user.profile) else "Campus Student",
            avatar_url=other_user.profile.profile_image if (other_user and other_user.profile) else None,
            is_email_verified=other_user.is_email_verified if other_user else True,
            campus_name=other_user.college.name if (other_user and other_user.college) else None,
        )

        listing_snip = None
        role = "buying"
        if conv.listing:
            prim_img = None
            if conv.listing.images:
                prim_img = conv.listing.images[0].image_url
            listing_snip = ListingSnippet(
                id=conv.listing.id,
                title=conv.listing.title,
                price=conv.listing.price,
                status=conv.listing.status,
                primary_image_url=prim_img,
                seller_id=conv.listing.seller_id,
            )
            if conv.listing.seller_id == current_user_id:
                role = "selling"

        message_list = [
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_id=m.sender_id,
                message_text=m.message_text,
                created_at=m.created_at,
                is_mine=m.sender_id == current_user_id,
            )
            for m in conv.messages
            if not m.is_deleted
        ]

        return ConversationDetail(
            id=conv.id,
            listing_id=conv.listing_id,
            transaction_id=conv.transaction_id,
            listing=listing_snip,
            other_participant=other_pub,
            role=role,
            messages=message_list,
        )

    @staticmethod
    async def send_message(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        sender_id: uuid.UUID,
        message_text: str,
    ) -> MessageResponse:
        stmt = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(
                selectinload(Conversation.participants).selectinload(ConversationParticipant.user).selectinload(User.profile),
                selectinload(Conversation.listing),
            )
        )
        conv = (await db.execute(stmt)).scalar_one_or_none()
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
            )

        # Check sender membership
        sender_participant = None
        recipient_id = None
        sender_name = "A student"
        for p in conv.participants:
            if p.user_id == sender_id:
                sender_participant = p
                if p.user and p.user.profile and p.user.profile.full_name:
                    sender_name = p.user.profile.full_name
            else:
                recipient_id = p.user_id

        if not sender_participant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot post messages to a conversation you are not a participant in.",
            )

        # Insert message
        msg = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            message_text=sanitize_text(message_text),
        )
        db.add(msg)

        # Update conversation timestamp & sender last_read_at
        conv.updated_at = datetime.now(timezone.utc)
        sender_participant.last_read_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(msg)

        response = MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            message_text=msg.message_text,
            created_at=msg.created_at,
            is_mine=True,
        )

        # Broadcast via WebSocket to both participants
        participant_ids = [p.user_id for p in conv.participants]
        try:
            await manager.broadcast_to_users(
                {
                    "type": "new_chat_message",
                    "conversation_id": str(conversation_id),
                    "message": {
                        "id": str(msg.id),
                        "conversation_id": str(msg.conversation_id),
                        "sender_id": str(msg.sender_id),
                        "message_text": msg.message_text,
                        "created_at": msg.created_at.isoformat(),
                    },
                },
                user_ids=participant_ids,
            )
        except Exception:
            pass

        # Trigger notification for recipient
        if recipient_id:
            try:
                snippet = message_text[:50] + ("..." if len(message_text) > 50 else "")
                listing_title = conv.listing.title if conv.listing else "item"
                await NotificationService.create_notification(
                    db=db,
                    user_id=recipient_id,
                    type="new_message",
                    title=f"New message regarding {listing_title}",
                    message=f"{sender_name}: {snippet}",
                    related_listing_id=conv.listing_id,
                    related_transaction_id=conv.transaction_id,
                )
            except Exception:
                pass

        return response
