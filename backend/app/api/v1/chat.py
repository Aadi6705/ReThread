import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.chat import (
    ConversationSummary,
    ConversationDetail,
    ConversationStartRequest,
    MessageCreate,
    MessageResponse,
)
from app.services.chat_service import ChatService

router = APIRouter(prefix="/conversations", tags=["Conversations & Messaging"])


@router.get("", response_model=List[ConversationSummary])
async def get_my_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch all conversation threads for authenticated student (buying and selling)."""
    return await ChatService.get_user_conversations(db, current_user.id)


@router.post("", response_model=ConversationDetail, status_code=status.HTTP_201_CREATED)
async def start_or_get_conversation(
    payload: ConversationStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start or retrieve conversation with a seller regarding a specific campus listing."""
    conv = await ChatService.get_or_create_conversation(
        db, current_user.id, payload.listing_id
    )
    if payload.initial_message and payload.initial_message.strip():
        await ChatService.send_message(
            db, conv.id, current_user.id, payload.initial_message.strip()
        )
    return await ChatService.get_conversation_detail(db, conv.id, current_user.id)


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation_detail(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch complete message history for conversation and update last_read_at."""
    return await ChatService.get_conversation_detail(db, conversation_id, current_user.id)


@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def post_message(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a new message to a conversation thread."""
    return await ChatService.send_message(
        db, conversation_id, current_user.id, payload.message_text
    )
