from typing import Literal
from pydantic import Field
from .common import CamelModel
from .makeup_card import MakeupCard


InspirationType = Literal["creator", "style", "scene", "beginner_training"]


class InspirationCategories(CamelModel):
    style: list[str] = []
    creator_type: list[str] = Field(default_factory=list, alias="creatorType")
    scene: list[str] = []


class Inspiration(CamelModel):
    inspiration_id: str = Field(alias="inspirationId")
    type: InspirationType
    name: str
    avatar_url: str | None = Field(default=None, alias="avatarUrl")
    style_tags: list[str] = Field(default_factory=list, alias="styleTags")
    representative_look: str = Field(alias="representativeLook")
    suitable_for: list[str] = Field(default_factory=list, alias="suitableFor")
    difficulty: str
    analysis: str
    representative_video_url: str | None = Field(
        default=None, alias="representativeVideoUrl"
    )
    categories: InspirationCategories = Field(default_factory=InspirationCategories)


class InspirationListResponse(CamelModel):
    items: list[Inspiration]


class GenerateMyVersionRequest(CamelModel):
    session_id: str | None = Field(default=None, alias="sessionId")
    use_profile: bool = Field(default=True, alias="useProfile")
    use_short_term_context: bool = Field(default=True, alias="useShortTermContext")


class PersonalizedAdjustment(CamelModel):
    original: str
    mine: str
    reason: str


class GenerateMyVersionResponse(CamelModel):
    card: MakeupCard
    personalized_adjustments: list[PersonalizedAdjustment] = Field(
        default_factory=list, alias="personalizedAdjustments"
    )
