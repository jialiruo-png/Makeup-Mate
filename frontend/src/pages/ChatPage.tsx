import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import creatorProfiles from "@/data/creator_profiles_merged.json";
import librarySchema from "@/data/makeup_mate_creator_library_schema.json";
import { appActions, useAppState } from "@/state/appStore";
import type { AnalyzePhotoResponse, InspirationType, MakeupCard } from "@/types";
import { createSession, sendMessage as apiSendMessage } from "@/api/chat";
import { uploadMedia } from "@/api/media";
import { generateMyVersion as apiGenerateMyVersion } from "@/api/inspirations";
import { analyzePhoto } from "@/api/profile";
import { apiBase, ApiError } from "@/api/client";
import { listHistory, deleteHistory } from "@/api/history";
import type { HistoryItem } from "@/types";
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

const RECOMMENDED_QUESTIONS = [
  "怎么画一个清冷感通勤妆？",
  "适合内双单眼皮的眼妆怎么画？",
  "10 分钟新手能画的妆有哪些？",
  "圆脸怎么修容显小？",
];

const ENTRY_META: Record<LibraryEntry, { label: string; desc: string; searchPlaceholder: string }> = {
  creator: {
    label: "博主灵感",
    desc: "从达人风格开始生成你的复刻方案",
    searchPlaceholder: "搜索博主",
  },
  style: {
    label: "风格复刻",
    desc: "按妆容风格快速找到方向",
    searchPlaceholder: "搜索风格",
  },
  scene: {
    label: "场景妆容",
    desc: "通勤、约会、面试、拍照都能拆",
    searchPlaceholder: "搜索场景",
  },
  beginner: {
    label: "新手陪练",
    desc: "低难度、短步骤、低翻车",
    searchPlaceholder: "搜索陪练内容",
  },
};

const FILTERS: Record<LibraryEntry, string[]> = {
  creator: ["全部", "教程型", "风格型", "仿妆型", "改造型", "测评型", "新手"],
  style: ["全部", "清冷", "韩系", "甜妹", "港风", "泰妆", "欧美", "证件照"],
  scene: ["全部", "通勤", "上课", "约会", "面试", "拍照", "聚会", "证件照"],
  beginner: ["全部", "新手", "眼线", "腮红", "底妆", "内双", "10分钟"],
};

const STYLE_COVER_PATHS: Record<string, string> = {
  beginner_makeup: "/assets/inspiration-covers/style/beginner_makeup.png",
  japanese_korean_makeup: "/assets/inspiration-covers/style/japanese_korean_makeup.png",
  western_makeup: "/assets/inspiration-covers/style/western_makeup.png",
  asian_makeup: "/assets/inspiration-covers/style/asian_makeup.png",
  daily_makeup: "/assets/inspiration-covers/style/daily_makeup.png",
  pure_desire_makeup: "/assets/inspiration-covers/style/pure_desire_makeup.png",
  hongkong_retro_makeup: "/assets/inspiration-covers/style/hongkong_retro_makeup.png",
  cos_makeup: "/assets/inspiration-covers/style/cos_makeup.png",
};

