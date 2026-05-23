import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import creatorProfiles from "@/data/creator_profiles_merged.json";
import librarySchema from "@/data/makeup_mate_creator_library_schema.json";
import { appActions, useAppState } from "@/state/appStore";
import type { InspirationType, MakeupCard } from "@/types";
import { createSession, sendMessage as apiSendMessage } from "@/api/chat";
import { uploadMedia } from "@/api/media";
import { apiBase } from "@/api/client";
import "./ChatPage.css";

type TopTab = "library" | "conversation";
type LibraryEntry = "creator" | "style" | "scene" | "beginner";
type ModalType = "history" | "upload" | null;

interface CreatorProfile {
  creatorId: string;
  creatorName: string;
  displayName: string;
  avatarLocalPath?: string;
  styleTags: string[];
  representativeLooks: string[];
  fitUsers: string[];
  difficulty: string;
  creatorType: string;
  primaryCategoryId: string;
  secondaryCategoryIds: string[];
  styleSummary: string;
  makeupMateUseCase: string;
  representativeVideoLinks?: string[];
}

interface InspirationCard {
  id: string;
  type: InspirationType;
  name: string;
  avatarUrl?: string | null;
  avatarLabel: string;
  tags: string[];
  look: string;
  suitable: string;
  difficulty: string;
  analysis: string;
  categories: string[];
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  imageUrl?: string;
}

const profiles = creatorProfiles as CreatorProfile[];

const ENTRY_META: Record<LibraryEntry, { label: string; desc: string }> = {
  creator: { label: "美妆博主库", desc: "从达人风格开始生成你的复刻方案" },
  style: { label: "风格复刻", desc: "按妆容风格快速找到方向" },
  scene: { label: "场景妆容", desc: "通勤、约会、面试、拍照都能拆" },
  beginner: { label: "新手陪练", desc: "低难度、短步骤、低翻车" },
};

const FILTERS: Record<LibraryEntry, string[]> = {
  creator: ["全部", "教程型", "风格型", "仿妆型", "改造型", "测评型", "新手"],
  style: ["全部", "清冷", "韩系", "甜妹", "港风", "泰妆", "欧美", "证件照"],
  scene: ["全部", "通勤", "上课", "约会", "面试", "拍照", "聚会", "证件照"],
  beginner: ["全部", "新手", "眼线", "腮红", "底妆", "内双", "10分钟"],
};

const BEGINNER_CARDS: InspirationCard[] = [
  {
    id: "beginner_eyeliner",
    type: "beginner_training",
    name: "第一次画眼线",
    avatarLabel: "眼线\n陪练",
    tags: ["新手", "短眼线"],
    look: "后半段短眼线",
    suitable: "手残党 · 内双 · 初学者",
    difficulty: "新手",
    analysis: "只练眼尾三分之一，避免完整上挑线条。",
    categories: ["新手", "眼线", "内双"],
  },
  {
    id: "beginner_blush",
    type: "beginner_training",
    name: "第一次画腮红",
    avatarLabel: "腮红\n陪练",
    tags: ["新手", "上移"],
    look: "眼下外侧腮红",
    suitable: "圆脸 · 方圆脸 · 气色弱",
    difficulty: "新手",
    analysis: "先找位置再少量叠加，避免腮红压低显脸重。",
    categories: ["新手", "腮红"],
  },
  {
    id: "beginner_10min",
    type: "beginner_training",
    name: "10 分钟新手妆",
    avatarLabel: "10分\n新手",
    tags: ["极简", "无翻车"],
    look: "保姆级 5 步妆",
    suitable: "第一次化妆 · 赶时间",
    difficulty: "新手",
    analysis: "保留底妆、眉毛、腮红、口红，跳过复杂修容。",
    categories: ["新手", "10分钟", "底妆"],
  },
];

function toCreatorCard(profile: CreatorProfile): InspirationCard {
  return {
    id: profile.creatorId,
    type: "creator",
    name: profile.displayName || profile.creatorName,
    avatarUrl: profile.avatarLocalPath || null,
    avatarLabel: profile.creatorName.slice(0, 4),
    tags: profile.styleTags.slice(0, 3),
    look: profile.representativeLooks[0] || profile.makeupMateUseCase,
    suitable: profile.fitUsers.slice(0, 3).join(" · "),
    difficulty: profile.difficulty,
    analysis: profile.styleSummary,
    categories: [
      profile.creatorType,
      profile.difficulty,
      ...profile.styleTags,
      ...profile.representativeLooks,
      profile.primaryCategoryId,
      ...profile.secondaryCategoryIds,
    ],
  };
}

