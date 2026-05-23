from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Float, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class MakeupCard(Base):
    __tablename__ = "makeup_cards"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    source_type: Mapped[str] = mapped_column(String(32))
    source_platform: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    source_asset_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    title: Mapped[str] = mapped_column(String(128))
    style_tags: Mapped[list] = mapped_column(JSON, default=list)
    difficulty: Mapped[str] = mapped_column(String(32), default="中等")
    estimated_time: Mapped[str] = mapped_column(String(32), default="15分钟")
    scenes: Mapped[list] = mapped_column(JSON, default=list)
    product_types: Mapped[list] = mapped_column(JSON, default=list)
    steps: Mapped[list] = mapped_column(JSON, default=list)
    risk_points: Mapped[list] = mapped_column(JSON, default=list)
    ai_tip: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    evidence_summary: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
