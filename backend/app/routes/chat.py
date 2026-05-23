from datetime import datetime, timezone, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models.chat import ChatMessage as ChatMessageModel
from ..models.chat import ChatSession as ChatSessionModel
from ..models.media_asset import MediaAsset as MediaAssetModel
from ..models.user import User
from ..schemas.chat import (
    ChatMessage,
    ChatSession,
    CreateSessionRequest,
    ListMessagesResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from ..services import ai_service, history_repository, makeup_card_repository
from ..config import get_settings

router = APIRouter(prefix="/chat", tags=["chat"])
_settings = get_settings()

# 给 Qwen 的最大上下文消息数（不算 system / 当前 user）
_HISTORY_TURNS = 10


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


def _row_to_schema(row: ChatMessageModel) -> ChatMessage:
    return ChatMessage(
        messageId=row.id,
        role=row.role,  # type: ignore[arg-type]
        content=row.content,
        messageType=row.message_type,  # type: ignore[arg-type]
        metadata=row.msg_metadata or {},
        createdAt=row.created_at,
    )


def _persist_message(
    db: Session,
    *,
    session_id: str,
    role: str,
    content: str,
    message_type: str = "text",
    metadata: dict | None = None,
) -> ChatMessageModel:
    row = ChatMessageModel(
        id=_make_id("msg"),
        session_id=session_id,
        role=role,
        content=content,
        message_type=message_type,
        msg_metadata=metadata or {},
        created_at=_now().replace(tzinfo=None),
    )
    db.add(row)
    db.flush()
    return row


def _media_public_url(media_asset_id: str, db: Session) -> str | None:
    row = db.get(MediaAssetModel, media_asset_id)
    if not row or row.file_type != "image":
        return None
    base = _settings.public_base_url.rstrip("/")
    if not base:
        return None
    return f"{base}/api/media/{media_asset_id}/raw"


@router.post("/sessions", response_model=ChatSession, response_model_by_alias=True)
def create_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChatSession:
    card = (
        makeup_card_repository.get_card(db, payload.card_id)
        if payload.card_id
        else None
    )
    session_id = _make_id("chat")

    session_row = ChatSessionModel(
        id=session_id,
        user_id=user.id,
        makeup_card_id=payload.card_id,
        inspiration_id=payload.inspiration_id,
        mode=payload.mode,
        current_step="准备开始",
        short_term_context={},
    )
    db.add(session_row)
    db.flush()  # 让 chat_sessions 行先落地，下面 message 的 FK 才能引用到

    first_msg = _persist_message(
        db,
        session_id=session_id,
        role="assistant",
        content=_initial_message(card.title if card else None, None),
    )

    if card:
        history_repository.upsert_from_card(
            db,
            user_id=user.id,
            card_id=card.card_id,
            title=card.title,
            source=card.source_type,
            status="imported",
            session_id=session_id,
        )
    db.commit()

    return ChatSession(
        sessionId=session_id,
        cardId=payload.card_id,
        inspirationId=payload.inspiration_id,
        mode=payload.mode,
        currentStep="准备开始",
        messages=[_row_to_schema(first_msg)],
    )


@router.get(
    "/sessions/{session_id}/messages",
    response_model=ListMessagesResponse,
    response_model_by_alias=True,
)
def list_messages(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ListMessagesResponse:
    session_row = db.get(ChatSessionModel, session_id)
    if not session_row or session_row.user_id != user.id:
        raise HTTPException(status_code=404, detail="会话不存在")
    rows = (
        db.query(ChatMessageModel)
        .filter(ChatMessageModel.session_id == session_id)
        .order_by(ChatMessageModel.created_at.asc())
        .all()
    )
    return ListMessagesResponse(
        messages=[_row_to_schema(r) for r in rows],
        currentStep=session_row.current_step,
    )


@router.post(
    "/sessions/{session_id}/messages",
    response_model=SendMessageResponse,
    response_model_by_alias=True,
)
def send_message(
    session_id: str,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SendMessageResponse:
    session_row = db.get(ChatSessionModel, session_id)
    if not session_row or session_row.user_id != user.id:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 解析图（如果带了）
    image_url = (
        _media_public_url(payload.media_asset_id, db) if payload.media_asset_id else None
    )

    # 写用户消息
    user_msg_type = "image" if image_url else (payload.message_type or "text")
    user_row = _persist_message(
        db,
        session_id=session_id,
        role="user",
        content=payload.content,
        message_type=user_msg_type,
        metadata={"mediaAssetId": payload.media_asset_id} if payload.media_asset_id else None,
    )

    # 取最近 N 轮历史（不含刚刚写入的这条 user）作为 AI 的上下文
    history_rows = (
        db.query(ChatMessageModel)
        .filter(
            ChatMessageModel.session_id == session_id,
            ChatMessageModel.id != user_row.id,
        )
        .order_by(ChatMessageModel.created_at.desc())
        .limit(_HISTORY_TURNS)
        .all()
    )
    history_rows.reverse()
    history = [
        {"role": r.role, "content": r.content}
        for r in history_rows
        if r.role in ("user", "assistant") and r.content
    ]

    card = (
        makeup_card_repository.get_card(db, session_row.makeup_card_id)
        if session_row.makeup_card_id
        else None
    )
    reply = ai_service.reply_in_session(
        card.title if card else None,
        payload.content,
        history=history,
        image_url=image_url,
    )

    assistant_row = _persist_message(
        db, session_id=session_id, role="assistant", content=reply
    )
    db.commit()

    return SendMessageResponse(
        userMessage=_row_to_schema(user_row),
        assistantMessage=_row_to_schema(assistant_row),
        currentStep=session_row.current_step,
    )
