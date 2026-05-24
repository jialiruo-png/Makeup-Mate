import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import { clearMemory, getMe, type MeResponse } from "@/api/profile";
import { listHistory, deleteHistory } from "@/api/history";
import { appActions, useAppState } from "@/state/appStore";
import type { HistoryItem } from "@/types";
import "./ProfilePage.css";

// 当肤色/唇色/腮红/眼影是文字描述时，给它一个近似的展示色。
// 后端长期档案现在只存文字标签，所以这里做一个保守的关键字映射。
function pickHex(name: string, kind: "lip" | "blush" | "eye"): string {
  const k = name;
  const map: Record<"lip" | "blush" | "eye", Array<[string, string]>> = {
    lip: [
      ["奶茶", "#C9A07A"],
      ["豆沙", "#B0716B"],
      ["红棕", "#8E5546"],
      ["枫叶", "#A8543F"],
      ["脏橘", "#C97A55"],
      ["正红", "#B23A3A"],
      ["珊瑚", "#E08A6B"],
      ["梅子", "#7E3B4F"],
    ],
    blush: [
      ["杏粉", "#E5B5A4"],
      ["豆沙粉", "#D49387"],
      ["蜜桃", "#E89F8A"],
      ["珊瑚", "#E2876C"],
      ["玫瑰", "#C97A85"],
      ["奶杏", "#EBC2B1"],
    ],
    eye: [
      ["浅棕", "#C9A88E"],
      ["大地", "#A98363"],
      ["奶茶", "#C9A07A"],
      ["米色", "#D9BFA6"],
      ["枫叶", "#A8543F"],
      ["豆沙", "#B0716B"],
      ["紫", "#8E5E78"],
    ],
  };
  for (const [needle, hex] of map[kind]) {
    if (k.includes(needle)) return hex;
  }
  return kind === "lip" ? "#B0716B" : kind === "blush" ? "#D49387" : "#A98363";
}

// 给从 BeautyProfile 文本派生的“眼影色”一个合理默认。
// 长期档案没有显式存眼影色，所以从风格里推一组。
function deriveEyeShadowNames(featureStyle: string): string[] {
  if (featureStyle.includes("冷") || featureStyle.includes("清冷")) return ["浅棕", "灰棕"];
  if (featureStyle.includes("甜") || featureStyle.includes("桃花")) return ["蜜桃棕", "豆沙"];
  if (featureStyle.includes("港") || featureStyle.includes("复古")) return ["枫叶棕", "梅子色"];
  return ["浅棕", "大地色"];
}

function formatHistoryTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "今天";
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "昨天";
  const diff = (now.getTime() - d.getTime()) / 86400000;
  if (diff < 7) return "本周";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const STATUS_LABEL: Record<HistoryItem["status"], string> = {
  analyzed: "已解析",
  imported: "已导入聊天",
  completed: "已完成",
};

