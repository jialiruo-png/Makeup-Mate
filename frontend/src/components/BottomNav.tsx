import { useAppState, appActions } from "@/state/appStore";
import type { ActiveTab } from "@/types";
import "./BottomNav.css";

interface NavItem {
  key: ActiveTab;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "首页", icon: "✦" },
  { key: "chat", label: "聊天", icon: "◐" },
  { key: "profile", label: "我的", icon: "❀" },
];

export function BottomNav() {
  const activeTab = useAppState((s) => s.activeTab);
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`bottom-nav__item${active ? " is-active" : ""}`}
            onClick={() => appActions.setActiveTab(item.key)}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
