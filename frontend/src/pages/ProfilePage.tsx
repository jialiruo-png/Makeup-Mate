import { useEffect, useState } from "react";
import { useAppState, appActions } from "@/state/appStore";
import { ApiError } from "@/api/client";
import { clearMemory, getMe, type MeResponse } from "@/api/profile";
import { listHistory } from "@/api/history";
import type { HistoryItem } from "@/types";
import "./ProfilePage.css";

const _STATUS_LABEL: Record<HistoryItem["status"], string> = {
  analyzed: "已解析",
  imported: "已导入聊天",
  completed: "已完成",
};

function _formatHistoryTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `今天 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const oneDay = 24 * 60 * 60 * 1000;
  if (now.getTime() - d.getTime() < oneDay * 2) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function ProfilePage() {
  // /profile/me 后端用 require_real_user，游客访问会 403。
  // 所以这里要的是"真用户"，不是单纯 isAuthed（signIn('guest') 也会把 isAuthed 设成 true）。
  const isRealUser = useAppState((s) => s.isAuthed && s.authMethod !== "guest");
  const isGuest = useAppState((s) => s.isAuthed && s.authMethod === "guest");

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!isRealUser) {
      setMe(null);
      setHistory([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getMe(),
      listHistory().catch(() => ({ items: [] as HistoryItem[] })),
    ])
      .then(([meData, histData]) => {
        if (cancelled) return;
        setMe(meData);
        setHistory(histData.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? `加载失败（${err.status}）` : "加载失败";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isRealUser]);

  const onSignOut = () => {
    appActions.signOut();
    appActions.showToast("已退出登录", "info");
  };

  const onClearMemory = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await clearMemory();
      appActions.showToast("已清空妆容记忆", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? `清空失败（${err.status}）` : "清空失败";
      appActions.showToast(msg, "error");
    } finally {
      setClearing(false);
    }
  };

  // ===== 三种降级状态：未登录 / 游客 / 加载中 / 出错 =====
  if (!isRealUser) {
    // 包含两种：从未登录 / 游客模式
    const title = isGuest ? "游客模式" : "未登录";
    const subtitle = isGuest
      ? "游客无法查看妆容档案，登录后才能保存"
      : "登录后查看你的妆容档案";
    return (
      <div className="profile-page">
        <header className="profile-page__hero">
          <div className="profile-page__avatar">妆</div>
          <div className="profile-page__greeting">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </header>
        <section className="profile-section">
          <button
            type="button"
            className="profile-tag"
            onClick={() => {
              if (isGuest) appActions.signOut();
              appActions.setActiveTab("home");
            }}
          >
            {isGuest ? "退出游客 · 去登录" : "去登录"}
          </button>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <header className="profile-page__hero">
          <div className="profile-page__avatar">妆</div>
          <div className="profile-page__greeting">
            <h2>加载中…</h2>
            <p>正在读取你的妆容档案</p>
          </div>
        </header>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="profile-page">
        <header className="profile-page__hero">
          <div className="profile-page__avatar">妆</div>
          <div className="profile-page__greeting">
            <h2>妆搭体验用户</h2>
            <p>{error ?? "暂无档案数据"}</p>
          </div>
        </header>
      </div>
    );
  }

  // ===== 正常状态：用 me.beautyProfile + history 填充 =====
  const profile = me.beautyProfile;

  // 一句话 bio：拼几个核心标签
  const bioParts = profile
    ? [profile.faceShape, `${profile.skinTone}肤色`, profile.eyeType, profile.featureStyle].filter(Boolean)
    : [];
  const bio = bioParts.length ? bioParts.join(" · ") : "档案待完善";

  // 适合你：腮红位置 + 眼线 + 唇色
  const suits = profile
    ? [
        profile.preferredBlushPosition,
        profile.preferredEyeliner,
        ...(profile.preferredLipColors ?? []),
      ].filter(Boolean)
    : [];

  // 建议避开
  const avoids = profile?.avoidStyles ?? [];

  // 最近的复刻：取 history 前 6 条
  const recent = history.slice(0, 6);

  return (
    <div className="profile-page">
      {/* hero */}
      <header className="profile-page__hero">
        <div className="profile-page__avatar">妆</div>
        <div className="profile-page__greeting">
          <h2>{me.nickname}</h2>
          <p>
            妆容档案完成度 {Math.round((me.profileCompleteness ?? 0) * 100)}%
            。AI 会把卡片和灵感库方案改写得更适合你。
          </p>
        </div>
      </header>

      {/* 关于你：一句话 bio */}
      <section className="profile-section">
        <span className="profile-section__label">关于你</span>
        <p className="profile-bio">{bio}。</p>
      </section>

      {/* 适合你：标签云 */}
      {suits.length > 0 && (
        <section className="profile-section">
          <span className="profile-section__label">适合你</span>
          <div className="profile-tags">
            {suits.map((t) => (
              <span key={t} className="profile-tag">{t}</span>
            ))}
          </div>
        </section>
      )}

      {/* 建议避开 */}
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

      {/* 最近的复刻（从 /history 拉真数据） */}
      <section className="profile-section">
        <span className="profile-section__label">最近的复刻</span>
        {recent.length === 0 ? (
          <p className="profile-bio" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            还没有复刻记录，去首页解析一个妆容卡片试试。
          </p>
        ) : (
          <ul className="profile-timeline">
            {recent.map((item) => (
              <li key={item.itemId} className="profile-timeline__row">
                <i className="profile-timeline__dot" />
                <time>{_formatHistoryTime(item.createdAt)}</time>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 隐私 footer */}
      <footer className="profile-footer">
        <p>
          妆搭默认不保存原图，只保留脸型、肤色等结构化标签。
          你可以随时删除档案与历史记忆。
        </p>
        <div className="profile-footer__actions">
          <button type="button" onClick={onClearMemory} disabled={clearing}>
            {clearing ? "清空中…" : "清空妆容记忆"}
          </button>
          <button type="button" onClick={onSignOut}>
            退出登录
          </button>
        </div>
      </footer>
    </div>
  );
}