function styleCards(): InspirationCard[] {
  return librarySchema.styleCategories.map((category) => ({
    id: category.categoryId,
    type: "style",
    name: category.categoryName,
    avatarLabel: category.categoryName.slice(0, 4),
    tags: category.styleTags.slice(0, 3),
    look: category.representativeLooks[0],
    suitable: category.fitUsers.slice(0, 3).join(" · "),
    difficulty: category.difficulty,
    analysis: category.description,
    categories: [
      category.categoryName,
      category.difficulty,
      ...category.aliases,
      ...category.styleTags,
      ...category.representativeLooks,
    ],
  }));
}

function sceneCards(): InspirationCard[] {
  const scenes = [
    ["通勤", "5 步极简通勤妆", "上班族 · 赶时间", "新手", ["通勤", "极简"]],
    ["上课", "清透学生妆", "学生党 · 淡颜", "新手", ["上课", "韩系"]],
    ["约会", "桃花约会妆", "甜系 · 圆脸", "简单", ["约会", "甜妹"]],
    ["面试", "稳重面试妆", "职场新人", "简单", ["面试", "干净"]],
    ["拍照", "上镜拍照妆", "活动 · 旅拍", "中等", ["拍照", "上镜"]],
    ["证件照", "证件照专属妆", "考试 · 证件", "简单", ["证件照", "干净"]],
  ] as const;
  return scenes.map(([name, look, suitable, difficulty, tags]) => ({
    id: `scene_${name}`,
    type: "scene",
    name,
    avatarLabel: name,
    tags: [...tags],
    look,
    suitable,
    difficulty,
    analysis: `${name}场景优先控制干净度、用时和翻车风险，适合生成可执行步骤。`,
    categories: [name, difficulty, ...tags],
  }));
}

function cardsForEntry(entry: LibraryEntry): InspirationCard[] {
  if (entry === "creator") return profiles.map(toCreatorCard);
  if (entry === "style") return styleCards();
  if (entry === "scene") return sceneCards();
  return BEGINNER_CARDS;
}

