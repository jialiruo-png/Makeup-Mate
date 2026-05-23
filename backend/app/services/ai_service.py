"""文本大模型 / 多模态妆容理解服务。

第一阶段返回 mock 数据。所有外部 AI 调用都封装在这里，未来替换内部实现即可。
"""

from datetime import datetime, timezone, timedelta
from uuid import uuid4

from ..schemas.makeup_card import (
    AnalyzeRequest,
    AnalyzeResponse,
    EvidenceSummary,
    MakeupCard,
    MakeupStep,
    VideoEvidence,
    VisualHints,
)


def _now_iso() -> datetime:
    return datetime.now(timezone(timedelta(hours=8)))


def analyze_makeup(req: AnalyzeRequest) -> AnalyzeResponse:
    """根据链接 / 图片 / 视频生成妆容解析卡片。第一阶段 mock。"""
    card = MakeupCard(
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
            MakeupStep(
                stepNo=1,
                part="底妆",
                instruction="轻薄雾面底妆，重点均匀肤色",
                tips=["不要追求强遮瑕", "保持妆面干净"],
            ),
            MakeupStep(
                stepNo=2,
                part="眼妆",
                instruction="浅棕眼影打底 + 后半段短眼线",
                tips=["眼线不要过长", "眼影点到为止"],
            ),
            MakeupStep(
                stepNo=3,
                part="腮红与唇",
                instruction="杏粉腮红放在眼下外侧，奶茶豆沙唇泥",
                tips=["腮红少量多次", "唇色不要过深"],
            ),
        ],
        riskPoints=["眼线过长", "修容过重", "唇色过深"],
        aiTip="这个妆容整体适合日常，新手建议弱化眼线和修容。",
        confidence=0.82,
        evidenceSummary=EvidenceSummary(hasVideoEvidence=True, supportLevel="mock"),
        createdAt=_now_iso(),
    )

    evidence = VideoEvidence(
        sourceType=req.source_type,
        selectedFrames=[],
        regions={},
        visualHints=VisualHints(
            lipColor="low_saturation_red_brown",
            blushPosition="under_eye_outer",
            eyeMakeupTone="light_brown",
            eyelinerLengthHint="outer_third_short",
        ),
    )
    return AnalyzeResponse(card=card, videoEvidence=evidence)


def reply_in_session(card_title: str | None, user_message: str) -> str:
    """根据用户消息返回 mock 回复。第一阶段固定话术。"""
    if "腮红" in user_message:
        return "可以用低饱和豆沙粉或很浅的奶茶粉替代，少量多次，放在眼下外侧，不要压到颧骨下方。"
    if "眼线" in user_message:
        return "建议只画后半段眼线，眼尾延长 2mm 左右，整体会更轻盈也更适合通勤。"
    if "完成" in user_message or "好了" in user_message:
        return "好的，接下来我们进入下一个步骤。要不要先让我帮你确认一下当前的状态？"
    if card_title:
        return f"我先按「{card_title}」的节奏陪你走完一遍，遇到不顺手的步骤随时告诉我。"
    return "我在这里，告诉我你想从哪一步开始，或者让我先帮你梳理一下整体节奏。"