const BEGINNER_CARDS: InspirationCard[] = [
  {
    id: "beginner_eyeliner",
    type: "beginner_training",
    name: "第一次画眼线",
    avatarUrl: "/assets/inspiration-covers/beginner/beginner_eyeliner.png",
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
    avatarUrl: "/assets/inspiration-covers/beginner/beginner_blush.png",
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
    avatarUrl: "/assets/inspiration-covers/beginner/beginner_10min.png",
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
    avatarUrl: STYLE_COVER_PATHS[category.categoryId] || null,
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
    ["通勤", "5 步极简通勤妆", "上班族 · 赶时间", "新手", ["通勤", "极简"], "/assets/inspiration-covers/scene/scene_commute.png"],
    ["上课", "清透学生妆", "学生党 · 淡颜", "新手", ["上课", "韩系"], "/assets/inspiration-covers/scene/scene_school.png"],
    ["约会", "桃花约会妆", "甜系 · 圆脸", "简单", ["约会", "甜妹"], "/assets/inspiration-covers/scene/scene_date.png"],
    ["面试", "稳重面试妆", "职场新人", "简单", ["面试", "干净"], "/assets/inspiration-covers/scene/scene_interview.png"],
    ["拍照", "上镜拍照妆", "活动 · 旅拍", "中等", ["拍照", "上镜"], "/assets/inspiration-covers/scene/scene_photo.png"],
    ["证件照", "证件照专属妆", "考试 · 证件", "简单", ["证件照", "干净"], "/assets/inspiration-covers/scene/scene_id_photo.png"],
  ] as const;
  return scenes.map(([name, look, suitable, difficulty, tags, avatarUrl]) => ({
    id: `scene_${name}`,
    type: "scene",
    name,
    avatarUrl,
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
  const [tab, setTab] = useState<TopTab>("conversation");
  const [entry, setEntry] = useState<LibraryEntry>("creator");
  const [filter, setFilter] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [actionPanel, setActionPanel] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
    mediaAssetId?: string;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      role: "assistant",
      text: "我在这里。你可以告诉我想画什么风格，或者从首页粘贴解析后的卡片给我。",
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
    let items = cardsForEntry(entry);
    if (filter !== "全部") {
      items = items.filter((item) => item.categories.some((c) => c.includes(filter)));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.look.toLowerCase().includes(q) ||
          item.analysis.toLowerCase().includes(q),
      );
    }
    return items;
  }, [entry, filter, searchQuery]);

  const switchEntry = (next: LibraryEntry) => {
    setEntry(next);
    setFilter("全部");
    setSearchQuery("");
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

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const generateMyVersion = async (item: InspirationCard) => {
    if (generatingId) return;
    setGeneratingId(item.id);
    try {
      const res = await apiGenerateMyVersion(item.id, {
        sessionId,
        useProfile: true,
        useShortTermContext: true,
      });
      appActions.setCurrentCard(res.card);
      setTab("conversation");
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: "assistant",
          text: `已根据「${item.name}」生成你的版本。${res.card.aiTip}`,
        },
      ]);
      appActions.showToast("已生成你的版本", "success");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof ApiError ? `生成失败（${err.status}）` : "生成失败，请重试";
      appActions.showToast(msg, "error");
    } finally {
      setGeneratingId(null);
    }
  };

  const doSend = async (
    text: string,
    image: typeof pendingImage,
  ) => {
    if (!text && !image) return;
    if (!sessionId) {
      appActions.showToast("聊天还在准备，稍等一下", "warn");
      return;
    }
    if (image && !image.mediaAssetId) {
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
        imageUrl: image?.previewUrl,
      },
    ]);
    setMessage("");
    setPendingImage(null);

    try {
      const res = await apiSendMessage(sessionId, {
        content: text,
        messageType: image ? "image" : "text",
        // @ts-expect-error: 后端新加的字段，types 里我等会补
        mediaAssetId: image?.mediaAssetId ?? null,
      });
      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === localUserId
              ? {
                  id: res.userMessage.messageId,
                  role: "user" as const,
                  text: res.userMessage.content,
                  imageUrl: image
                    ? `${apiBase}/media/${image.mediaAssetId}/raw`
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
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    } catch (err) {
      console.error(err);
      appActions.showToast("发送失败，请重试", "warn");
      setMessages((prev) => prev.filter((m) => m.id !== localUserId));
    } finally {
      setSending(false);
    }
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    doSend(message.trim(), pendingImage);
  };

  const askQuestion = (q: string) => {
    if (sending) return;
    doSend(q, null);
  };

  const onActionPick = (kind: "camera" | "image" | "voice" | "video") => {
    setActionPanel(false);
    if (kind === "camera") {
      cameraInputRef.current?.click();
    } else if (kind === "image") {
      imageInputRef.current?.click();
    } else if (kind === "voice") {
      appActions.showToast("语音通话开发中，敬请期待", "info");
    } else if (kind === "video") {
      appActions.showToast("视频通话开发中，敬请期待", "info");
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-page__top">
        <button
          type="button"
          className="chat-page__top-btn chat-page__top-btn--menu"
          onClick={() => setDrawerOpen(true)}
          aria-label="历史记录"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="14" y2="15" />
          </svg>
        </button>
        <div className="chat-page__title">
          <span>妆搭</span>
          <small>看懂妆容，更懂你</small>
        </div>
        <div className="chat-page__top-actions">
          <button
            type="button"
            className={`chat-page__lib-btn${tab === "library" ? " is-active" : ""}`}
            onClick={() => setTab(tab === "library" ? "conversation" : "library")}
            aria-pressed={tab === "library"}
          >
            灵感库
          </button>
          <button
            type="button"
            className="chat-page__top-btn"
            onClick={() => setModal("upload")}
            aria-label="上传照片"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </button>
        </div>
      </header>

      {tab === "library" ? (
        <div className="chat-page__body">
          <div className="library-search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ENTRY_META[entry].searchPlaceholder}
              aria-label="搜索"
            />
            {searchQuery && (
              <button
                type="button"
                className="library-search__clear"
                onClick={() => setSearchQuery("")}
                aria-label="清空搜索"
              >
                ×
              </button>
            )}
          </div>

          <nav className="library-tabs" role="tablist">
            {(Object.keys(ENTRY_META) as LibraryEntry[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={entry === key}
                className={`library-tab${entry === key ? " is-active" : ""}`}
                onClick={() => switchEntry(key)}
              >
                {ENTRY_META[key].label}
              </button>
            ))}
          </nav>

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
          </div>

          <div className="inspiration-list">
            {cards.map((item) => (
              <InspirationCardView
                key={item.id}
                item={item}
                generating={generatingId === item.id}
                disabled={!!generatingId && generatingId !== item.id}
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
              {currentCard ? (
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
              ) : (
                <section className="chat-page__suggestions">
                  <div className="chat-page__suggestions-head">
                    <i />
                    <h3>推荐问题</h3>
                  </div>
                  {RECOMMENDED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="chat-page__suggestion"
                      onClick={() => askQuestion(q)}
                    >
                      <span className="chat-page__suggestion-tag">#</span>
                      <span className="chat-page__suggestion-text">{q}</span>
                      <svg
                        className="chat-page__suggestion-arrow"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  ))}
                </section>
              )}
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
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                onPickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className={`chat-page__icon-btn chat-page__icon-btn--plus${actionPanel ? " is-open" : ""}`}
              onClick={() => setActionPanel((v) => !v)}
              aria-label="更多操作"
              aria-expanded={actionPanel}
            >
              ＋
            </button>
            <input
              className="chat-page__input"
              placeholder={pendingImage ? "说一句想问的（可选）..." : "发送消息或上传图片"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setActionPanel(false)}
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

          {actionPanel && (
            <div className="chat-page__action-panel" role="menu">
              <button
                type="button"
                className="chat-page__action"
                onClick={() => onActionPick("camera")}
              >
                <span className="chat-page__action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </span>
                <span className="chat-page__action-label">拍照</span>
              </button>
              <button
                type="button"
                className="chat-page__action"
                onClick={() => onActionPick("image")}
              >
                <span className="chat-page__action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="1.5" />
                    <path d="M21 17l-5-5L5 21" />
                  </svg>
                </span>
                <span className="chat-page__action-label">上传图片</span>
              </button>
              <button
                type="button"
                className="chat-page__action"
                onClick={() => onActionPick("voice")}
              >
                <span className="chat-page__action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2.1z" />
                </svg>
                </span>
                <span className="chat-page__action-label">语音通话</span>
              </button>
              <button
                type="button"
                className="chat-page__action"
                onClick={() => onActionPick("video")}
              >
                <span className="chat-page__action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="6" width="13" height="12" rx="2" />
                    <path d="M16 10l5-3v10l-5-3z" />
                  </svg>
                </span>
                <span className="chat-page__action-label">视频通话</span>
              </button>
            </div>
          )}
        </>
      )}

      {modal && <ChatModal type={modal} onClose={() => setModal(null)} />}

      {drawerOpen && <ChatDrawer onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}

function ChatDrawer({ onClose }: { onClose: () => void }) {
  const today = [
    { id: "h1", title: "雀斑奶油妆 · 解析", time: "今天 19:42" },
    { id: "h2", title: "清冷感通勤妆 · 对话", time: "今天 14:08" },
  ];
  const week = [
    { id: "h3", title: "韩系裸妆 · 对话", time: "昨天" },
    { id: "h4", title: "港风复古妆 · 解析", time: "前天" },
    { id: "h5", title: "甜妹约会妆 · 对话", time: "上周三" },
  ];
  const earlier = [
    { id: "h6", title: "通勤淡妆 · 已完成" },
    { id: "h7", title: "面试稳重妆 · 已解析" },
  ];

  return (
    <div className="chat-drawer-backdrop" onClick={onClose}>
      <aside className="chat-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="chat-drawer__head">
          <h3>妆搭</h3>
          <button
            type="button"
            className="chat-drawer__close"
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </header>

        <button
          type="button"
          className="chat-drawer__new"
          onClick={() => {
            onClose();
            appActions.showToast("新建对话功能开发中", "info");
          }}
        >
          <span aria-hidden>＋</span>新建对话
        </button>

        <nav className="chat-drawer__nav">
          <button type="button" onClick={() => { onClose(); appActions.setActiveTab("profile"); }}>
            <span aria-hidden>📁</span>妆容档案<span className="arr">›</span>
          </button>
          <button type="button" onClick={() => { onClose(); appActions.showToast("设置开发中", "info"); }}>
            <span aria-hidden>⚙</span>设置<span className="arr">›</span>
          </button>
        </nav>

        <section className="chat-drawer__group">
          <h4>今天</h4>
          <ul>
            {today.map((h) => (
              <li key={h.id} onClick={onClose}>
                <span className="t">{h.title}</span>
                <span className="d">{h.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="chat-drawer__group">
          <h4>最近一周</h4>
          <ul>
            {week.map((h) => (
              <li key={h.id} onClick={onClose}>
                <span className="t">{h.title}</span>
                <span className="d">{h.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="chat-drawer__group">
          <h4>更早</h4>
          <ul>
            {earlier.map((h) => (
              <li key={h.id} onClick={onClose}>
                <span className="t">{h.title}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="chat-drawer__foot">
          <div className="chat-drawer__user">
            <div className="chat-drawer__avatar">妆</div>
            <div className="chat-drawer__id">
              <div className="n">小妆</div>
              <div className="s">新手 · L2</div>
            </div>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function InspirationCardView({
  item,
  generating,
  disabled,
  onGenerate,
  onImport,
}: {
  item: InspirationCard;
  generating: boolean;
  disabled: boolean;
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
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || disabled}
          >
            {generating ? "生成中…" : "生成我的版本"}
          </button>
          <button type="button" onClick={onImport} disabled={generating}>
            导入聊天
          </button>
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

function _formatHistoryTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `今天 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const _STATUS_LABEL: Record<HistoryItem["status"], string> = {
  analyzed: "已解析",
  imported: "已导入聊天",
  completed: "已完成",
};

function HistoryContent() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    setError(null);
    listHistory()
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? `加载失败（${err.status}）` : "加载失败";
        setError(msg);
        setItems([]);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const removeOne = async (item: HistoryItem) => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteHistory(item.itemId);
      setItems((cur) => (cur ?? []).filter((x) => x.itemId !== item.itemId));
      appActions.showToast("已删除", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? `删除失败（${err.status}）` : "删除失败";
      appActions.showToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (busy || !items || items.length === 0) return;
    setBusy(true);
    try {
      const results = await Promise.allSettled(
        items.map((it) => deleteHistory(it.itemId)),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      setItems([]);
      appActions.showToast(
        fail ? `清空了 ${ok} 条，${fail} 条失败` : `已清空 ${ok} 条`,
        fail ? "warn" : "success",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>历史记录</h2>
      {items === null && !error && <p className="privacy-text">加载中…</p>}
      {error && <p className="privacy-text">{error}</p>}
      {items && items.length === 0 && !error && (
        <p className="privacy-text">还没有历史记录。去首页粘贴链接或上传图片，解析后会出现在这里。</p>
      )}
      {items && items.length > 0 && (
        <>
          <div className="modal-list">
            {items.map((item) => (
              <button
                type="button"
                key={item.itemId}
                onClick={() => removeOne(item)}
                disabled={busy}
                title="点击删除"
              >
                <span>{item.title}</span>
                <small>
                  {_formatHistoryTime(item.createdAt)} · {_STATUS_LABEL[item.status]}
                </small>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="history-clear-btn"
            onClick={clearAll}
            disabled={busy}
          >
            {busy ? "清空中…" : "清空全部"}
          </button>
        </>
      )}
    </>
  );
}

function UploadContent() {
  const isRealUser = useAppState((s) => s.isAuthed && s.authMethod !== "guest");
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "analyzing" | "done" | "error">(
    "idle",
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzePhotoResponse | null>(null);
  const [savedToProfile, setSavedToProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStage("idle");
    setErrorMsg(null);
    setResult(null);
    setSavedToProfile(false);
    setCurrentMediaId(null);
  };

  const runAnalyze = async (file: File, saveToProfile: boolean) => {
    if (!isRealUser) {
      appActions.showToast("登录后才能分析自拍", "warn");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setStage("uploading");
    setErrorMsg(null);
    setResult(null);
    setSavedToProfile(false);
    try {
      const asset = await uploadMedia({
        file,
        purpose: "selfie",
        retentionPolicy: saveToProfile ? "profile_summary_allowed" : "session_only",
      });
      setCurrentMediaId(asset.mediaAssetId);
      setStage("analyzing");
      const res = await analyzePhoto({
        mediaAssetId: asset.mediaAssetId,
        saveToProfile,
      });
      setResult(res);
      setSavedToProfile(res.retention.longTermProfileSaved);
      setStage("done");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof ApiError ? `分析失败（${err.status}）` : "分析失败，请重试";
      setErrorMsg(msg);
      setStage("error");
    }
  };

  const onPick = (file: File | undefined) => {
    if (!file) return;
    void runAnalyze(file, false);
  };

  const saveAsProfile = async () => {
    if (!currentMediaId || saving) return;
    setSaving(true);
    try {
      const res = await analyzePhoto({
        mediaAssetId: currentMediaId,
        saveToProfile: true,
      });
      setResult(res);
      setSavedToProfile(res.retention.longTermProfileSaved);
      appActions.showToast(
        res.retention.longTermProfileSaved ? "已保存到档案" : "保存失败",
        res.retention.longTermProfileSaved ? "success" : "warn",
      );
    } catch (err) {
      const msg =
        err instanceof ApiError ? `保存失败（${err.status}）` : "保存失败";
      appActions.showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isRealUser) {
    return (
      <>
        <h2>上传照片分析个人风格</h2>
        <p className="privacy-text">
          自拍分析要登录后才能用，游客模式下我们不会保存任何脸部数据。
        </p>
        <button
          type="button"
          className="history-clear-btn"
          onClick={() => appActions.setActiveTab("profile")}
        >
          去登录
        </button>
      </>
    );
  }

  return (
    <>
      <h2>上传照片分析个人风格</h2>
      <div className="upload-card">
        <b>自拍照片</b>
        <p>用于分析脸型、肤色、眼型和适合你的腮红、眼线、唇色。</p>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={albumRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {stage === "idle" && (
        <div className="upload-options">
          <button type="button" onClick={() => cameraRef.current?.click()}>
            拍一张
          </button>
          <button type="button" onClick={() => albumRef.current?.click()}>
            从相册选
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="upload-preview">
          <img src={previewUrl} alt="自拍预览" />
        </div>
      )}

      {(stage === "uploading" || stage === "analyzing") && (
        <p className="privacy-text">
          {stage === "uploading" ? "上传中…" : "分析中，大概 5–10 秒…"}
        </p>
      )}

      {stage === "error" && (
        <>
          <p className="privacy-text" style={{ color: "var(--accent)" }}>
            {errorMsg}
          </p>
          <button type="button" className="history-clear-btn" onClick={reset}>
            重新选择
          </button>
        </>
      )}

      {stage === "done" && result && (
        <>
          <div className="analysis-result">
            <div className="analysis-result__row">
              <span>脸型</span>
              <b>{result.beautyProfile.faceShape}</b>
            </div>
            <div className="analysis-result__row">
              <span>肤色</span>
              <b>{result.beautyProfile.skinTone}</b>
            </div>
            <div className="analysis-result__row">
              <span>眼型</span>
              <b>{result.beautyProfile.eyeType}</b>
            </div>
            <div className="analysis-result__row">
              <span>气质</span>
              <b>{result.beautyProfile.featureStyle}</b>
            </div>
            <div className="analysis-result__row">
              <span>建议腮红</span>
              <b>{result.beautyProfile.preferredBlushPosition}</b>
            </div>
            <div className="analysis-result__row">
              <span>建议眼线</span>
              <b>{result.beautyProfile.preferredEyeliner}</b>
            </div>
            {result.beautyProfile.preferredLipColors.length > 0 && (
              <div className="analysis-result__row">
                <span>适合唇色</span>
                <b>{result.beautyProfile.preferredLipColors.join(" / ")}</b>
              </div>
            )}
            {result.beautyProfile.avoidStyles.length > 0 && (
              <div className="analysis-result__row">
                <span>建议避开</span>
                <b>{result.beautyProfile.avoidStyles.join(" / ")}</b>
              </div>
            )}
          </div>

          <div className="upload-options">
            <button
              type="button"
              onClick={saveAsProfile}
              disabled={saving || savedToProfile}
            >
              {savedToProfile
                ? "已保存到档案"
                : saving
                  ? "保存中…"
                  : "保存到我的档案"}
            </button>
            <button type="button" onClick={reset}>
              换一张
            </button>
          </div>
        </>
      )}

      <p className="privacy-text">
        默认仅本次会话使用，不保留原图。点「保存到我的档案」才会保留脸型、肤色等结构化标签。
      </p>
    </>
  );
}
