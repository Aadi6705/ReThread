import uuid
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.config import settings
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.services.chat_service import ChatService
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Real-Time WebSockets"])

MAX_MESSAGE_LENGTH = 2000


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    # 1. Validate Origin header in production to prevent Cross-Site WebSocket Hijacking (CSWSH)
    origin = websocket.headers.get("origin")
    if origin and settings.APP_ENV == "production":
        valid_origins = set(settings.ALLOWED_ORIGINS)
        if settings.FRONTEND_URL:
            valid_origins.add(settings.FRONTEND_URL)
        is_allowed = (
            origin in valid_origins
            or origin.endswith(".vercel.app")
            or "localhost" in origin
            or "127.0.0.1" in origin
        )
        if not is_allowed:
            logger.warning(f"WebSocket rejected: Untrusted origin '{origin}'.")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    # 2. Authenticate user from query parameter token or session cookie
    auth_token = token
    if not auth_token:
        auth_token = websocket.cookies.get("access_token")

    if not auth_token:
        logger.warning("WebSocket rejected: No access token provided.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_token(auth_token)
    if not payload or payload.get("type") != "access":
        logger.warning("WebSocket rejected: Invalid JWT token.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_sub = payload.get("sub")
    try:
        user_id = uuid.UUID(user_sub)
    except (ValueError, TypeError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 3. Connect to manager
    await manager.connect(websocket, user_id)

    # Send initial welcome confirmation
    await websocket.send_json({
        "type": "connected",
        "user_id": str(user_id),
        "message": "Connected to ReThread real-time campus socket."
    })

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "ping":
                await websocket.send_json({"type": "pong"})

            elif action == "send_message":
                conv_id_str = data.get("conversation_id")
                text = data.get("message", "").strip()

                if not conv_id_str or not text:
                    continue

                if len(text) > MAX_MESSAGE_LENGTH:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Message exceeds limit of {MAX_MESSAGE_LENGTH} characters."
                    })
                    continue

                try:
                    conv_id = uuid.UUID(conv_id_str)
                    async with AsyncSessionLocal() as db:
                        await ChatService.send_message(
                            db=db,
                            conversation_id=conv_id,
                            sender_id=user_id,
                            message_text=text,
                        )
                except Exception as err:
                    logger.error(f"WebSocket send_message error for user {user_id}: {err}", exc_info=True)
                    # Sanitized error message to prevent database details leaking
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to deliver message. Please verify you are a member of this chat."
                    })

            elif action == "typing":
                # Client typing events can be broadcast to active peers
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        manager.disconnect(websocket, user_id)
        logger.warning(f"WebSocket connection closed unexpectedly for user {user_id}: {e}")
