"""灵感库：从 app/data/ 下的 JSON 构建 creator / style / scene / beginner_training 四类卡片。"""

from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from functools import lru_cache
from pathlib import Path
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


_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


# 场景卡（与前端 ChatPage.tsx sceneCards() 保持一一对应）
_SCENE_DEFS: list[tuple[str, str, str, str, list[str]]] = [
    ("通勤", "5 步极简通勤妆", "上班族 · 赶时间", "新手", ["通勤", "极简"]),
    ("上课", "清透学生妆", "学生党 · 淡颜", "新手", ["上课", "韩系"]),
    ("约会", "桃花约会妆", "甜系 · 圆脸", "简单", ["约会", "甜妹"]),
    ("面试", "稳重面试妆", "职场新人", "简单", ["面试", "干净"]),
    ("拍照", "上镜拍照妆", "活动 · 旅拍", "中等", ["拍照", "上镜"]),
    ("证件照", "证件照专属妆", "考试 · 证件", "简单", ["证件照", "干净"]),
]


# 新手陪练（与前端 BEGINNER_CARDS 保持一一对应）
_BEGINNER_DEFS: list[dict] = [
    {
        "id": "beginner_eyeliner",
        "name": "第一次画眼线",
        "look": "后半段短眼线",
        "tags": ["新手", "短眼线"],
        "suitable": ["手残党", "内双", "初学者"],
        "analysis": "只练眼尾三分之一，避免完整上挑线条。",
    },
    {
        "id": "beginner_blush",
        "name": "第一次画腮红",
        "look": "眼下外侧腮红",
        "tags": ["新手", "上移"],
        "suitable": ["圆脸", "方圆脸", "气色弱"],
        "analysis": "先找位置再少量叠加，避免腮红压低显脸重。",
    },
    {
        "id": "beginner_10min",
        "name": "10 分钟新手妆",
        "look": "保姆级 5 步妆",
        "tags": ["极简", "无翻车"],
        "suitable": ["第一次化妆", "赶时间"],
        "analysis": "保留底妆、眉毛、腮红、口红，跳过复杂修容。",
    },
]