export function ChatPage() {
  const currentCard = useAppState((s) => s.currentCard);
  const [tab, setTab] = useState<TopTab>("library");
  const [entry, setEntry] = useState<LibraryEntry>("creator");
  const [filter, setFilter] = useState("全部");
  const [modal, setModal] = useState<ModalType>(null);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
    mediaAssetId?: string;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      role: "assistant",
      text: "今天想复刻哪种妆？可以从美妆灵感库选，也可以导入首页的解析卡片。",
    },
  ]);

  // 第一次进入「陪伴聊天」时创建后端 session
  useEffect(() => {
    if (tab !== "conversation" || sessionId) return;
    let cancelled = false;
    createSession({
      cardId: currentCard?.cardId ?? null,
      mode: "text_companion",
    })
      .then((session) => {
        if (cancelled) return;
        setSessionId(session.sessionId);
        if (session.messages?.length) {
          setMessages(
            session.messages.map((m) => ({
              id: m.messageId,
              role: m.role === "user" ? "user" : "assistant",
              text: m.content,
            })),
          );
        }
      })
      .catch((err) => {
        console.error(err);
        appActions.showToast("聊天会话创建失败，稍后再试", "warn");
      });
    return () => {
      cancelled = true;
    };
  }, [tab, currentCard?.cardId, sessionId]);

  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
    uploadMedia({
      file,
      purpose: "selfie",
      retentionPolicy: "session_only",
    })
      .then((asset) => {
        setPendingImage((prev) =>
          prev && prev.file === file
            ? { ...prev, mediaAssetId: asset.mediaAssetId }
            : prev,
        );
      })
      .catch((err) => {
        console.error(err);
        appActions.showToast("图片上传失败", "warn");
        setPendingImage(null);
      });
  };

  const clearPendingImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const cards = useMemo(() => {
    const items = cardsForEntry(entry);
    if (filter === "全部") return items;
    return items.filter((item) => item.categories.some((c) => c.includes(filter)));
  }, [entry, filter]);

  const switchEntry = (next: LibraryEntry) => {
    setEntry(next);
    setFilter("全部");
  };

  const importCardToChat = (item: InspirationCard) => {
    setTab("conversation");
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: `已导入「${item.name}」。我会按「${item.look}」给你拆成适合你的复刻步骤。`,
      },
    ]);
    appActions.showToast("已导入聊天", "success");
  };

  const generateMyVersion = (item: InspirationCard) => {
    const card: MakeupCard = {
      cardId: `card_from_${item.id}`,
      sourceType: "inspiration",
      title: `我的${item.look}`,
      styleTags: [...item.tags, "个人改写"],
      difficulty: item.difficulty,
      estimatedTime: item.difficulty === "新手" ? "10分钟" : "18分钟",
      scenes: item.type === "scene" ? [item.name] : ["通勤", "日常"],
      productTypes: ["气垫", "遮瑕", "眼影", "眼线笔", "腮红", "口红"],
      steps: [
        { stepNo: 1, part: "底妆", instruction: "先完成轻薄底妆，保持妆面干净。", tips: [] },
        { stepNo: 2, part: "眉眼", instruction: "保留原风格重点，但把线条改短、改轻。", tips: [] },
        { stepNo: 3, part: "腮红与唇", instruction: "用低饱和颜色统一气色，避免过重。", tips: [] },
      ],
      riskPoints: ["眼线过长", "腮红过低", "唇色过深"],
      aiTip: `已根据「${item.name}」生成你的版本，可以继续上传自拍做更细调整。`,
      confidence: 0.78,
      evidenceSummary: { hasVideoEvidence: false, supportLevel: "mock" },
      createdAt: new Date().toISOString(),
    };
    appActions.setCurrentCard(card);
    importCardToChat(item);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text && !pendingImage) return;
    if (!sessionId) {
      appActions.showToast("聊天还在准备，稍等一下", "warn");
      return;
    }
    if (pendingImage && !pendingImage.mediaAssetId) {
      appActions.showToast("图片还在上传，稍等一下", "warn");
      return;
    }

    setSending(true);
    const localUserId = `user_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: localUserId,
        role: "user",
        text,
        imageUrl: pendingImage?.previewUrl,
      },
    ]);
    setMessage("");
    const sentImage = pendingImage;
    setPendingImage(null);

    try {
      const res = await apiSendMessage(sessionId, {
        content: text,
        messageType: sentImage ? "image" : "text",
        // @ts-expect-error: 后端新加的字段，types 里我等会补
        mediaAssetId: sentImage?.mediaAssetId ?? null,
      });
      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === localUserId
              ? {
                  id: res.userMessage.messageId,
                  role: "user" as const,
                  text: res.userMessage.content,
                  imageUrl: sentImage
                    ? `${apiBase}/media/${sentImage.mediaAssetId}/raw`
                    : undefined,
                }
              : m,
          )
          .concat({
            id: res.assistantMessage.messageId,
            role: "assistant",
            text: res.assistantMessage.content,
          }),
      );
      if (sentImage?.previewUrl) URL.revokeObjectURL(sentImage.previewUrl);
    } catch (err) {
      console.error(err);
      appActions.showToast("发送失败，请重试", "warn");
      setMessages((prev) => prev.filter((m) => m.id !== localUserId));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-page__top">
        <button
          type="button"
          className="chat-page__top-btn"
          onClick={() => appActions.setActiveTab("home")}
          aria-label="返回首页"
        >
          ‹
        </button>
        <div className="chat-page__title">
          <span>妆搭 MM</span>
          <small><i /> AI 美妆陪练在线</small>
        </div>
        <div className="chat-page__top-actions">
          <button type="button" className="chat-page__top-btn" onClick={() => setModal("history")}>
            ⏱
          </button>
          <button type="button" className="chat-page__top-btn" onClick={() => setModal("upload")}>
            ◉
          </button>
        </div>
      </header>

      <div className="chat-page__tabs">
        <button
          type="button"
          className={`chat-page__tab${tab === "conversation" ? " is-active" : ""}`}
          onClick={() => setTab("conversation")}
        >
          陪伴聊天
        </button>
        <button
          type="button"
          className={`chat-page__tab${tab === "library" ? " is-active" : ""}`}
          onClick={() => setTab("library")}
        >
          美妆灵感库 <b>41</b>
        </button>
      </div>

      {tab === "library" ? (
        <div className="chat-page__body">
          <section className="library-banner">
            <h2>从达人、风格或场景开始复刻</h2>
            <p>每张卡片都可以生成你的版本，再导入聊天陪你一步步画。</p>
          </section>

          <div className="library-entry-grid">
            {(Object.keys(ENTRY_META) as LibraryEntry[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`library-entry${entry === key ? " is-active" : ""}`}
                onClick={() => switchEntry(key)}
              >
                <span>{entryIcon(key)}</span>
                <b>{ENTRY_META[key].label}</b>
              </button>
            ))}
          </div>

          <div className="library-filter-row">
            {FILTERS[entry].map((item) => (
              <button
                key={item}
                type="button"
                className={`library-filter${filter === item ? " is-active" : ""}`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="library-section-title">
            <span>{ENTRY_META[entry].desc}</span>
            <span>{cards.length} 个</span>
          </div>

          <div className="inspiration-list">
            {cards.map((item) => (
              <InspirationCardView
                key={item.id}
                item={item}
                onGenerate={() => generateMyVersion(item)}
                onImport={() => importCardToChat(item)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="chat-page__body chat-page__body--conversation">
            {currentCard && <CardSummary card={currentCard} />}
            <div className="chat-stream">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
                  {m.imageUrl && (
                    <img
                      src={m.imageUrl}
                      alt=""
                      style={{
                        maxWidth: "180px",
                        borderRadius: "12px",
                        display: "block",
                        marginBottom: m.text ? "8px" : 0,
                      }}
                    />
                  )}
                  {m.text}
                </div>
              ))}
              <div className="step-card">
                <span>当前建议</span>
                <b>Step 1 · 底妆</b>
                <p>先完成轻薄底妆，重点是均匀肤色，不要急着叠遮瑕。</p>
                <div>
                  {["我完成了", "换种说法", "没有这个产品怎么办", "拍照检查"].map((q) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => {
                        setMessage(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {pendingImage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: "rgba(0,0,0,0.04)",
                borderTop: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <img
                src={pendingImage.previewUrl}
                alt=""
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
              />
              <span style={{ fontSize: 13, flex: 1 }}>
                {pendingImage.mediaAssetId ? "图片已就绪，跟一句话一起发" : "图片上传中…"}
              </span>
              <button
                type="button"
                onClick={clearPendingImage}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          )}
          <form className="chat-page__input-bar" onSubmit={sendMessage}>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                onPickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="chat-page__icon-btn"
              onClick={() => imageInputRef.current?.click()}
              aria-label="上传图片"
            >
              ＋
            </button>
            <input
              className="chat-page__input"
              placeholder={pendingImage ? "说一句想问的（可选）..." : "问我下一步怎么画…"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="button" className="chat-page__icon-btn" aria-label="语音输入">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="21" />
                <line x1="9" y1="21" x2="15" y2="21" />
              </svg>
            </button>
            <button
              type="submit"
              className="chat-page__send"
              disabled={sending || (!message.trim() && !pendingImage)}
            >
              {sending ? "..." : "发送"}
            </button>
          </form>
        </>
      )}

      {modal && <ChatModal type={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

function InspirationCardView({
  item,
  onGenerate,
  onImport,
}: {
  item: InspirationCard;
  onGenerate: () => void;
  onImport: () => void;
}) {
  return (
    <article className="insp-card">
      <CreatorAvatar item={item} />
      <div className="insp-card__body">
        <div className="insp-card__top">
          <h3>{item.name}</h3>
          <span>{item.difficulty}</span>
        </div>
        <p className="insp-card__look">{item.look}</p>
        <div className="insp-card__tags">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="insp-card__analysis">{item.analysis}</p>
        <div className="insp-card__meta">适合 {item.suitable}</div>
        <div className="insp-card__actions">
          <button type="button" onClick={onGenerate}>生成我的版本</button>
          <button type="button" onClick={onImport}>导入聊天</button>
        </div>
      </div>
    </article>
  );
}

function CreatorAvatar({ item }: { item: InspirationCard }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="insp-card__avatar">
      {item.avatarUrl && !failed ? (
        <img src={item.avatarUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{item.avatarLabel}</span>
      )}
    </div>
  );
}

function CardSummary({ card }: { card: MakeupCard }) {
  return (
    <article className="card-summary">
      <span>已导入解析卡片</span>
      <h3>{card.title}</h3>
      <p>{card.styleTags.join(" / ")} · {card.difficulty} · {card.estimatedTime}</p>
    </article>
  );
}

function ChatModal({ type, onClose }: { type: Exclude<ModalType, null>; onClose: () => void }) {
  return (
    <div className="chat-modal-backdrop" onClick={onClose}>
      <section className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="chat-modal__close" onClick={onClose}>×</button>
        {type === "history" ? <HistoryContent /> : <UploadContent />}
      </section>
    </div>
  );
}

function HistoryContent() {
  const rows = ["清冷感通勤妆", "韩系裸妆", "港风复古妆"];
  return (
    <>
      <h2>历史记录</h2>
      <div className="modal-list">
        {rows.map((row, index) => (
          <button type="button" key={row}>
            <span>{row}</span>
            <small>{index === 0 ? "今天 · 已导入聊天" : "上周 · 已解析"}</small>
          </button>
        ))}
      </div>
    </>
  );
}

function UploadContent() {
  return (
    <>
      <h2>上传照片分析个人风格</h2>
      <div className="upload-card">
        <b>自拍 / 自拍视频</b>
        <p>用于分析脸型、肤色、眼型和适合你的腮红、眼线、唇色。</p>
      </div>
      <div className="upload-options">
        {["拍一张", "从相册选", "上传自拍视频", "用上次档案"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => appActions.showToast("已生成个人风格分析", "success")}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="privacy-text">默认不保存原始照片，只在授权后保存结构化妆容档案。</p>
    </>
  );
}

function entryIcon(entry: LibraryEntry) {
  if (entry === "creator") return "◐";
  if (entry === "style") return "✧";
  if (entry === "scene") return "▣";
  return "✓";
}

