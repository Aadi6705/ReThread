import uuid
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Map user_id to set of active WebSocket connections (e.g. multiple tabs)
        self.active_connections: Dict[uuid.UUID, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Active sessions for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: uuid.UUID):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: dict, user_id: uuid.UUID):
        if user_id in self.active_connections:
            dead_sockets = set()
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Error sending to user {user_id}: {e}")
                    dead_sockets.add(connection)
            for dead in dead_sockets:
                self.disconnect(dead, user_id)

    async def broadcast_to_users(self, message: dict, user_ids: list[uuid.UUID]):
        for uid in user_ids:
            await self.send_personal_message(message, uid)


# Global singleton manager instance
manager = ConnectionManager()
