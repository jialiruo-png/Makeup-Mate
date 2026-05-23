from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class BeautyProfile(Base):
    __tablename__ = "beauty_profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True, unique=True)

    face_shape: Mapped[str | None] = mapped_column(String(32), nullable=True)
    skin_tone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    feature_style: Mapped[str | None] = mapped_column(String(32), nullable=True)
    eye_type: Mapped[str | None] = mapped_column(String(32), nullable=True)

    preferred_blush_position: Mapped[str | None] = mapped_column(String(64), nullable=True)
    preferred_eyeliner: Mapped[str | None] = mapped_column(String(64), nullable=True)
    preferred_lip_colors: Mapped[list] = mapped_column(JSON, default=list)
    avoid_styles: Mapped[list] = mapped_column(JSON, default=list)

    skill_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    common_scenes: Mapped[list] = mapped_column(JSON, default=list)
    time_preference: Mapped[str | None] = mapped_column(String(32), nullable=True)

    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    save_raw_photo: Mapped[bool] = mapped_column(Boolean, default=False)

    face_geometry_summary: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
