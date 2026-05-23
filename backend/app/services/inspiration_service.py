"""灵感库 mock 数据 + 我的版本生成。"""

from datetime import datetime, timezone, timedelta
from uuid import uuid4

from ..schemas.inspiration import (
    Inspiration,
    InspirationCategories,
    GenerateMyVersionResponse,
    PersonalizedAdjustment,
)
from ..schemas.makeup_card import (
    EvidenceSummary,
    MakeupCard,
    MakeupStep,
)


_MOCK_INSPIRATIONS: list[Inspiration] = [
    Inspiration(
        inspirationId="insp_001",
        type="style",
        name="清冷通勤妆助手",
        avatarUrl=None,
        styleTags=["清冷", "低饱和", "通勤"],
        representativeLook="清冷感通勤妆",
        suitableFor=["淡颜", "新手", "上班族"],
        difficulty="中等",
        analysis="底妆干净、眼线短、腮红弱存在感。",
        representativeVideoUrl=None,
        categories=InspirationCategories(
            style=["清冷通勤"],
            creatorType=[],
            scene=["通勤", "面试"],
        ),
    ),
    Inspiration(
        inspirationId="insp_002",
        type="scene",
        name="约会甜感妆",
        styleTags=["温柔", "桃花感", "约会"],
        representativeLook="桃花约会妆",
        suitableFor=["甜系", "圆脸"],
        difficulty="新手",
        analysis="豆沙腮红 + 奶油唇 + 淡淡眼尾红。",
        categories=InspirationCategories(
            style=["甜感"], creatorType=[], scene=["约会"]
        ),
    ),
    Inspiration(
        inspirationId="insp_003",
        type="beginner_training",
        name="新手陪练 · 5 分钟轻底妆",
        styleTags=["新手", "极简", "通勤"],
        representativeLook="5分钟通勤底妆",
        suitableFor=["新手", "学生"],
        difficulty="新手",
        analysis="只做底妆 + 简单口红，重点是手法。",
        categories=InspirationCategories(
            style=["极简"], creatorType=[], scene=["上学", "通勤"]
        ),
    ),
]


def list_inspirations(
    type_: str | None = None,
    style: str | None = None,
    scene: str | None = None,
    difficulty: str | None = None,
) -> list[Inspiration]:
    items = _MOCK_INSPIRATIONS
    if type_:
        items = [i for i in items if i.type == type_]
    if style:
        items = [i for i in items if style in i.categories.style]
    if scene:
        items = [i for i in items if scene in i.categories.scene]
    if difficulty:
        items = [i for i in items if i.difficulty == difficulty]
    return items


def get_inspiration(inspiration_id: str) -> Inspiration | None:
    return next((i for i in _MOCK_INSPIRATIONS if i.inspiration_id == inspiration_id), None)


def generate_my_version(inspiration: Inspiration) -> GenerateMyVersionResponse:
    now = datetime.now(timezone(timedelta(hours=8)))
    card = MakeupCard(
        cardId=f"card_from_{inspiration.inspiration_id}_{uuid4().hex[:6]}",
        sourceType="inspiration",
        sourcePlatform=None,
        sourceUrl=None,
        sourceAssetId=None,
        title=f"我的{inspiration.representative_look}",
        styleTags=inspiration.style_tags + ["新手友好"],
        difficulty="简单",
        estimatedTime="15分钟",
        scenes=inspiration.categories.scene,
        productTypes=["气垫", "眼影", "眼线笔", "腮红", "唇泥"],
        steps=[
            MakeupStep(
                stepNo=1, part="底妆", instruction="均匀肤色，不追求强遮瑕", tips=[]
            ),
            MakeupStep(
                stepNo=2,
                part="眼妆",
                instruction="浅色眼影点缀，眼线只画后半段",
                tips=["眼线不要过长"],
            ),
            MakeupStep(
                stepNo=3,
                part="腮红与唇",
                instruction="腮红放在眼下外侧，唇色选低饱和系",
                tips=["少量多次"],
            ),
        ],
        riskPoints=["眼线过长"],
        aiTip="我已经根据这张灵感卡片，把眼线和腮红调得更轻盈。",
        confidence=0.75,
        evidenceSummary=EvidenceSummary(hasVideoEvidence=False, supportLevel="mock"),
        createdAt=now,
    )
    return GenerateMyVersionResponse(
        card=card,
        personalizedAdjustments=[
            PersonalizedAdjustment(
                original="眼线自然延长",
                mine="只画后半段，眼尾延长约 2mm",
                reason="更适合淡颜和通勤场景",
            ),
            PersonalizedAdjustment(
                original="腮红较高",
                mine="腮红放在眼下外侧、低位",
                reason="降低强存在感，避免过于甜",
            ),
        ],
    )
