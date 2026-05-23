import { useEffect } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { Toast } from "@/components/Toast";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { useAppState, appActions } from "@/state/appStore";
import { getHealth } from "@/api/health";
import "./App.css";

export default function App() {
  const tab = useAppState((s) => s.activeTab);

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
          {tab === "home" && <HomePage />}
          {tab === "chat" && <ChatPage />}
          {tab === "profile" && <ProfilePage />}
          <BottomNav />
          <Toast />
        </PhoneFrame>
      </main>
    </div>
  );
}
