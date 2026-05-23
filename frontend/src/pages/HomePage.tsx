import { useState } from "react";
import { appActions } from "@/state/appStore";
import type { MakeupCard } from "@/types";
import { request } from "@/api/client";
import "./HomePage.css";

type AnalyzeStatus = "idle" | "loading" | "ready";

export function HomePage() {
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [card, setCard] = useState<MakeupCard | undefined>();

  const onAnalyze = async () => {
    if (!link.trim()) {
      appActions.showToast("请先粘贴一个抖音美妆视频链接", "warn");
      return;
    }
    setStatus("loading");
    try {
      const res = await request<{ card: MakeupCard }>("/makeup-cards/analyze", {
        method: "POST",
        body: {
          sourceType: "link",
          sourceUrl: link.trim(),
          mediaAssetId: null,
        },
      });
      setCard(res.card);
      appActions.setCurrentCard(res.card);
      setStatus("ready");
      appActions.showToast("复刻卡片已生成", "success");
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
        <h1 className="home-page__title">
          粘贴抖音美妆视频
          <br />
          生成复刻卡片
        </h1>
        <p className="home-page__subtitle">
          复制抖音美妆视频链接，AI 将解析妆容重点，生成适合你的复刻步骤。
        </p>
      </header>

      <section className="home-page__panel">
        <div className="home-page__input-label">
          <span>抖音链接解析</span>
          <b>V1</b>
        </div>

        <input
          className="home-page__link"
          placeholder="粘贴抖音美妆视频链接"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <p className="home-page__hint">目前仅支持抖音美妆视频链接。</p>

        <button
          type="button"
          className="home-page__cta"
          onClick={onAnalyze}
          disabled={status === "loading"}
        >
          {status === "loading" ? "正在生成复刻卡片" : "开始生成复刻卡片"}
        </button>
      </section>

      {status === "loading" && (
        <div className="home-page__loading" aria-live="polite">
          <div className="home-page__loading-step is-done">读取抖音链接</div>
          <div className="home-page__loading-step is-active">提取视频关键帧</div>
          <div className="home-page__loading-step">识别妆容风格</div>
          <div className="home-page__loading-step">生成复刻卡片</div>
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
          <small>粘贴一个抖音美妆视频，生成你的第一张复刻卡片。</small>
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
