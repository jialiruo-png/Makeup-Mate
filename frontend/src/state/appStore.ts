import { useSyncExternalStore } from "react";
import { clearToken } from "@/lib/auth";
import type {
  ActiveTab,
  ChatSession,
  MakeupCard,
  ToastState,
} from "@/types";

export type AuthMethod = "phone" | "wechat" | "douyin" | "guest";

export interface AppState {
  activeTab: ActiveTab;
  currentUserId: string;
  currentCard?: MakeupCard;
  currentSession?: ChatSession;
  toast?: ToastState;
  isAuthed: boolean;
  authMethod?: AuthMethod;
}

const initialState: AppState = {
  activeTab: "home",
  currentUserId: "user_demo",
  isAuthed: false,
};

type Listener = () => void;

class Store {
  private state: AppState = initialState;
  private listeners = new Set<Listener>();

  getState = (): AppState => this.state;

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  setState = (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    const next = typeof patch === "function" ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l());
  };
}

export const store = new Store();

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

export const appActions = {
  setActiveTab: (tab: ActiveTab) => store.setState({ activeTab: tab }),
  setCurrentCard: (card?: MakeupCard) => store.setState({ currentCard: card }),
  setCurrentSession: (session?: ChatSession) =>
    store.setState({ currentSession: session }),
  showToast: (message: string, tone: ToastState["tone"] = "info") =>
    store.setState({ toast: { message, tone } }),
  hideToast: () => store.setState({ toast: undefined }),
  signIn: (method: AuthMethod) =>
    store.setState({ isAuthed: true, authMethod: method, activeTab: "home" }),
  signOut: () => {
    clearToken();
    store.setState({ isAuthed: false, authMethod: undefined, activeTab: "home" });
  },
};
