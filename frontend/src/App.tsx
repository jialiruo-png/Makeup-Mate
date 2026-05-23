import { useEffect } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { Toast } from "@/components/Toast";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LoginPage } from "@/pages/LoginPage";
import { useAppState, appActions } from "@/state/appStore";
import { getHealth } from "@/api/health";
import { UNAUTHORIZED_EVENT } from "@/api/client";
import { fetchMe } from "@/api/auth";
import { getToken } from "@/lib/auth";
import "./App.css";

export default function App() {
  const tab = useAppState((s) => s.activeTab);
  const isAuthed = useAppState((s) => s.isAuthed);

  useEffect(() => {
    getHealth()
      .then((res) => {
        if (!res.ok) {
          appActions.showToast("后端 health 异常，请检查 uvicorn 服务", "warn");
        }
      })
      .catch(() => {
        appActions.showToast("后端未启动，请运行 uvicorn", "warn");
      });
  }, []);

  // 启动时如果 localStorage 里有 token，校验一下还能不能用
  useEffect(() => {
    if (!getToken()) return;
    fetchMe()
      .then((user) => {
        if (user.isGuest) return;
        // token 还有效，刷新一下 store 里的 currentUser
        const token = getToken();
        if (token) appActions.signInWithPassword(user, token);
      })
      .catch(() => {
        // 401 会被 client 自己处理，这里不用做事
      });
  }, []);

  // 任何 API 抛 401 时清登录态，回到登录页
  useEffect(() => {
    const onUnauthorized = () => {
      appActions.signOut();
      appActions.showToast("登录已过期，请重新登录", "warn");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  return (
    <div className="app">
      <aside className="app__brand">
        <div className="app__brand-mark">
          <span className="app__brand-dot">妆</span>
          <span>妆搭 Makeup Mate</span>
        </div>
        <p className="app__brand-tagline">
          会记住你的 AI 美妆视频陪练
          <br />
          桌面演示请操作右侧手机。
        </p>
        <p className="app__brand-stack">
          Vite · React · TypeScript<br />
          FastAPI · SQLAlchemy
        </p>
      </aside>

      <main className="app__stage">
        <PhoneFrame>
          {isAuthed ? (
            <>
              {tab === "home" && <HomePage />}
              {tab === "chat" && <ChatPage />}
              {tab === "profile" && <ProfilePage />}
              <BottomNav />
            </>
          ) : (
            <LoginPage />
          )}
          <Toast />
        </PhoneFrame>
      </main>
    </div>
  );
}
