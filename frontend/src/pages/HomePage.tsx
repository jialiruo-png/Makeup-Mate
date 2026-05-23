import { useMemo, useRef, useState } from "react";
import { appActions } from "@/state/appStore";
import type { MakeupCard, SourceType } from "@/types";
import { uploadMedia } from "@/api/media";
import { request } from "@/api/client";
import "./HomePage.css";

type SourceTab = Extract<SourceType, "link" | "image" | "video">;
type AnalyzeStatus = "idle" | "loading" | "ready";

const SOURCE_TABS: Array<{ key: SourceTab; label: string; icon: string }> = [
  { key: "link", label: "粘贴链接", icon: "↗" },
  { key: "image", label: "上传图片", icon: "▧" },
  { key: "video", label: "上传视频", icon: "▶" },
];

interface PickedFile {
  file: File;
  mediaAssetId?: string;
}

export function HomePage() {
  const [source, setSource] = useState<SourceTab>("link");
  const [link, setLink] = useState("");
  const [picked, setPicked] = useState<Partial<Record<"image" | "video", PickedFile>>>({});
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [card, setCard] = useState<MakeupCard | undefined>();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const canAnalyze = useMemo(() => {
    if (source === "link") return link.trim().length > 0;
    return Boolean(picked[source]);
  }, [link, picked, source]);

  const openPicker = (type: "image" | "video") => {
    (type === "image" ? imageInputRef : videoInputRef).current?.click();
  };

  const onFilePicked = async (type: "image" | "video", file: File | undefined) => {
    if (!file) return;
    setPicked((prev) => ({ ...prev, [type]: { file } }));
    appActions.showToast(`已选择：${file.name}`, "success");
    try {
      const purpose = type === "image" ? "makeup_source_image" : "makeup_source_video";
      const asset = await uploadMedia({ file, purpose, retentionPolicy: "temporary_source" });
      setPicked((prev) => ({ ...prev, [type]: { file, mediaAssetId: asset.mediaAssetId } }));
      appActions.showToast("文件已上传，可以解析了", "success");
    } catch (err) {
      console.error(err);
      appActions.showToast("上传失败，请重试", "warn");
      setPicked((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
    }
  };

  const onAnalyze = async () => {
    if (!canAnalyze) {
      appActions.showToast("请先粘贴链接，或上传图片/视频", "warn");
      return;
    }
    if (source !== "link") {
      const ready = picked[source]?.mediaAssetId;
      if (!ready) {
        appActions.showToast("文件还在上传中，稍等一下", "warn");
        return;
      }
    }
    setStatus("loading");
    try {
      const res = await request<{ card: MakeupCard }>("/makeup-cards/analyze", {
        method: "POST",
        body: {
          sourceType: source,
          sourceUrl: source === "link" ? link.trim() : null,
          mediaAssetId: source === "link" ? null : picked[source]?.mediaAssetId,
        },
      });
      setCard(res.card);
      appActions.setCurrentCard(res.card);
      setStatus("ready");
      appActions.showToast("解析卡片已生成", "success");
    } catch (err) {
      console.error(err);
      setStatus("idle");
      appActions.showToast("解析失败，请重试", "warn");
    }
  };

  const onImport = () => {
    if (!card) return;
    appActions.setCurrentCard(card);
    appActions.setActiveTab("chat");
    appActions.showToast("已导入聊天", "success");
  };

  return (
    <div className="home-page">
      <header className="home-page__hero">
        <h1 className="home-page__title">粘贴美妆视频链接，生成复刻卡片</h1>
        <p className="home-page__subtitle">
          支持抖音视频链接，也可上传截图或短视频。
        </p>
      </header>

      <section className="home-page__panel">
        <div className="home-page__source-switcher" role="tablist" aria-label="内容来源">
          {SOURCE_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`home-page__source-tab${source === item.key ? " is-active" : ""}`}
              onClick={() => setSource(item.key)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {source === "link" && (
          <div className="home-page__source-panel">
            <input
              className="home-page__link"
              placeholder="粘贴抖音美妆视频链接"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="home-page__hint">第一版重点支持抖音链接，也可用截图和短视频演示。</p>
          </div>
        )}

        {source === "image" && (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFilePicked("image", e.target.files?.[0])}
            />
            <button
              type="button"
              className={`home-page__upload-zone${picked.image ? " has-file" : ""}`}
              onClick={() => openPicker("image")}
            >
              <span className="home-page__upload-icon">▧</span>
              <span className="home-page__upload-title">
                {picked.image?.file.name ?? "上传妆容截图 / 封面图"}
              </span>
              <span className="home-page__upload-sub">
                {picked.image
                  ? picked.image.mediaAssetId
                    ? `${(picked.image.file.size / 1024 / 1024).toFixed(1)} MB · 已上传`
                    : "上传中…"
                  : "适合博主妆容图、封面图、想复刻的妆容照片"}
              </span>
            </button>
          </>
        )}

        {source === "video" && (
          <>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => onFilePicked("video", e.target.files?.[0])}
            />
            <button
              type="button"
              className={`home-page__upload-zone${picked.video ? " has-file" : ""}`}
              onClick={() => openPicker("video")}
            >
              <span className="home-page__upload-icon">▶</span>
              <span className="home-page__upload-title">
                {picked.video?.file.name ?? "上传本地短视频片段"}
              </span>
              <span className="home-page__upload-sub">
                {picked.video
                  ? picked.video.mediaAssetId
                    ? `${(picked.video.file.size / 1024 / 1024).toFixed(1)} MB · 已上传`
                    : "上传中…"
                  : "系统会抽取关键帧，识别妆容步骤和翻车点"}
              </span>
            </button>
          </>
        )}

        <button
          type="button"
          className="home-page__cta"
          onClick={onAnalyze}
          disabled={status === "loading"}
        >
          {status === "loading" ? "正在生成解析卡片" : "开始解析妆容"}
        </button>
      </section>

      {status === "loading" && (
        <div className="home-page__loading" aria-live="polite">
          <div className="home-page__loading-step is-done">读取内容来源</div>
          <div className="home-page__loading-step is-active">提取画面关键帧</div>
          <div className="home-page__loading-step">识别妆容风格</div>
          <div className="home-page__loading-step">生成解析卡片</div>
        </div>
      )}

      <section className="home-page__recent" aria-label="最近生成">
        <div className="home-page__recent-head">
          <h3>最近生成</h3>
          <button
            type="button"
            className="home-page__recent-link"
            onClick={() => appActions.showToast("历史记录请到聊天页右上角查看", "info")}
          >
            查看全部
          </button>
        </div>
        <div className="home-page__recent-empty">
          <span className="home-page__recent-glyph" aria-hidden>✎</span>
          <p>还没有生成记录</p>
          <small>粘贴一个美妆视频，开始试试。</small>
        </div>
      </section>

      {status === "ready" && card && (
        <article className="home-page__card">
          <div className="home-page__card-top">
            <span className="home-page__card-kicker">妆容解析卡片</span>
            <h2>{card.title}</h2>
            <div className="home-page__tags">
              {card.styleTags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>

          <div className="home-page__metrics">
            <div>
              <strong>{card.difficulty}</strong>
              <span>复刻难度</span>
            </div>
            <div>
              <strong>{card.estimatedTime}</strong>
              <span>预计耗时</span>
            </div>
          </div>

          <div className="home-page__section">
            <span>产品类型</span>
            <p>{card.productTypes.join("、")}</p>
          </div>

          <div className="home-page__steps">
            {card.steps.map((step) => (
              <div key={step.stepNo} className="home-page__step">
                <b>{step.part}</b>
                <p>{step.instruction}</p>
              </div>
            ))}
          </div>

          <div className="home-page__risk">
            <span>翻车点</span>
            <p>{card.riskPoints.join(" / ")}</p>
          </div>

          <p className="home-page__ai-tip">{card.aiTip}</p>

          <div className="home-page__actions">
            <button
              type="button"
              className="home-page__btn home-page__btn--ghost"
              onClick={() => appActions.showToast("分享卡片已生成", "success")}
            >
              分享卡片
            </button>
            <button type="button" className="home-page__btn" onClick={onImport}>
              导入聊天
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
