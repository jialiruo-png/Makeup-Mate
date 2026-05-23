import { FormEvent, useEffect, useState } from "react";
import { appActions } from "@/state/appStore";
import "./LoginPage.css";

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const phoneValid = PHONE_REGEX.test(phone);
  const canSubmit = phoneValid && code.trim().length >= 4;

  const requestCode = () => {
    if (!phoneValid) {
      appActions.showToast("请输入正确的手机号", "warn");
      return;
    }
    setCountdown(60);
    appActions.showToast("验证码已发送（演示）", "success");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      appActions.showToast("请填写手机号和验证码", "warn");
      return;
    }
    appActions.signIn("phone");
    appActions.showToast("欢迎来到妆搭", "success");
  };

  const signInDouyin = () => {
    appActions.signIn("douyin");
    appActions.showToast("已使用抖音登录", "success");
  };

  const signInGuest = () => {
    appActions.signIn("guest");
    appActions.showToast("已进入游客模式", "info");
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

      <form className="login-page__form" onSubmit={submit}>
        <label className="login-page__field">
          <span className="login-page__field-prefix">+86</span>
          <input
            className="login-page__input"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          />
        </label>

        <label className="login-page__field login-page__field--code">
          <input
            className="login-page__input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6 位短信验证码"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button
            type="button"
            className="login-page__code-btn"
            onClick={requestCode}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
          </button>
        </label>

        <button
          type="submit"
          className="login-page__cta"
          disabled={!canSubmit}
        >
          进入妆搭
        </button>
      </form>

      <div className="login-page__divider">
        <span>或</span>
      </div>

      <div className="login-page__alts">
        <button type="button" className="login-page__douyin" onClick={signInDouyin}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M19 4.5h-3v10.1a3.1 3.1 0 1 1-3.1-3.1c.3 0 .6 0 .9.1V8.4c-.3 0-.6-.1-.9-.1A6.2 6.2 0 1 0 19 14.6V8.7c1.3.8 2.8 1.2 4.4 1.2V6.7c-1.8 0-3.4-.8-4.4-2.2z" />
          </svg>
          抖音一键登录
        </button>
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
