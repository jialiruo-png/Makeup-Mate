import logging

from fastapi import APIRouter, Depends

from ..config import get_settings
from ..db import SessionLocal
from ..deps import require_real_user
from ..models.media_asset import MediaAsset as MediaAssetModel
from ..models.user import User
from ..schemas.beauty_profile import (
    AnalyzePhotoRequest,
    AnalyzePhotoResponse,
    MeResponse,
    RetentionInfo,
    UpdateMeRequest,
)
from ..schemas.common import OkResponse
from ..services import memory_service, selfie_service

router = APIRouter(prefix="/profile", tags=["profile"])

log = logging.getLogger("makeup-mate.profile")
_settings = get_settings()


def _public_image_url(media_asset_id: str) -> str | None:
    base = _settings.public_base_url.rstrip("/")
    if not base:
        log.warning("PUBLIC_BASE_URL not configured; selfie analyze will use fallback")
        return None
    with SessionLocal() as db:
        row = db.get(MediaAssetModel, media_asset_id)
        if not row or row.file_type != "image":
            return None
    return f"{base}/api/media/{media_asset_id}/raw"


def _summarize_geometry(face_geometry) -> dict:
    """提取精简标签存进 face_geometry_summary，绝不存原图。"""
    return {
        "source": face_geometry.source,
        "faceRatio": face_geometry.face_ratio,
        "headPose": {
            "yaw": face_geometry.head_pose.yaw if face_geometry.head_pose else None,
            "pitch": face_geometry.head_pose.pitch if face_geometry.head_pose else None,
        },
        "suggestionAnchors": {
            "blushArea": face_geometry.suggestion_anchors.blush_area
            if face_geometry.suggestion_anchors
            else None,
            "eyelinerArea": face_geometry.suggestion_anchors.eyeliner_area
            if face_geometry.suggestion_anchors
            else None,
            "lipArea": face_geometry.suggestion_anchors.lip_area
            if face_geometry.suggestion_anchors
            else None,
        },
    }


@router.post(
    "/analyze-photo",
    response_model=AnalyzePhotoResponse,
    response_model_by_alias=True,
)
def analyze_photo(
    payload: AnalyzePhotoRequest,
    user: User = Depends(require_real_user),
) -> AnalyzePhotoResponse:
    media_url = _public_image_url(payload.media_asset_id)
    if media_url:
        beauty_profile, face_geometry = selfie_service.analyze_selfie(media_url)
    else:
        beauty_profile, face_geometry = selfie_service.fallback_profile()

    saved = False
    # 只有用户明确同意 + Qwen 真分析过（不是 fallback）时才落库
    if payload.save_to_profile and face_geometry.source == "qwen_vl":
        try:
            memory_service.save_profile_from_selfie(
                user.id,
                beauty_profile,
                face_geometry_summary=_summarize_geometry(face_geometry),
            )
            saved = True
        except Exception as exc:  # 落库失败不影响接口返回
            log.exception("save_profile_from_selfie failed: %s", exc)

    return AnalyzePhotoResponse(
        retention=RetentionInfo(
            rawImage="session_only",
            longTermProfileSaved=saved,
        ),
        faceGeometry=face_geometry,
        beautyProfile=beauty_profile,
    )


@router.get("/me", response_model=MeResponse, response_model_by_alias=True)
def get_me(user: User = Depends(require_real_user)) -> MeResponse:
    return memory_service.get_me(user.id)


@router.patch("/me", response_model=MeResponse, response_model_by_alias=True)
def update_me(
    payload: UpdateMeRequest,
    user: User = Depends(require_real_user),
) -> MeResponse:
    return memory_service.update_profile(
        user.id,
        profile=payload.beauty_profile,
        privacy=payload.privacy,
        nickname=payload.nickname,
        avatar_url=payload.avatar_url,
    )


@router.delete("/me/memory", response_model=OkResponse)
def clear_memory(user: User = Depends(require_real_user)) -> OkResponse:
    memory_service.clear_memory(user.id)
    return OkResponse(ok=True)
