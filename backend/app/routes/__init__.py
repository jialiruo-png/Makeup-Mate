from fastapi import APIRouter

from . import (
    makeup_cards,
    inspirations,
    chat,
    profile,
    media,
    history,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(makeup_cards.router)
api_router.include_router(inspirations.router)
api_router.include_router(chat.router)
api_router.include_router(profile.router)
api_router.include_router(media.router)
api_router.include_router(history.router)
