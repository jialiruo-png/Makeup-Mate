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

  const signInWechat = () => {
    appActions.signIn("wechat");
    appActions.showToast("已使用微信登录", "success");
  };

  const signInGuest = () => {
    appActions.signIn("guest");
    appActions.showToast("已进入游客模式", "info");
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
        <button type="button" className="login-page__wechat" onClick={signInWechat}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8.7 4C4.7 4 1.5 6.7 1.5 10c0 1.9 1.1 3.6 2.8 4.8L3.6 17l2.5-1.3c.8.2 1.7.3 2.6.3.3 0 .5 0 .8-.1-.2-.5-.3-1-.3-1.6 0-2.9 2.8-5.3 6.3-5.3.2 0 .4 0 .6 0C15.5 6 12.4 4 8.7 4ZM6 8.6a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Zm5.5 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Zm9 7.5c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.3-.1 1.9-.2l1.9 1-.5-1.7c1.6-1 2.7-2.5 2.7-4Zm-8.2-1.4a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm4.4 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z" />
          </svg>
          微信一键登录
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
