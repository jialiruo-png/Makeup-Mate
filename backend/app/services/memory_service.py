"""长期档案 / AI 记忆服务。

读写 `beauty_profiles` 表。
- 用户没自拍过：返回内置默认档案，但 DB 里不写任何东西。
- 用户上传自拍并同意保留：把 Qwen-VL 输出的结构化标签落到 `beauty_profiles`。
- 隐私边界：原图不存（由 media_asset retention 处理），这里只存结构化标签。
"""

from __future__ import annotations

import logging
from uuid import uuid4

from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models.beauty_profile import BeautyProfile as BeautyProfileModel
from ..models.user import User as UserModel
from ..schemas.beauty_profile import (
    BeautyProfile,
    MeResponse,
    PrivacySettings,
)

log = logging.getLogger("makeup-mate.memory")


_DEFAULT_PROFILE = BeautyProfile(
    faceShape="方圆脸",
    skinTone="自然偏暖",
    featureStyle="淡颜偏自然",
    eyeType="内双",
    preferredBlushPosition="眼下外侧上移",
    preferredEyeliner="后半段短眼线",
    preferredLipColors=["奶茶色", "豆沙色", "低饱和红棕"],
    avoidStyles=["重修容", "过长上挑眼线"],
)


def get_default_profile() -> BeautyProfile:
    """没自拍过的兜底档案。AI 也能用，但 completeness 标 0。"""
    return _DEFAULT_PROFILE.model_copy()


# ---------- 内部工具 ----------

def _row_to_schema(row: BeautyProfileModel) -> BeautyProfile:
    return BeautyProfile(
        faceShape=row.face_shape or _DEFAULT_PROFILE.face_shape,
        skinTone=row.skin_tone or _DEFAULT_PROFILE.skin_tone,
        featureStyle=row.feature_style or _DEFAULT_PROFILE.feature_style,
        eyeType=row.eye_type or _DEFAULT_PROFILE.eye_type,
        preferredBlushPosition=row.preferred_blush_position
        or _DEFAULT_PROFILE.preferred_blush_position,
        preferredEyeliner=row.preferred_eyeliner or _DEFAULT_PROFILE.preferred_eyeliner,
        preferredLipColors=list(row.preferred_lip_colors or _DEFAULT_PROFILE.preferred_lip_colors),
        avoidStyles=list(row.avoid_styles or _DEFAULT_PROFILE.avoid_styles),
    )


def _completeness(row: BeautyProfileModel | None) -> float:
    if not row:
        return 0.0
    filled = sum(
        1
        for v in (
            row.face_shape,
            row.skin_tone,
            row.feature_style,
            row.eye_type,
            row.preferred_blush_position,
            row.preferred_eyeliner,
            row.preferred_lip_colors,
            row.avoid_styles,
        )
        if v
    )
    return round(filled / 8, 2)


def _get_user(db: Session, user_id: str) -> UserModel | None:
    return db.get(UserModel, user_id)


def _get_profile_row(db: Session, user_id: str) -> BeautyProfileModel | None:
    return (
        db.query(BeautyProfileModel)
        .filter(BeautyProfileModel.user_id == user_id)
        .first()
    )


# ---------- 对外 API ----------

def get_me(user_id: str) -> MeResponse:
    """读 users + beauty_profiles，组装个人档案视图。

    没有 BeautyProfile 行就给默认档案，completeness=0，提示用户去做自拍分析。
    """
    with SessionLocal() as db:
        user = _get_user(db, user_id)
        nickname = user.nickname if user else "妆搭体验用户"
        avatar = user.avatar_url if user else None

        row = _get_profile_row(db, user_id)
        if row:
            profile = _row_to_schema(row)
            privacy = PrivacySettings(
                saveProfileEnabled=True,
                memoryEnabled=bool(row.memory_enabled),
                saveRawPhoto=bool(row.save_raw_photo),
            )
            completeness = _completeness(row)
        else:
            profile = get_default_profile()
            privacy = PrivacySettings(
                saveProfileEnabled=True,
                memoryEnabled=True,
                saveRawPhoto=False,
            )
            completeness = 0.0

    return MeResponse(
        userId=user_id,
        nickname=nickname,
        avatarUrl=avatar,
        profileCompleteness=completeness,
        beautyProfile=profile,
        privacy=privacy,
    )


def save_profile_from_selfie(
    user_id: str,
    profile: BeautyProfile,
    face_geometry_summary: dict | None = None,
) -> BeautyProfile:
    """把 Qwen-VL 解析出的 BeautyProfile 落到 DB。

    upsert：行存在就更新字段，不存在就插。
    face_geometry_summary 只存精简标签（faceRatio / headPose / suggestionAnchors），不存原图。
    """
    with SessionLocal() as db:
        row = _get_profile_row(db, user_id)
        if row is None:
            row = BeautyProfileModel(
                id=f"bp_{uuid4().hex[:12]}",
                user_id=user_id,
            )
            db.add(row)

        row.face_shape = profile.face_shape
        row.skin_tone = profile.skin_tone
        row.feature_style = profile.feature_style
        row.eye_type = profile.eye_type
        row.preferred_blush_position = profile.preferred_blush_position
        row.preferred_eyeliner = profile.preferred_eyeliner
        row.preferred_lip_colors = list(profile.preferred_lip_colors)
        row.avoid_styles = list(profile.avoid_styles)
        if face_geometry_summary is not None:
            row.face_geometry_summary = face_geometry_summary

        db.commit()
        db.refresh(row)
        return _row_to_schema(row)


def update_profile(
    user_id: str,
    profile: BeautyProfile | None = None,
    privacy: PrivacySettings | None = None,
    nickname: str | None = None,
    avatar_url: str | None = None,
) -> MeResponse:
    """PATCH /profile/me 用：可改昵称 / 头像 / 档案字段 / 隐私开关。"""
    with SessionLocal() as db:
        user = _get_user(db, user_id)
        if user:
            if nickname is not None:
                user.nickname = nickname
            if avatar_url is not None:
                user.avatar_url = avatar_url

        if profile is not None or privacy is not None:
            row = _get_profile_row(db, user_id)
            if row is None:
                row = BeautyProfileModel(
                    id=f"bp_{uuid4().hex[:12]}",
                    user_id=user_id,
                )
                db.add(row)

            if profile is not None:
                row.face_shape = profile.face_shape
                row.skin_tone = profile.skin_tone
                row.feature_style = profile.feature_style
                row.eye_type = profile.eye_type
                row.preferred_blush_position = profile.preferred_blush_position
                row.preferred_eyeliner = profile.preferred_eyeliner
                row.preferred_lip_colors = list(profile.preferred_lip_colors)
                row.avoid_styles = list(profile.avoid_styles)
            if privacy is not None:
                row.memory_enabled = privacy.memory_enabled
                row.save_raw_photo = privacy.save_raw_photo

        db.commit()
    return get_me(user_id)


def clear_memory(user_id: str) -> int:
    """清空用户的长期档案，返回删除的行数。

    只删 BeautyProfile 一行，不动 chat history（聊天历史有独立入口）。
    """
    with SessionLocal() as db:
        row = _get_profile_row(db, user_id)
        if row is None:
            return 0
        db.delete(row)
        db.commit()
        log.info("cleared BeautyProfile for user_id=%s", user_id)
        return 1
