import { useMemo, useState } from "react";
import { appActions } from "@/state/appStore";
import type { MakeupCard, SourceType } from "@/types";
import "./HomePage.css";

type SourceTab = Extract<SourceType, "link" | "image" | "video">;
type AnalyzeStatus = "idle" | "loading" | "ready";

const SOURCE_TABS: Array<{ key: SourceTab; label: string; icon: string }> = [
  { key: "link", label: "粘贴链接", icon: "↗" },
  { key: "image", label: "上传图片", icon: "▧" },
  { key: "video", label: "上传视频", icon: "▶" },
];

const MOCK_CARD: MakeupCard = {
  cardId: "card_demo_cold_commute",
  sourceType: "link",
  sourcePlatform: "douyin",
  sourceUrl: "",
  sourceAssetId: null,
  title: "清冷感通勤妆",
  styleTags: ["低饱和", "干净", "淡颜友好"],
  difficulty: "中等",
  estimatedTime: "18分钟",
  scenes: ["通勤", "上课", "面试"],
  productTypes: ["气垫", "遮瑕", "浅棕眼影", "棕色眼线笔", "杏粉腮红", "奶茶豆沙唇泥"],
  steps: [
    {
      stepNo: 1,
      part: "底妆",
      instruction: "轻薄雾面底妆，重点均匀肤色，不追求强遮瑕。",
      tips: ["少量多次", "避开厚重粉感"],
    },
    {
      stepNo: 2,
      part: "眼妆",
      instruction: "浅棕色眼影铺后半段，棕色眼线只画眼尾三分之一。",
      tips: ["眼线短一点", "卧蚕提亮要轻"],
    },
    {
      stepNo: 3,
      part: "腮红与唇",
      instruction: "杏粉腮红扫在眼下外侧，唇色选奶茶豆沙柔雾质地。",
      tips: ["腮红弱存在感", "唇色别太深"],
    },
  ],
  riskPoints: ["眼线过长", "修容过重", "唇色过深"],
  aiTip: "这个妆容适合日常和通勤，新手建议弱化眼线、减少修容，让整体保持干净。",
  confidence: 0.82,
  evidenceSummary: { hasVideoEvidence: true, supportLevel: "mock" },
  createdAt: new Date().toISOString(),
};

export function HomePage() {
  const [source, setSource] = useState<SourceTab>("link");
  const [link, setLink] = useState("");
  const [picked, setPicked] = useState<Record<"image" | "video", boolean>>({
    image: false,
    video: false,
  });
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [card, setCard] = useState<MakeupCard | undefined>();

  const canAnalyze = useMemo(() => {
    if (source === "link") return link.trim().length > 0;
    return picked[source];
  }, [link, picked, source]);

  const pickFile = (type: "image" | "video") => {
    setPicked((prev) => ({ ...prev, [type]: true }));
    appActions.showToast(type === "image" ? "已选择妆容截图" : "已选择短视频片段", "success");
  };

  const onAnalyze = () => {
    if (!canAnalyze) {
      appActions.showToast("请先粘贴链接，或上传图片/视频", "warn");
      return;
    }
    setStatus("loading");
    window.setTimeout(() => {
      const nextCard = {
        ...MOCK_CARD,
        cardId: `card_${source}_${Date.now()}`,
        sourceType: source,
        sourceUrl: source === "link" ? link.trim() : null,
        sourcePlatform: source === "link" ? "douyin" : undefined,
        sourceAssetId: source === "link" ? null : `asset_${source}_demo`,
        createdAt: new Date().toISOString(),
      };
      setCard(nextCard);
      appActions.setCurrentCard(nextCard);
      setStatus("ready");
      appActions.showToast("解析卡片已生成", "success");
    }, 950);
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
        <span className="home-page__eyebrow">妆搭 Makeup Mate</span>
        <h1 className="home-page__title">
          粘贴美妆视频链接
          <br />
          生成你的专属复刻卡片
        </h1>
        <p className="home-page__subtitle">
          或上传妆容截图、本地短视频片段。首页只做解析入口，灵感探索放在聊天页。
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
              placeholder="粘贴抖音 / 小红书 / B站美妆链接"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="home-page__hint">第一版重点支持抖音链接，也可用截图和短视频演示。</p>
          </div>
        )}

        {source === "image" && (
          <button
            type="button"
            className={`home-page__upload-zone${picked.image ? " has-file" : ""}`}
            onClick={() => pickFile("image")}
          >
            <span className="home-page__upload-icon">▧</span>
            <span className="home-page__upload-title">
              {picked.image ? "makeup-look-2026.jpg" : "上传妆容截图 / 封面图"}
            </span>
            <span className="home-page__upload-sub">
              {picked.image ? "1.2 MB · 可解析" : "适合博主妆容图、封面图、想复刻的妆容照片"}
            </span>
          </button>
        )}

        {source === "video" && (
          <button
            type="button"
            className={`home-page__upload-zone${picked.video ? " has-file" : ""}`}
            onClick={() => pickFile("video")}
          >
            <span className="home-page__upload-icon">▶</span>
            <span className="home-page__upload-title">
              {picked.video ? "tutorial-clip.mp4" : "上传本地短视频片段"}
            </span>
            <span className="home-page__upload-sub">
              {picked.video ? "8.4 MB · 32s · 待抽帧" : "系统会抽取关键帧，识别妆容步骤和翻车点"}
            </span>
          </button>
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
