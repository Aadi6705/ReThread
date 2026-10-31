from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.categories import router as categories_router
from app.api.v1.listings import router as listings_router
from app.api.v1.seller import router as seller_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.wishlist import router as wishlist_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.chat import router as chat_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.ws import router as ws_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(categories_router)
api_router.include_router(listings_router)
api_router.include_router(seller_router)
api_router.include_router(uploads_router)
api_router.include_router(wishlist_router)
api_router.include_router(transactions_router)
api_router.include_router(chat_router)
api_router.include_router(notifications_router)
api_router.include_router(ws_router)
