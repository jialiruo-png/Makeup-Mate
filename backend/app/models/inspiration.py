from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class BeautyInspiration(Base):
    __tablename__ = "beauty_inspirations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(128))
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    style_tags: Mapped[list] = mapped_column(JSON, default=list)
    representative_look: Mapped[str] = mapped_column(String(128), default="")
    suitable_for: Mapped[list] = mapped_column(JSON, default=list)
    difficulty: Mapped[str] = mapped_column(String(32), default="中等")
    analysis: Mapped[str] = mapped_column(Text, default="")
    representative_video_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    categories: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
