"""自拍 → BeautyProfile 解析服务。

输入用户自拍 URL，调 Qwen-VL 输出结构化标签（脸型 / 肤调 / 眼型 / 妆容偏好建议）。
Qwen 不可用时 fallback 到默认档案，保证接口不挂。

硬约束（写进 prompt）：
- 只输出客观的妆容相关结构化标签，不评价容貌、不打分、不诊断皮肤病。
- 不使用 "好看 / 不好看 / 漂亮 / 缺陷 / 不足" 等评判性词汇。
- 不识别身份、不做人脸比对、不输出可定位个人的描述。
"""

from __future__ import annotations

import logging

from ..schemas.beauty_profile import (
    BeautyProfile,
    FaceGeometry,
    HeadPose,
    SuggestionAnchors,
)
from . import qwen_client

log = logging.getLogger("makeup-mate.selfie")


_SELFIE_PROMPT = """你是「妆搭 Makeup Mate」的妆容偏好分析助手。看这张用户自拍，输出一份用于妆容推荐的结构化标签。

【硬性禁忌】
- 禁止评价容貌（不要出现 "好看 / 漂亮 / 缺陷 / 不足 / 瑕疵 / 五官不协调" 等词）。
- 禁止医疗诊断、皮肤病判断、痘痘成因分析。
- 禁止识别身份、年龄、人种、地域。
- 禁止任何针对个人的负面描述，所有表达必须中性、客观、可操作。
- 看不清就给保守值，不要瞎编。

【输出 JSON 字段】（严格遵守，不要加任何额外解释，不要 Markdown 代码块）：
{
  "faceShape": "方脸 / 圆脸 / 方圆脸 / 长脸 / 椭圆脸 / 心形脸 / 鹅蛋脸 之一",
  "skinTone": "冷白皮 / 自然偏冷 / 自然中性 / 自然偏暖 / 暖黄皮 / 小麦色 之一",
  "featureStyle": "对五官风格的中性描述，6-10 字，如 '淡颜偏自然' '骨相清秀'",
  "eyeType": "内双 / 外双 / 单眼皮 / 肿眼泡 / 桃花眼 之一",
  "preferredBlushPosition": "推荐的腮红位置，10 字内，如 '眼下外侧上移' '苹果肌中段'",
  "preferredEyeliner": "推荐的眼线画法，10 字内，如 '后半段短眼线' '内眼线 + 眼尾微下垂'",
  "preferredLipColors": ["推荐 2-4 个唇色方向，如 '奶茶色' '豆沙色' '低饱和红棕'"],
  "avoidStyles": ["建议避开的 2-3 个妆容方向，中性表述，如 '重修容' '过长上挑眼线' '冷调正红'"],
  "faceRatio": "slightly_long / slightly_round / balanced 之一",
  "headPose": {"yaw": "front / left / right 之一", "pitch": "up / neutral / down 之一"},
  "confidence": 0.0 到 1.0，对整体判断的把握
}

【字段填写要点】
- avoidStyles 是 "不建议尝试的风格"，不是 "你不适合"，措辞要中性。
- preferredXxx 是 "在这个偏好基础上能放大优点的画法"，不要写成 "你必须这样"。
- 全部中文。"""


_FALLBACK_PROFILE = BeautyProfile(
    faceShape="方圆脸",
    skinTone="自然偏暖",
    featureStyle="淡颜偏自然",
    eyeType="内双",
    preferredBlushPosition="眼下外侧上移",
    preferredEyeliner="后半段短眼线",
    preferredLipColors=["奶茶色", "豆沙色", "低饱和红棕"],
    avoidStyles=["重修容", "过长上挑眼线"],
)


_FALLBACK_GEOMETRY = FaceGeometry(
    faceDetected=True,
    source="fallback_default",
    faceRatio="balanced",
    headPose=HeadPose(yaw="front", pitch="neutral"),
    suggestionAnchors=SuggestionAnchors(
        blushArea="under_eye_outer",
        eyelinerArea="outer_third",
        lipArea="natural_lip_boundary",
    ),
)


def _anchors_from(profile: BeautyProfile) -> SuggestionAnchors:
    blush = "under_eye_outer" if "眼下" in profile.preferred_blush_position else "apple_mid"
    eyeliner = "outer_third" if "后半段" in profile.preferred_eyeliner else "inner_line"
    return SuggestionAnchors(
        blushArea=blush,
        eyelinerArea=eyeliner,
        lipArea="natural_lip_boundary",
    )


def fallback_profile() -> tuple[BeautyProfile, FaceGeometry]:
    """没有公网 URL（PUBLIC_BASE_URL 未配 / media 不是图片）时的兜底。"""
    return _FALLBACK_PROFILE, _FALLBACK_GEOMETRY


def analyze_selfie(media_url: str) -> tuple[BeautyProfile, FaceGeometry]:
    """看自拍图 → 返回 (BeautyProfile, FaceGeometry)。

    失败时返回 fallback 默认档案 + source="fallback_default"，调用方可据此判断是否真分析过。
    """
    try:
        raw = qwen_client.analyze_makeup_image(media_url, _SELFIE_PROMPT)
    except qwen_client.QwenUnavailable as exc:
        log.warning("Qwen-VL selfie analyze unavailable, fallback to default: %s", exc)
        return _FALLBACK_PROFILE, _FALLBACK_GEOMETRY

    try:
        profile = BeautyProfile(
            faceShape=str(raw.get("faceShape") or _FALLBACK_PROFILE.face_shape),
            skinTone=str(raw.get("skinTone") or _FALLBACK_PROFILE.skin_tone),
            featureStyle=str(raw.get("featureStyle") or _FALLBACK_PROFILE.feature_style),
            eyeType=str(raw.get("eyeType") or _FALLBACK_PROFILE.eye_type),
            preferredBlushPosition=str(
                raw.get("preferredBlushPosition") or _FALLBACK_PROFILE.preferred_blush_position
            ),
            preferredEyeliner=str(
                raw.get("preferredEyeliner") or _FALLBACK_PROFILE.preferred_eyeliner
            ),
            preferredLipColors=list(
                raw.get("preferredLipColors") or _FALLBACK_PROFILE.preferred_lip_colors
            ),
            avoidStyles=list(raw.get("avoidStyles") or _FALLBACK_PROFILE.avoid_styles),
        )
    except (TypeError, ValueError) as exc:
        log.warning("Qwen-VL selfie response shape unexpected: %s", exc)
        return _FALLBACK_PROFILE, _FALLBACK_GEOMETRY

    head_pose_raw = raw.get("headPose") or {}
    geometry = FaceGeometry(
        faceDetected=True,
        source="qwen_vl",
        faceRatio=str(raw.get("faceRatio") or "balanced"),
        headPose=HeadPose(
            yaw=str(head_pose_raw.get("yaw") or "front"),
            pitch=str(head_pose_raw.get("pitch") or "neutral"),
        ),
        suggestionAnchors=_anchors_from(profile),
    )
    return profile, geometry
