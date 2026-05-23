from datetime import datetime
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    file_type: Mapped[str] = mapped_column(String(16))  # image / video
    file_url: Mapped[str] = mapped_column(String(1024))
    purpose: Mapped[str] = mapped_column(String(32))
    analysis_status: Mapped[str] = mapped_column(String(16), default="pending")
    analysis_result: Mapped[dict] = mapped_column(JSON, default=dict)
    retention_policy: Mapped[str] = mapped_column(String(32), default="session_only")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
