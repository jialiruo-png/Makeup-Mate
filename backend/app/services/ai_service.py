"""文本大模型 / 多模态妆容理解服务。

图片输入：走 Qwen-VL-Max。其它来源（link / video）暂时仍走 mock。
Qwen 调用失败时会自动 fallback 到 mock，保证接口不挂。
"""

import logging
from datetime import datetime, timezone, timedelta
from uuid import uuid4

from ..config import get_settings
from ..db import SessionLocal
from ..models.media_asset import MediaAsset as MediaAssetModel
from ..schemas.makeup_card import (
    AnalyzeRequest,
    AnalyzeResponse,
    EvidenceSummary,
    MakeupCard,
    MakeupStep,
    VideoEvidence,
    VisualHints,
)
from . import qwen_client

log = logging.getLogger("makeup-mate.ai")
_settings = get_settings()


_ANALYZE_PROMPT = """你是「妆搭 Makeup Mate」的妆容解析助手。请仔细看这张图，输出一张可以复刻的妆容卡片。

严格按以下 JSON 字段输出（不要任何额外解释、不要 Markdown 代码块）：
{
  "title": "妆容名称，6-10 个汉字",
  "styleTags": ["3-5 个风格标签，如 低饱和 / 干净 / 淡颜友好"],
  "difficulty": "入门 / 中等 / 高阶 三选一",
  "estimatedTime": "如 18分钟",
  "scenes": ["适合的 2-4 个场景"],
  "productTypes": ["用到的产品类型 5-8 项，如 气垫 / 浅棕眼影 / 杏粉腮红 / 奶茶豆沙唇泥"],
  "steps": [
    {"stepNo": 1, "part": "底妆/眼妆/腮红与唇 等", "instruction": "做法 1-2 句", "tips": ["1-2 条小提示"]}
  ],
  "riskPoints": ["新手最容易翻车的 2-4 点"],
  "aiTip": "整体建议 1-2 句",
  "confidence": 0.0 到 1.0 之间的小数，代表你对解析的把握
}

要求：
- 全部中文。
- steps 不少于 3 步、不超过 6 步。
- 看不清的地方就别瞎编，confidence 给低分就好。"""


def _now_iso() -> datetime:
    return datetime.now(timezone(timedelta(hours=8)))


def _mock_card(req: AnalyzeRequest) -> MakeupCard:
    return MakeupCard(
        cardId=f"card_{uuid4().hex[:8]}",
        sourceType=req.source_type,
        sourcePlatform="douyin" if req.source_type == "link" else None,
        sourceUrl=req.source_url,
        sourceAssetId=req.media_asset_id,
        title="清冷感通勤妆",
        styleTags=["低饱和", "干净", "淡颜友好"],
        difficulty="中等",
        estimatedTime="18分钟",
        scenes=["通勤", "上课", "面试"],
        productTypes=["气垫", "遮瑕", "浅棕眼影", "棕色眼线笔", "杏粉腮红", "奶茶豆沙唇泥"],
        steps=[
            MakeupStep(stepNo=1, part="底妆", instruction="轻薄雾面底妆，重点均匀肤色", tips=["不要追求强遮瑕"]),
            MakeupStep(stepNo=2, part="眼妆", instruction="浅棕眼影打底 + 后半段短眼线", tips=["眼线不要过长"]),
            MakeupStep(stepNo=3, part="腮红与唇", instruction="杏粉腮红放在眼下外侧，奶茶豆沙唇泥", tips=["腮红少量多次"]),
        ],
        riskPoints=["眼线过长", "修容过重", "唇色过深"],
        aiTip="这个妆容整体适合日常，新手建议弱化眼线和修容。",
        confidence=0.82,
        evidenceSummary=EvidenceSummary(hasVideoEvidence=False, supportLevel="mock"),
        createdAt=_now_iso(),
    )


def _qwen_card_from_image(req: AnalyzeRequest, image_url: str) -> MakeupCard:
    raw = qwen_client.analyze_makeup_image(image_url, _ANALYZE_PROMPT)
    steps = [
        MakeupStep(
            stepNo=int(s.get("stepNo", i + 1)),
            part=str(s.get("part", "")),
            instruction=str(s.get("instruction", "")),
            tips=list(s.get("tips") or []),
        )
        for i, s in enumerate(raw.get("steps") or [])
    ]
    return MakeupCard(
        cardId=f"card_{uuid4().hex[:8]}",
        sourceType=req.source_type,
        sourcePlatform=None,
        sourceUrl=req.source_url,
        sourceAssetId=req.media_asset_id,
        title=str(raw.get("title") or "妆容解析"),
        styleTags=list(raw.get("styleTags") or []),
        difficulty=str(raw.get("difficulty") or "中等"),
        estimatedTime=str(raw.get("estimatedTime") or "约 15 分钟"),
        scenes=list(raw.get("scenes") or []),
        productTypes=list(raw.get("productTypes") or []),
        steps=steps,
        riskPoints=list(raw.get("riskPoints") or []),
        aiTip=str(raw.get("aiTip") or ""),
        confidence=float(raw.get("confidence") or 0.5),
        evidenceSummary=EvidenceSummary(hasVideoEvidence=False, supportLevel="strong"),
        createdAt=_now_iso(),
    )


def _public_image_url(media_asset_id: str) -> str | None:
    base = _settings.public_base_url.rstrip("/")
    if not base:
        log.warning("PUBLIC_BASE_URL not configured; Qwen will fall back to mock")
        return None
    with SessionLocal() as db:
        row = db.get(MediaAssetModel, media_asset_id)
        if not row:
            return None
    return f"{base}/api/media/{media_asset_id}/raw"


def analyze_makeup(req: AnalyzeRequest) -> AnalyzeResponse:
    card: MakeupCard | None = None
    if req.source_type == "image" and req.media_asset_id:
        image_url = _public_image_url(req.media_asset_id)
        if image_url:
            try:
                card = _qwen_card_from_image(req, image_url)
            except qwen_client.QwenUnavailable as exc:
                log.warning("Qwen unavailable, fallback to mock: %s", exc)

    if card is None:
        card = _mock_card(req)

    evidence = VideoEvidence(
        sourceType=req.source_type,
        selectedFrames=[],
        regions={},
        visualHints=VisualHints(),
    )
    return AnalyzeResponse(card=card, videoEvidence=evidence)


_CHAT_SYSTEM = (
    "你是「妆搭 Makeup Mate」的妆容陪练助手。你会陪用户一步步复刻当前的妆容卡片，"
    "回复要短、可执行、口语化，必要时给 1 条具体小建议。中文回答，不要寒暄。"
)


def reply_in_session(card_title: str | None, user_message: str) -> str:
    system = _CHAT_SYSTEM
    if card_title:
        system += f"\n当前妆容卡片标题：{card_title}。"
    try:
        return qwen_client.chat_text(user_message, system=system)
    except qwen_client.QwenUnavailable as exc:
        log.warning("Qwen chat unavailable, fallback to mock: %s", exc)

    if "腮红" in user_message:
        return "可以用低饱和豆沙粉或浅奶茶粉，少量多次扫在眼下外侧，不要压到颧骨下方。"
    if "眼线" in user_message:
        return "只画后半段眼线，眼尾延长 2mm 左右，整体会更轻盈。"
    if "完成" in user_message or "好了" in user_message:
        return "好的，进入下一步。要不要先让我帮你看看当前状态？"
    if card_title:
        return f"我先按「{card_title}」的节奏陪你走一遍，哪步不顺手随时说。"
    return "我在这里，告诉我你想从哪一步开始。"
