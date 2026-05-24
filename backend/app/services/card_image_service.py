"""Reusable visual backgrounds for shareable makeup cards.

The templates were generated with GPT image generation ahead of time and live
under frontend/public/assets/card-backgrounds. Runtime card export only selects
one template; canvas renders all Chinese text on top.
"""

from __future__ import annotations

from ..schemas.makeup_card import MakeupCard

_ASSET_BASE = "/assets/card-backgrounds"

_TEMPLATE_RULES: list[tuple[str, list[str]]] = [
    (
        "male-camera-clean.png",
        ["男生", "男士", "男性", "清爽", "证件照", "镜头", "舞台", "修容", "眉笔"],
    ),
    (
        "retro-hk-camera.png",
        ["港风", "复古", "红棕", "枫叶", "梅子", "聚会", "拍照", "上镜"],
    ),
    (
        "sweet-date-soft.png",
        ["甜", "约会", "桃花", "蜜桃", "杏粉", "珊瑚", "纯欲", "豆沙"],
    ),
    (
        "cool-clean-chic.png",
        ["清冷", "冷调", "低饱和", "淡颜", "灰棕", "冷玫瑰", "干净"],
    ),
    (
        "commute-low-saturation.png",
        ["通勤", "面试", "职场", "低饱和", "奶茶", "日常"],
    ),
]


def _card_text(card: MakeupCard) -> str:
    parts = [
        card.title,
        card.difficulty,
        card.ai_tip,
        *card.style_tags,
        *card.scenes,
        *card.product_types,
        *card.risk_points,
    ]
    for step in card.steps:
        parts.extend([step.part, step.instruction, *(step.tips or [])])
    return " ".join(p for p in parts if p)


def select_card_background(card: MakeupCard) -> tuple[str, str]:
    haystack = _card_text(card)
    for file_name, keywords in _TEMPLATE_RULES:
        if any(keyword in haystack for keyword in keywords):
            return f"{_ASSET_BASE}/{file_name}", file_name
    return f"{_ASSET_BASE}/clean-daily-unisex.png", "clean-daily-unisex.png"
