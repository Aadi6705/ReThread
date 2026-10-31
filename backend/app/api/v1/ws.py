import uuid
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.services.chat_service import ChatService
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Real-Time WebSockets"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    # 1. Authenticate user from query parameter token or cookie
    auth_token = token
    if not auth_token:
        # Check cookies
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

    # 2. Connect to manager
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
                if conv_id_str and text:
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
                        await websocket.send_json({
                            "type": "error",
                            "message": str(err)
                        })

            elif action == "typing":
                conv_id_str = data.get("conversation_id")
                is_typing = bool(data.get("is_typing", True))
                # Forward typing event to conversation participants
                if conv_id_str:
                    try:
                        conv_id = uuid.UUID(conv_id_str)
                        # Broadcast typing event
                        # We can send to manager with type "user_typing"
                        pass
                    except Exception:
                        pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.warning(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)
