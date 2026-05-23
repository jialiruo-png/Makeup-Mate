import { useState } from "react";
import { analyzeMakeup } from "@/api/makeupCards";
import { appActions } from "@/state/appStore";
import type { MakeupCard } from "@/types";
import "./HomePage.css";

type AnalyzeStatus = "idle" | "loading" | "ready" | "error";

export function HomePage() {
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [card, setCard] = useState<MakeupCard | undefined>();

  const onAnalyze = async () => {
    if (!link.trim()) {
      appActions.showToast("请先粘贴一个美妆内容链接，或上传图片/视频", "warn");
      return;
    }
    setStatus("loading");
    try {
      const res = await analyzeMakeup({ sourceType: "link", sourceUrl: link.trim() });
      setCard(res.card);
      appActions.setCurrentCard(res.card);
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("error");
      appActions.showToast("内容解析失败，请稍后重试", "error");
    }
  };

  const onImport = () => {
    if (!card) return;
    appActions.setActiveTab("chat");
    appActions.showToast("已导入聊天", "success");
  };

  return (
    <div className="home-page">
      <header className="home-page__hero">
        <span className="home-page__eyebrow">妆搭 Makeup Mate</span>
        <h1 className="home-page__title">
          把刷到的美妆视频
          <br />
          变成适合你的专属上妆教程
        </h1>
        <p className="home-page__subtitle">
          粘贴美妆视频链接，或上传图片 / 视频，生成你的专属复刻卡片。
        </p>
      </header>

      <section className="home-page__input">
        <input
          className="home-page__link"
          placeholder="粘贴抖音 / 小红书美妆链接"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <div className="home-page__uploads">
          <button type="button" className="home-page__upload-btn" disabled>
            上传图片
          </button>
          <button type="button" className="home-page__upload-btn" disabled>
            上传视频
          </button>
        </div>
        <button
          type="button"
          className="home-page__cta"
          onClick={onAnalyze}
          disabled={status === "loading"}
        >
          {status === "loading" ? "解析中…" : "开始解析妆容"}
        </button>
      </section>

      {status === "loading" && (
        <div className="home-page__loading">
          <div className="home-page__loading-step">读取链接内容…</div>
          <div className="home-page__loading-step">识别妆容步骤…</div>
          <div className="home-page__loading-step">生成专属卡片…</div>
        </div>
      )}

      {status === "ready" && card && (
        <article className="home-page__card">
          <div className="home-page__card-head">
            <h2>{card.title}</h2>
            <div className="home-page__tags">
              {card.styleTags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
          <div className="home-page__meta">
            <span>难度 · {card.difficulty}</span>
            <span>耗时 · {card.estimatedTime}</span>
          </div>
          <p className="home-page__ai-tip">{card.aiTip}</p>
          <div className="home-page__actions">
            <button type="button" className="home-page__btn home-page__btn--ghost">
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
