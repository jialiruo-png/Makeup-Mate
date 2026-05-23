from fastapi import APIRouter

from ..config import get_settings
from ..schemas.beauty_profile import (
    AnalyzePhotoRequest,
    AnalyzePhotoResponse,
    BeautyProfile,
    MeResponse,
    RetentionInfo,
    UpdateMeRequest,
)
from ..schemas.common import OkResponse
from ..services import memory_service, mediapipe_service

router = APIRouter(prefix="/profile", tags=["profile"])

_settings = get_settings()


def _default_beauty_profile() -> BeautyProfile:
    return BeautyProfile(
        faceShape="方圆脸",
        skinTone="自然偏暖",
        featureStyle="淡颜偏自然",
        eyeType="内双",
        preferredBlushPosition="眼下外侧上移",
        preferredEyeliner="后半段短眼线",
        preferredLipColors=["奶茶色", "豆沙色", "低饱和红棕"],
        avoidStyles=["重修容", "过长上挑眼线"],
    )


@router.post(
    "/analyze-photo",
    response_model=AnalyzePhotoResponse,
    response_model_by_alias=True,
)
def analyze_photo(payload: AnalyzePhotoRequest) -> AnalyzePhotoResponse:
    face_geometry = mediapipe_service.extract_face_geometry()
    return AnalyzePhotoResponse(
        retention=RetentionInfo(
            rawImage="session_only",
            longTermProfileSaved=payload.save_to_profile,
        ),
        faceGeometry=face_geometry,
        beautyProfile=_default_beauty_profile(),
    )


@router.get("/me", response_model=MeResponse, response_model_by_alias=True)
def get_me() -> MeResponse:
    return memory_service.get_me(_settings.default_user_id)


@router.patch("/me", response_model=MeResponse, response_model_by_alias=True)
def update_me(_payload: UpdateMeRequest) -> MeResponse:
    # 第一阶段先返回固定档案，后续接 DB 落地。
    return memory_service.get_me(_settings.default_user_id)


@router.delete("/me/memory", response_model=OkResponse)
def clear_memory() -> OkResponse:
    # 第一阶段直接返回成功；落库后清空 memory_items。
    return OkResponse(ok=True)
