from datetime import datetime, timezone, timedelta
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from ..routes.makeup_cards import _CARD_CACHE
from ..schemas.chat import (
    ChatMessage,
    ChatSession,
    CreateSessionRequest,
    ListMessagesResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from ..services import ai_service

router = APIRouter(prefix="/chat", tags=["chat"])

# 第一阶段内存缓存，后续落库
_SESSIONS: dict[str, ChatSession] = {}


def _now():
    return datetime.now(timezone(timedelta(hours=8)))


def _make_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}"


def _initial_message(card_title: str | None, inspiration_name: str | None) -> str:
    if card_title:
        return (
            f"我已经读完这张「{card_title}」解析卡片啦。"
            "接下来我可以陪你一步步画，也可以先根据你的自拍帮你调整成更适合你的版本。"
        )
    if inspiration_name:
        return (
            f"我已经根据「{inspiration_name}」生成了一版适合日常复刻的方案。"
            "你可以直接开始，也可以上传自拍，让我把腮红、眼线和唇色再调得更贴合你。"
        )
    return "我在这里。你可以告诉我想画什么风格，或者从首页粘贴一个链接给我。"


@router.post("/sessions", response_model=ChatSession, response_model_by_alias=True)
def create_session(payload: CreateSessionRequest) -> ChatSession:
    card = _CARD_CACHE.get(payload.card_id) if payload.card_id else None
    session = ChatSession(
        sessionId=_make_id("chat"),
        cardId=payload.card_id,
        inspirationId=payload.inspiration_id,
        mode=payload.mode,
        currentStep="准备开始",
        messages=[
            ChatMessage(
                messageId=_make_id("msg"),
                role="assistant",
                content=_initial_message(card.title if card else None, None),
                messageType="text",
                createdAt=_now(),
            )
        ],
    )
    _SESSIONS[session.session_id] = session
    return session


@router.get(
    "/sessions/{session_id}/messages",
    response_model=ListMessagesResponse,
    response_model_by_alias=True,
)
def list_messages(session_id: str) -> ListMessagesResponse:
    session = _SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    return ListMessagesResponse(messages=session.messages, currentStep=session.current_step)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=SendMessageResponse,
    response_model_by_alias=True,
)
def send_message(session_id: str, payload: SendMessageRequest) -> SendMessageResponse:
    session = _SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    user_msg = ChatMessage(
        messageId=_make_id("msg"),
        role="user",
        content=payload.content,
        messageType=payload.message_type,
        createdAt=_now(),
    )
    session.messages.append(user_msg)

    card = _CARD_CACHE.get(session.card_id) if session.card_id else None
    reply = ai_service.reply_in_session(card.title if card else None, payload.content)

    assistant_msg = ChatMessage(
        messageId=_make_id("msg"),
        role="assistant",
        content=reply,
        messageType="text",
        createdAt=_now(),
    )
    session.messages.append(assistant_msg)

    return SendMessageResponse(
        userMessage=user_msg,
        assistantMessage=assistant_msg,
        currentStep=session.current_step,
    )
