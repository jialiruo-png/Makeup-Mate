import { useState } from "react";
import "./ChatPage.css";

type TopTab = "inspiration" | "chat";

export function ChatPage() {
  const [tab, setTab] = useState<TopTab>("inspiration");

  return (
    <div className="chat-page">
      <header className="chat-page__top">
        <button type="button" className="chat-page__top-btn">←</button>
        <div className="chat-page__title">妆搭 MM</div>
        <div className="chat-page__top-actions">
          <button type="button" className="chat-page__top-btn" title="历史记录">⏱</button>
          <button type="button" className="chat-page__top-btn" title="上传照片">📷</button>
        </div>
      </header>

      <div className="chat-page__tabs">
        <button
          type="button"
          className={`chat-page__tab${tab === "inspiration" ? " is-active" : ""}`}
          onClick={() => setTab("inspiration")}
        >
          灵感库
        </button>
        <button
          type="button"
          className={`chat-page__tab${tab === "chat" ? " is-active" : ""}`}
          onClick={() => setTab("chat")}
        >
          陪伴聊天
        </button>
      </div>

      <div className="chat-page__body">
        {tab === "inspiration" ? <InspirationGallery /> : <ChatStream />}
      </div>

      {tab === "chat" && (
        <footer className="chat-page__input-bar">
          <button type="button" className="chat-page__icon-btn">＋</button>
          <input className="chat-page__input" placeholder="问我下一步怎么画…" />
          <button type="button" className="chat-page__icon-btn">🎙</button>
          <button type="button" className="chat-page__send">发送</button>
        </footer>
      )}
    </div>
  );
}

function InspirationGallery() {
  const categories = ["美妆博主库", "风格复刻", "场景妆容", "新手陪练"];
  return (
    <div className="inspiration">
      <div className="inspiration__chips">
        {categories.map((c) => (
          <span key={c} className="inspiration__chip">{c}</span>
        ))}
      </div>
      <div className="inspiration__placeholder">
        灵感卡片占位区，搭档接手后在 InspirationCard 组件里搭建样式。
      </div>
    </div>
  );
}

function ChatStream() {
  return (
    <div className="chat-stream">
      <div className="chat-stream__placeholder">
        聊天气泡占位区，搭档接手后在 ChatBubble / StepCard 组件里搭建样式。
      </div>
    </div>
  );
}