def _load_json(name: str):
    with open(_DATA_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


def _build_creator_inspirations() -> list[Inspiration]:
    creators = _load_json("creator_profiles_merged.json")
    items: list[Inspiration] = []
    for c in creators:
        items.append(
            Inspiration(
                inspirationId=c["creatorId"],
                type="creator",
                name=c.get("displayName") or c.get("creatorName") or c["creatorId"],
                avatarUrl=c.get("avatarLocalPath") or None,
                styleTags=list(c.get("styleTags", []))[:3],
                representativeLook=(c.get("representativeLooks") or [c.get("makeupMateUseCase", "")])[0],
                suitableFor=list(c.get("fitUsers", []))[:3],
                difficulty=c.get("difficulty", "中等"),
                analysis=c.get("styleSummary", ""),
                representativeVideoUrl=(c.get("representativeVideoLinks") or [None])[0],
                categories=InspirationCategories(
                    style=list(c.get("styleTags", [])),
                    creatorType=[c.get("creatorType", "")] if c.get("creatorType") else [],
                    scene=[],
                ),
            )
        )
    return items


def _build_style_inspirations() -> list[Inspiration]:
    schema = _load_json("makeup_mate_creator_library_schema.json")
    items: list[Inspiration] = []
    for cat in schema.get("styleCategories", []):
        items.append(
            Inspiration(
                inspirationId=cat["categoryId"],
                type="style",
                name=cat["categoryName"],
                avatarUrl=f"/assets/inspiration-covers/style/{cat['categoryId']}.png",
                styleTags=list(cat.get("styleTags", []))[:3],
                representativeLook=(cat.get("representativeLooks") or [cat["categoryName"]])[0],
                suitableFor=list(cat.get("fitUsers", []))[:3],
                difficulty=cat.get("difficulty", "中等"),
                analysis=cat.get("description", ""),
                categories=InspirationCategories(
                    style=[cat["categoryName"], *cat.get("aliases", [])],
                    creatorType=[],
                    scene=[],
                ),
            )
        )
    return items


def _build_scene_inspirations() -> list[Inspiration]:
    items: list[Inspiration] = []
    for name, look, suitable, difficulty, tags in _SCENE_DEFS:
        items.append(
            Inspiration(
                inspirationId=f"scene_{name}",
                type="scene",
                name=name,
                avatarUrl=f"/assets/inspiration-covers/scene/scene_{_scene_slug(name)}.png",
                styleTags=tags,
                representativeLook=look,
                suitableFor=suitable.split(" · "),
                difficulty=difficulty,
                analysis=f"{name}场景优先控制干净度、用时和翻车风险，适合生成可执行步骤。",
                categories=InspirationCategories(style=tags, creatorType=[], scene=[name]),
            )
        )
    return items


def _scene_slug(name: str) -> str:
    mapping = {
        "通勤": "commute",
        "上课": "school",
        "约会": "date",
        "面试": "interview",
        "拍照": "photo",
        "证件照": "id_photo",
    }
    return mapping.get(name, name)


def _build_beginner_inspirations() -> list[Inspiration]:
    items: list[Inspiration] = []
    for b in _BEGINNER_DEFS:
        items.append(
            Inspiration(
                inspirationId=b["id"],
                type="beginner_training",
                name=b["name"],
                avatarUrl=f"/assets/inspiration-covers/beginner/{b['id']}.png",
                styleTags=b["tags"],
                representativeLook=b["look"],
                suitableFor=b["suitable"],
                difficulty="新手",
                analysis=b["analysis"],
                categories=InspirationCategories(style=b["tags"], creatorType=[], scene=[]),
            )
        )
    return items


@lru_cache(maxsize=1)
def _all_inspirations() -> list[Inspiration]:
    return [
        *_build_creator_inspirations(),
        *_build_style_inspirations(),
        *_build_scene_inspirations(),
        *_build_beginner_inspirations(),
    ]


def list_inspirations(
    type_: str | None = None,
    style: str | None = None,
    scene: str | None = None,
    difficulty: str | None = None,
) -> list[Inspiration]:
    items = _all_inspirations()
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
    return next(
        (i for i in _all_inspirations() if i.inspiration_id == inspiration_id), None
    )


def generate_my_version(inspiration: Inspiration) -> GenerateMyVersionResponse:
    """根据灵感卡生成"我的版本"。

    当前是规则版：把灵感的 representative_look / style_tags 翻成 3 步可执行 card。
    后续可以接 Qwen-VL 把 inspiration 描述 + 用户档案丢进 prompt 生成更个性化版本。
    """
    now = datetime.now(timezone(timedelta(hours=8)))
    tags = list(inspiration.style_tags) + ["个人改写"]
    look = inspiration.representative_look or inspiration.name

    if inspiration.type == "beginner_training":
        estimated_time = "10分钟"
    elif inspiration.difficulty == "新手":
        estimated_time = "15分钟"
    else:
        estimated_time = "18分钟"

    scenes = inspiration.categories.scene or ["通勤", "日常"]

    card = MakeupCard(
        cardId=f"card_from_{inspiration.inspiration_id}_{uuid4().hex[:6]}",
        sourceType="inspiration",
        sourcePlatform=None,
        sourceUrl=None,
        sourceAssetId=None,
        title=f"我的{look}",
        styleTags=tags,
        difficulty=inspiration.difficulty,
        estimatedTime=estimated_time,
        scenes=scenes,
        productTypes=["气垫", "遮瑕", "眼影", "眼线笔", "腮红", "口红"],
        steps=[
            MakeupStep(
                stepNo=1,
                part="底妆",
                instruction="先完成轻薄底妆，保持妆面干净。",
                tips=[],
            ),
            MakeupStep(
                stepNo=2,
                part="眉眼",
                instruction="保留原风格重点，但把线条改短、改轻。",
                tips=["眼线只画后半段"],
            ),
            MakeupStep(
                stepNo=3,
                part="腮红与唇",
                instruction="用低饱和颜色统一气色，避免过重。",
                tips=["少量多次叠加"],
            ),
        ],
        riskPoints=["眼线过长", "腮红过低", "唇色过深"],
        aiTip=f"已根据「{inspiration.name}」生成你的版本，可以继续上传自拍做更细调整。",
        confidence=0.78,
        evidenceSummary=EvidenceSummary(hasVideoEvidence=False, supportLevel="weak"),
        createdAt=now,
    )
    return GenerateMyVersionResponse(
        card=card,
        personalizedAdjustments=[
            PersonalizedAdjustment(
                original="眼线自然延长",
                mine="只画后半段，眼尾延长约 2mm",
                reason="更适合淡颜与通勤场景",
            ),
            PersonalizedAdjustment(
                original="腮红较高",
                mine="腮红放在眼下外侧、低位",
                reason="降低强存在感，避免过于甜",
            ),
        ],
    )
