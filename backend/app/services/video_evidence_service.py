"""视频证据增强服务：抽帧、脸部检测、局部 crop、颜色提示。

第一阶段 mock；P1 可对已上传视频做关键帧抽取。
"""

from ..schemas.makeup_card import VideoEvidence, VisualHints


def build_evidence_from_link(_url: str) -> VideoEvidence:
    return VideoEvidence(
        sourceType="link",
        selectedFrames=[],
        regions={},
        visualHints=VisualHints(
            lipColor="low_saturation_red_brown",
            blushPosition="under_eye_outer",
            eyeMakeupTone="light_brown",
            eyelinerLengthHint="outer_third_short",
        ),
    )


def build_evidence_from_media(_media_path: str, _file_type: str) -> VideoEvidence:
    return VideoEvidence(
        sourceType="video",
        selectedFrames=[],
        regions={},
        visualHints=VisualHints(
            lipColor="low_saturation_red_brown",
            blushPosition="under_eye_outer",
            eyeMakeupTone="light_brown",
            eyelinerLengthHint="outer_third_short",
        ),
    )
