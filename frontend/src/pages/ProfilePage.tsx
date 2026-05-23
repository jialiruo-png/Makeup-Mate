import { useEffect, useState } from "react";
import { useAppState, appActions } from "@/state/appStore";
import { ApiError } from "@/api/client";
import { clearMemory, getMe, type MeResponse } from "@/api/profile";
import "./ProfilePage.css";

// 这两块当前后端还没落库（memory_service 只返回 BeautyProfile）。
// 先用占位保留视觉骨架，等 memory_items / history_items 真接进来再换。
const PLACEHOLDER_MEMORIES = [
  "不喜欢浓眼妆，倾向自然淡色晕染。",
  "上班日希望 15 分钟内完成，跳过复杂修容。",
  "眼线只画后半段，沿下眼睑自然延长。",
];

const PLACEHOLDER_RECENT: Array<[string, string]> = [
  ["今天", "清冷通勤妆"],
  ["昨天", "韩系裸妆"],
  ["上周", "港风复古妆"],
];

export function ProfilePage() {
  const isAuthed = useAppState((s) => s.isAuthed);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    // 未登录直接展示登录引导，不发请求 —— /profile/me 要求 real user，游客会 403
    if (!isAuthed) {
      setMe(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    getMe()
      .then((data) => {
        if (!cancelled) setMe(data);
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
  }, [isAuthed]);

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

  // ===== 三种降级状态：未登录 / 加载中 / 出错 =====
  if (!isAuthed) {
    return (
      <div className="profile-page">
        <header className="profile-page__hero">
          <div className="profile-page__avatar">妆</div>
          <div className="profile-page__greeting">
            <h2>未登录</h2>
            <p>登录后查看你的妆容档案</p>
          </div>
        </header>
        <section className="profile-section">
          <button
            type="button"
            className="profile-tag"
            onClick={() => appActions.setActiveTab("home")}
          >
            去登录
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

  // ===== 正常状态：用 me.beautyProfile 填充 =====
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

      {/* MM 记住的事（占位，待接 memory_items） */}
      <section className="profile-section">
        <span className="profile-section__label">MM 记住的事</span>
        <div className="profile-notes">
          {PLACEHOLDER_MEMORIES.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      </section>

      {/* 最近的复刻（占位，待接 history_items） */}
      <section className="profile-section">
        <span className="profile-section__label">最近的复刻</span>
        <ul className="profile-timeline">
          {PLACEHOLDER_RECENT.map(([time, name]) => (
            <li key={name} className="profile-timeline__row">
              <i className="profile-timeline__dot" />
              <time>{time}</time>
              <span>{name}</span>
            </li>
          ))}
        </ul>
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
