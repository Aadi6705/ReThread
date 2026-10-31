import uuid
from typing import List, Optional
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.websocket.manager import manager


class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: uuid.UUID,
        type: str,
        title: str,
        message: str,
        related_listing_id: Optional[uuid.UUID] = None,
        related_transaction_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            related_listing_id=related_listing_id,
            related_transaction_id=related_transaction_id,
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)

        # Dispatch real-time WebSocket alert if recipient is online
        try:
            await manager.send_personal_message(
                {
                    "type": "new_notification",
                    "notification": {
                        "id": str(notif.id),
                        "type": notif.type,
                        "title": notif.title,
                        "message": notif.message,
                        "related_listing_id": str(notif.related_listing_id) if notif.related_listing_id else None,
                        "related_transaction_id": str(notif.related_transaction_id) if notif.related_transaction_id else None,
                        "is_read": notif.is_read,
                        "created_at": notif.created_at.isoformat(),
                    },
                },
                user_id=user_id,
            )
        except Exception as e:
            # Non-blocking if WS send fails
            pass

        return notif

    @staticmethod
    async def get_user_notifications(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 30
    ) -> List[Notification]:
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: uuid.UUID) -> int:
        result = await db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.is_read == False
            )
        )
        return result.scalar_one() or 0

    @staticmethod
    async def mark_as_read(
        db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Notification]:
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        notif = result.scalar_one_or_none()
        if notif:
            notif.is_read = True
            await db.commit()
            await db.refresh(notif)
        return notif

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> int:
        result = await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await db.commit()
        return result.rowcount
