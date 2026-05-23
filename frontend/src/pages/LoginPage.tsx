import { FormEvent, useState } from "react";
import { appActions } from "@/state/appStore";
import { login, register } from "@/api/auth";
import { ApiError } from "@/api/client";
import { setCachedUser, setToken } from "@/lib/auth";
import "./LoginPage.css";

type Mode = "login" | "register";

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,32}$/;

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const usernameValid = USERNAME_REGEX.test(username);
  const passwordValid = password.length >= 6;
  const canSubmit = usernameValid && passwordValid && !submitting;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      if (!usernameValid) {
        appActions.showToast("用户名 3-32 位，仅限字母数字下划线", "warn");
      } else {
        appActions.showToast("密码至少 6 位", "warn");
      }
      return;
    }

    setSubmitting(true);
    try {
      const fn = mode === "login" ? login : register;
      const res = await fn(username, password);
      setToken(res.accessToken);
      setCachedUser(res.user);
      appActions.signIn("phone");
      appActions.showToast(mode === "login" ? "欢迎回来" : "注册成功，欢迎来到妆搭", "success");
    } catch (err) {
      const detail =
        err instanceof ApiError
          ? typeof err.body === "object" && err.body && "detail" in err.body
            ? String((err.body as { detail: unknown }).detail)
            : `请求失败（${err.status}）`
          : "网络异常，请稍后再试";
      appActions.showToast(detail, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const signInGuest = () => {
    appActions.signIn("guest");
    appActions.showToast("已进入游客模式（部分功能需要登录）", "info");
  };

  return (
    <div className="login-page">
      <header className="login-page__brand">
        <div className="login-page__brand-row">
          <div className="login-page__logo" aria-hidden>
            <span>MM</span>
          </div>
          <span className="login-page__brand-name">妆搭</span>
        </div>
        <p className="login-page__slogan">看懂妆容，更懂你</p>
        <p className="login-page__tagline">把喜欢的妆，变成适合你的妆。</p>
      </header>

      <div className="login-page__tabs">
        <button
          type="button"
          className={`login-page__tab ${mode === "login" ? "login-page__tab--active" : ""}`}
          onClick={() => setMode("login")}
        >
          登录
        </button>
        <button
          type="button"
          className={`login-page__tab ${mode === "register" ? "login-page__tab--active" : ""}`}
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
            placeholder="用户名（3-32 位，字母数字下划线）"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
          />
        </label>

        <label className="login-page__field">
          <input
            className="login-page__input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="login-page__cta"
          disabled={!canSubmit}
        >
          {submitting ? "请稍候…" : mode === "login" ? "登录" : "注册并登录"}
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
        妆搭默认不保存原始自拍，仅保存结构化档案
      </p>
    </div>
  );
}