export function ProfilePage() {
  const isAuthed = useAppState((s) => s.isAuthed);
  const authMethod = useAppState((s) => s.authMethod);
  const isRealUser = isAuthed && authMethod !== "guest";

  const [me, setMe] = useState<MeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = () => {
    if (!isRealUser) return;
    setLoadError(null);
    getMe()
      .then(setMe)
      .catch((err) => {
        const msg =
          err instanceof ApiError ? `加载失败（${err.status}）` : "加载失败";
        setLoadError(msg);
      });
    listHistory()
      .then((res) => setHistory(res.items))
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    load();
  }, [isRealUser]);

  const profile = me?.beautyProfile;
  const completeness = me?.profileCompleteness ?? 0;

  const quickStats = useMemo(
    () =>
      profile
        ? [
            { label: "脸型", value: profile.faceShape },
            { label: "五官", value: profile.featureStyle },
            { label: "色调", value: profile.skinTone },
          ]
        : [],
    [profile],
  );

  const faceCode = useMemo(() => {
    if (!profile) return [];
    return [
      { title: "脸型判断", desc: `${profile.faceShape}。建议腮红 ${profile.preferredBlushPosition}。` },
      { title: "五官风格", desc: `${profile.featureStyle}，气质适合干净通透的妆面。` },
      { title: "眼型分析", desc: `${profile.eyeType}，推荐眼线画法：${profile.preferredEyeliner}。` },
      { title: "肤色特征", desc: `${profile.skinTone}，搭配下方推荐的唇色和腮红更贴肤。` },
    ];
  }, [profile]);

  const colorPalette = useMemo(() => {
    if (!profile) return [];
    const eyeNames = deriveEyeShadowNames(profile.featureStyle);
    return [
      {
        title: "适合唇色",
        items: profile.preferredLipColors.map((n) => ({ name: n, hex: pickHex(n, "lip") })),
      },
      {
        title: "适合腮红",
        items: [
          { name: profile.preferredBlushPosition.includes("眼下") ? "杏粉" : "豆沙粉", hex: "#E5B5A4" },
          { name: "豆沙粉", hex: "#D49387" },
        ],
      },
      {
        title: "适合眼影",
        items: eyeNames.map((n) => ({ name: n, hex: pickHex(n, "eye") })),
      },
    ];
  }, [profile]);

  const avoids = profile?.avoidStyles ?? [];

  const memories = useMemo(() => {
    if (!profile) return [];
    return [
      `偏好腮红位置：${profile.preferredBlushPosition}`,
      `偏好眼线画法：${profile.preferredEyeliner}`,
      profile.preferredLipColors.length > 0
        ? `偏好唇色方向：${profile.preferredLipColors.join("、")}`
        : null,
      profile.avoidStyles.length > 0
        ? `不建议尝试：${profile.avoidStyles.join("、")}`
        : null,
    ].filter((x): x is string => !!x);
  }, [profile]);

  const recent = useMemo(() => {
    if (!history) return [];
    return history.slice(0, 5);
  }, [history]);

  const completedCount = history?.filter((h) => h.status === "completed").length ?? 0;
  const totalCount = history?.length ?? 0;

  const onReanalyze = () => {
    appActions.setActiveTab("chat");
    appActions.showToast("点右上角头像按钮，上传一张自拍重新分析", "info");
  };

  const onClearMemory = async () => {
    if (clearing) return;
    if (!window.confirm("确定要清空长期档案吗？这不会删除聊天历史。")) return;
    setClearing(true);
    try {
      await clearMemory();
      appActions.showToast("已清空妆容记忆", "success");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? `清空失败（${err.status}）` : "清空失败";
      appActions.showToast(msg, "error");
    } finally {
      setClearing(false);
    }
  };

  const onClearHistory = async () => {
    if (!history || history.length === 0) {
      appActions.showToast("还没有历史可清", "info");
      return;
    }
    if (!window.confirm(`确定要清空 ${history.length} 条解析记录吗？`)) return;
    try {
      await Promise.allSettled(history.map((h) => deleteHistory(h.itemId)));
      appActions.showToast("已清空解析记录", "success");
      setHistory([]);
    } catch {
      appActions.showToast("清空失败", "error");
    }
  };

  const onGoChatLibrary = () => {
    appActions.setActiveTab("chat");
    appActions.showToast("从灵感库挑一张，「生成我的版本」会按你的档案来调", "info");
  };

  if (!isRealUser) {
    return (
      <div className="profile-page">
        <header className="profile-hero">
          <h1 className="profile-hero__title">我的妆容档案</h1>
        </header>
        <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7 }}>
          登录后才能查看你的长期档案。游客模式下我们不会保存任何脸部数据。
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="profile-page">
        <header className="profile-hero">
          <h1 className="profile-hero__title">我的妆容档案</h1>
        </header>
        <p style={{ color: "var(--accent)", fontSize: 13 }}>{loadError}</p>
        <button type="button" className="profile-cta" onClick={load}>
          重试
        </button>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="profile-page">
        <header className="profile-hero">
          <h1 className="profile-hero__title">我的妆容档案</h1>
        </header>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div className="profile-hero__top">
          <h1 className="profile-hero__title">我的妆容档案</h1>
          <button type="button" className="profile-hero__action" onClick={onReanalyze}>
            <span aria-hidden>↻</span>重新分析
          </button>
        </div>
        <div className="profile-hero__user">
          <div className="profile-hero__avatar">
            {(me.nickname || "妆").slice(0, 1)}
          </div>
          <div className="profile-hero__meta">
            <div className="profile-hero__name">
              {me.nickname || "妆搭用户"}
              <span className="profile-hero__level">
                {completeness >= 0.75 ? "进阶" : completeness >= 0.4 ? "新手 · L2" : "新手 · L1"}
              </span>
            </div>
            <div className="profile-hero__sub">
              已复刻 {completedCount} 次妆容 · 累计 {totalCount} 条记录
            </div>
            <div className="profile-hero__progress">
              <span>妆容档案完成度</span>
              <span className="profile-hero__pv">{Math.round(completeness * 100)}%</span>
            </div>
            <div className="profile-progress-bar">
              <i style={{ width: `${Math.round(completeness * 100)}%` }} />
            </div>
          </div>
        </div>
      </header>

      {profile ? (
        <>
          <div className="quick-stats">
            {quickStats.map((s) => (
              <div key={s.label} className="qs-card">
                <span className="qs-label">{s.label}</span>
                <span className="qs-value">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="analysis">
            <section className="analysis-section">
              <h3 className="analysis-title">
                <span className="analysis-emoji">👤</span>面容密码
              </h3>
              <div className="analysis-list">
                {faceCode.map((item) => (
                  <div key={item.title} className="analysis-item">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="analysis-section">
              <h3 className="analysis-title">
                <span className="analysis-emoji">🎨</span>色彩标签
              </h3>
              <div className="analysis-list">
                {colorPalette.map((group) => (
                  <div key={group.title} className="analysis-item">
                    <h4>{group.title}</h4>
                    <div className="color-tags">
                      {group.items.map((c) => (
                        <div
                          key={c.name}
                          className="color-tag"
                          style={{ background: c.hex }}
                        >
                          {c.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {avoids.length > 0 && (
            <section className="profile-section">
              <span className="profile-section__label">建议避开</span>
              <div className="profile-tags">
                {avoids.map((t) => (
                  <span key={t} className="profile-tag profile-tag--ghost">{t}</span>
                ))}
              </div>
            </section>
          )}

          {memories.length > 0 && (
            <section className="profile-section">
              <span className="profile-section__label">MM 记住的事</span>
              <div className="profile-notes">
                {memories.map((m) => (
                  <p key={m}>{m}</p>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="profile-section">
          <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7 }}>
            还没有长期档案。去聊天页点右上角头像按钮，上传一张自拍生成你的档案。
          </p>
        </section>
      )}

      <section className="profile-section">
        <span className="profile-section__label">最近的复刻</span>
        {recent.length > 0 ? (
          <ul className="profile-timeline">
            {recent.map((h) => (
              <li key={h.itemId} className="profile-timeline__row">
                <i className="profile-timeline__dot" />
                <time>{formatHistoryTime(h.createdAt)}</time>
                <span>{h.title} · {STATUS_LABEL[h.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 12.5 }}>还没有解析记录。</p>
        )}
      </section>

      {totalCount > 0 && (
        <p className="profile-stats">
          累计解析 <b>{totalCount}</b> 次，已复刻 <b>{completedCount}</b> 次。
        </p>
      )}

      <button type="button" className="profile-cta" onClick={onGoChatLibrary}>
        试试一键生成「我的版本」
      </button>

      <footer className="profile-footer">
        <p>
          妆搭默认不保存原图，只保留脸型、肤色等结构化标签。
          你可以随时删除档案与历史记忆。
        </p>
        <div className="profile-footer__actions">
          <button type="button" onClick={onClearHistory}>
            删除解析记录
          </button>
          <button type="button" onClick={onClearMemory} disabled={clearing}>
            {clearing ? "清空中…" : "清空妆容记忆"}
          </button>
        </div>
      </footer>
    </div>
  );
}
