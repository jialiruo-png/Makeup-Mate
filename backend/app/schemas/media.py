from datetime import datetime
from typing import Literal
from pydantic import Field
from .common import CamelModel


MediaPurpose = Literal[
    "makeup_source_image",
    "makeup_source_video",
    "selfie",
    "progress_check",
]
RetentionPolicy = Literal[
    "session_only",
    "profile_summary_allowed",
    "temporary_source",
]
FileType = Literal["image", "video"]
AnalysisStatus = Literal["pending", "ready", "failed"]


class MediaAsset(CamelModel):
    media_asset_id: str = Field(alias="mediaAssetId")
    file_type: FileType = Field(alias="fileType")
    purpose: MediaPurpose
    analysis_status: AnalysisStatus = Field(alias="analysisStatus")
    retention_policy: RetentionPolicy = Field(alias="retentionPolicy")
    expires_at: datetime | None = Field(default=None, alias="expiresAt")
