from typing import Literal
from pydantic import Field
from .common import CamelModel


RetentionPolicy = Literal["session_only", "profile_summary_allowed"]


class HeadPose(CamelModel):
    yaw: str
    pitch: str


class SuggestionAnchors(CamelModel):
    blush_area: str | None = Field(default=None, alias="blushArea")
    eyeliner_area: str | None = Field(default=None, alias="eyelinerArea")
    lip_area: str | None = Field(default=None, alias="lipArea")


class FaceGeometry(CamelModel):
    face_detected: bool = Field(alias="faceDetected")
    source: str
    face_ratio: str | None = Field(default=None, alias="faceRatio")
    head_pose: HeadPose | None = Field(default=None, alias="headPose")
    suggestion_anchors: SuggestionAnchors | None = Field(
        default=None, alias="suggestionAnchors"
    )


class BeautyProfile(CamelModel):
    face_shape: str = Field(alias="faceShape")
    skin_tone: str = Field(alias="skinTone")
    feature_style: str = Field(alias="featureStyle")
    eye_type: str = Field(alias="eyeType")
    preferred_blush_position: str = Field(alias="preferredBlushPosition")
    preferred_eyeliner: str = Field(alias="preferredEyeliner")
    preferred_lip_colors: list[str] = Field(
        default_factory=list, alias="preferredLipColors"
    )
    avoid_styles: list[str] = Field(default_factory=list, alias="avoidStyles")


class AnalyzePhotoRequest(CamelModel):
    media_asset_id: str = Field(alias="mediaAssetId")
    session_id: str | None = Field(default=None, alias="sessionId")
    save_to_profile: bool = Field(default=False, alias="saveToProfile")


class RetentionInfo(CamelModel):
    raw_image: RetentionPolicy = Field(alias="rawImage")
    long_term_profile_saved: bool = Field(alias="longTermProfileSaved")


class AnalyzePhotoResponse(CamelModel):
    retention: RetentionInfo
    face_geometry: FaceGeometry = Field(alias="faceGeometry")
    beauty_profile: BeautyProfile = Field(alias="beautyProfile")


class PrivacySettings(CamelModel):
    save_profile_enabled: bool = Field(default=True, alias="saveProfileEnabled")
    memory_enabled: bool = Field(default=True, alias="memoryEnabled")
    save_raw_photo: bool = Field(default=False, alias="saveRawPhoto")


class MeResponse(CamelModel):
    user_id: str = Field(alias="userId")
    nickname: str
    avatar_url: str | None = Field(default=None, alias="avatarUrl")
    profile_completeness: float = Field(default=0.0, alias="profileCompleteness")
    beauty_profile: BeautyProfile | None = Field(
        default=None, alias="beautyProfile"
    )
    privacy: PrivacySettings = Field(default_factory=PrivacySettings)


class UpdateMeRequest(CamelModel):
    nickname: str | None = None
    avatar_url: str | None = Field(default=None, alias="avatarUrl")
    beauty_profile: BeautyProfile | None = Field(
        default=None, alias="beautyProfile"
    )
    privacy: PrivacySettings | None = None
