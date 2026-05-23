import { useEffect, useState } from "react";
import { useAppState, appActions } from "@/state/appStore";
import { ApiError } from "@/api/client";
import { clearMemory, getMe, type MeResponse } from "@/api/profile";
import "./ProfilePage.css";

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

  if (!isAuthed) {
    return (
      <div className="profile-page">
        <header className="profile-page__head">
          <div className="profile-page__avatar">妆</div>
          <div className="profile-page__head-meta">
            <div className="profile-page__name">未登录</div>
            <div className="profile-page__sub">登录后查看你的妆容档案</div>
          </div>
        </header>
        <button
          type="button"
          className="profile-page__login-cta"
          onClick={() => appActions.setActiveTab("home")}
        >
          去登录
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <header className="profile-page__head">
          <div className="profile-page__avatar">妆</div>
          <div className="profile-page__head-meta">
            <div className="profile-page__name">加载中…</div>
            <div className="profile-page__sub">正在读取你的妆容档案</div>
          </div>
        </header>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="profile-page">
        <header className="profile-page__head">
          <div className="profile-page__avatar">妆</div>
          <div className="profile-page__head-meta">
            <div className="profile-page__name">妆搭体验用户</div>
            <div className="profile-page__sub">{error ?? "暂无档案数据"}</div>
          </div>
        </header>
      </div>
    );
  }

  const profile = me.beautyProfile;
  const completenessPct = Math.round((me.profileCompleteness ?? 0) * 100);

  const profileRows: [string, string][] = profile
    ? [
        ["脸型", profile.faceShape],
        ["肤色", profile.skinTone],
        ["五官风格", profile.featureStyle],
        ["眼型", profile.eyeType],
        ["适合腮红", profile.preferredBlushPosition],
        ["适合眼线", profile.preferredEyeliner],
      ]
    : [];

  const memories = profile?.preferredLipColors ?? [];
  const avoid = profile?.avoidStyles ?? [];

  return (
    <div className="profile-page">
      <header className="profile-page__head">
        <div className="profile-page__avatar">妆</div>
        <div className="profile-page__head-meta">
          <div className="profile-page__name">{me.nickname}</div>
          <div className="profile-page__sub">
            妆容档案完成度 <span>{completenessPct}%</span>
          </div>
        </div>
        <button type="button" className="profile-page__signout" onClick={onSignOut}>
          退出
        </button>
      </header>

      <section className="profile-card profile-card--hero">
        <div>
          <span>我的妆容档案</span>
          <h2>低饱和通勤 · 新手友好</h2>
          <p>AI 会把解析卡片和灵感库方案自动改写得更适合你。</p>
        </div>
      </section>

      {profileRows.length > 0 && (
        <section className="profile-card">
          <div className="profile-card__title">
            <h3>妆容档案</h3>
            <span>已结构化</span>
          </div>
          <div className="profile-grid">
            {profileRows.map(([key, value]) => (
              <div key={key} className="profile-grid__row">
                <span>{key}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      {memories.length > 0 && (
        <section className="profile-card">
          <div className="profile-card__title">
            <h3>常用唇色</h3>
            <span>可随时清空</span>
          </div>
          <div className="memory-list">
            {memories.map((item) => (
              <div key={item} className="memory-pill">{item}</div>
            ))}
          </div>
        </section>
      )}

      {avoid.length > 0 && (
        <section className="profile-card">
          <div className="profile-card__title">
            <h3>已避开</h3>
            <span>AI 会自动绕开</span>
          </div>
          <div className="memory-list">
            {avoid.map((item) => (
              <div key={item} className="memory-pill">{item}</div>
            ))}
          </div>
        </section>
      )}

      <section className="privacy-card">
        <h3>隐私设置</h3>
        <p>默认不保存原始自拍和视频，只在授权后保存脸型、肤色、偏好等结构化档案。</p>
        <div>
          <button type="button" disabled>
            仅本次分析
          </button>
          <button type="button" onClick={onClearMemory} disabled={clearing}>
            {clearing ? "清空中…" : "清空妆容记忆"}
          </button>
        </div>
      </section>
    </div>
  );
}
