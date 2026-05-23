from datetime import datetime
from typing import Literal
from pydantic import Field
from .common import CamelModel


SourceType = Literal["link", "image", "video", "inspiration"]


class MakeupStep(CamelModel):
    step_no: int = Field(alias="stepNo")
    part: str
    instruction: str
    tips: list[str] = []


class EvidenceSummary(CamelModel):
    has_video_evidence: bool = Field(default=False, alias="hasVideoEvidence")
    support_level: Literal["mock", "weak", "strong"] = Field(
        default="mock", alias="supportLevel"
    )


class MakeupCard(CamelModel):
    card_id: str = Field(alias="cardId")
    source_type: SourceType = Field(alias="sourceType")
    source_platform: str | None = Field(default=None, alias="sourcePlatform")
    source_url: str | None = Field(default=None, alias="sourceUrl")
    source_asset_id: str | None = Field(default=None, alias="sourceAssetId")

    title: str
    style_tags: list[str] = Field(default_factory=list, alias="styleTags")
    difficulty: str
    estimated_time: str = Field(alias="estimatedTime")
    scenes: list[str] = []
    product_types: list[str] = Field(default_factory=list, alias="productTypes")
    steps: list[MakeupStep] = []
    risk_points: list[str] = Field(default_factory=list, alias="riskPoints")
    ai_tip: str = Field(alias="aiTip")
    confidence: float = 0.0
    evidence_summary: EvidenceSummary = Field(
        default_factory=EvidenceSummary, alias="evidenceSummary"
    )
    created_at: datetime = Field(alias="createdAt")


class VisualHints(CamelModel):
    lip_color: str | None = Field(default=None, alias="lipColor")
    blush_position: str | None = Field(default=None, alias="blushPosition")
    eye_makeup_tone: str | None = Field(default=None, alias="eyeMakeupTone")
    eyeliner_length_hint: str | None = Field(default=None, alias="eyelinerLengthHint")


class VideoEvidence(CamelModel):
    source_type: SourceType = Field(alias="sourceType")
    selected_frames: list[str] = Field(default_factory=list, alias="selectedFrames")
    regions: dict = {}
    visual_hints: VisualHints = Field(
        default_factory=VisualHints, alias="visualHints"
    )


class AnalyzeRequest(CamelModel):
    source_type: SourceType = Field(alias="sourceType")
    source_url: str | None = Field(default=None, alias="sourceUrl")
    media_asset_id: str | None = Field(default=None, alias="mediaAssetId")


class AnalyzeResponse(CamelModel):
    card: MakeupCard
    video_evidence: VideoEvidence = Field(alias="videoEvidence")


class ShareResponse(CamelModel):
    share_url: str = Field(alias="shareUrl")
    share_text: str = Field(alias="shareText")
    image_url: str | None = Field(default=None, alias="imageUrl")
