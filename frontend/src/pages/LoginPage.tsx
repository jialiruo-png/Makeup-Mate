import { FormEvent, useState } from "react";
import { ApiError } from "@/api/client";
import { login, register } from "@/api/auth";
import { appActions } from "@/state/appStore";
import "./LoginPage.css";

type Mode = "login" | "register";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const usernameValid = USERNAME_RE.test(username);
  const passwordValid = password.length >= 6 && password.length <= 64;
  const canSubmit = usernameValid && passwordValid && !submitting;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      if (!usernameValid) {
        appActions.showToast("用户名需 3-20 位字母、数字或下划线", "warn");
      } else if (!passwordValid) {
        appActions.showToast("密码长度需 6-64 位", "warn");
      }
      return;
    }
    setSubmitting(true);
    try {
      const res = await (mode === "login"
        ? login(username, password)
        : register(username, password));
      appActions.signInWithPassword(res.user, res.accessToken);
      appActions.showToast(
        mode === "login" ? `欢迎回来，${res.user.nickname}` : "注册成功，欢迎来到妆搭",
        "success",
      );
    } catch (err) {
      const apiErr = err as ApiError;
      const detail =
        (apiErr.body as { detail?: string } | null)?.detail ??
        (mode === "login" ? "登录失败" : "注册失败");
      appActions.showToast(detail, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const signInGuest = () => {
    appActions.signInAsGuest();
    appActions.showToast("已进入游客模式（数据不会保存到账号）", "info");
  };

  return (
    <div className="login-page">
      <header className="login-page__brand">
        <div className="login-page__logo">妆</div>
        <h1 className="login-page__title">妆搭 Makeup Mate</h1>
        <p className="login-page__tagline">
          会记住你的 AI 美妆视频陪练
          <br />
          把刷到的妆容，变成你的复刻教程
        </p>
      </header>

      <div className="login-page__tabs">
        <button
          type="button"
          className={`login-page__tab${mode === "login" ? " login-page__tab--active" : ""}`}
          onClick={() => setMode("login")}
        >
          登录
        </button>
        <button
          type="button"
          className={`login-page__tab${mode === "register" ? " login-page__tab--active" : ""}`}
          onClick={() => setMode("register")}
        >
          注册
        </button>
      </div>

      <form className="login-page__form" onSubmit={submit}>
        <label className="login-page__field">
          <input
            className="login-page__input"
            type="text"
            autoComplete="username"
            maxLength={20}
            placeholder="用户名（3-20 位字母/数字/下划线）"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
          />
        </label>

        <label className="login-page__field">
          <input
            className="login-page__input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            maxLength={64}
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="login-page__cta" disabled={!canSubmit}>
          {submitting ? "请稍候…" : mode === "login" ? "登录" : "注册并进入"}
        </button>
      </form>

      <div className="login-page__divider">
        <span>或</span>
      </div>

      <div className="login-page__alts">
        <button type="button" className="login-page__guest" onClick={signInGuest}>
          暂不登录 · 游客体验
        </button>
      </div>

      <p className="login-page__legal">
        登录即同意
        <a>《用户协议》</a>
        与
        <a>《隐私政策》</a>
        <br />
        游客模式下数据不会保存到你的账号
      </p>
    </div>
  );
}
