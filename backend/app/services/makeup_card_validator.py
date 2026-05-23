"""用 VideoEvidence 校验 AI 生成的 MakeupCard。

第一阶段只补默认 confidence。后续按规则收紧 AI 的"过度发挥"。
"""

from ..schemas.makeup_card import MakeupCard, VideoEvidence


def validate_with_evidence(card: MakeupCard, evidence: VideoEvidence) -> MakeupCard:
    if evidence.visual_hints and any(
        [
            evidence.visual_hints.lip_color,
            evidence.visual_hints.blush_position,
            evidence.visual_hints.eye_makeup_tone,
            evidence.visual_hints.eyeliner_length_hint,
        ]
    ):
        card.confidence = max(card.confidence, 0.7)
    else:
        card.confidence = min(card.confidence, 0.6)
    return card
