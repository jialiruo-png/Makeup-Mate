from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class HistoryItem(Base):
    """聚合视图：解析过的卡片、生成的灵感方案、聊天会话摘要。

    第一阶段用一张物理表落地；后续可改为按 makeup_cards + chat_sessions JOIN 的视图。
    """

    __tablename__ = "history_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    card_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    title: Mapped[str] = mapped_column(String(128))
    source: Mapped[str] = mapped_column(String(32), default="link")
    status: Mapped[str] = mapped_column(String(32), default="analyzed")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
