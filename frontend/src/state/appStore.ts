import { useSyncExternalStore } from "react";
import type {
  ActiveTab,
  ChatSession,
  MakeupCard,
  ToastState,
  UserPublic,
} from "@/types";
import {
  clearToken,
  getCachedUser,
  getToken,
  setCachedUser,
  setToken,
} from "@/lib/auth";

export type AuthMethod = "password" | "guest";

export interface AppState {
  activeTab: ActiveTab;
  currentUserId: string;
  currentCard?: MakeupCard;
  currentSession?: ChatSession;
  toast?: ToastState;
  isAuthed: boolean;
  authMethod?: AuthMethod;
  currentUser?: UserPublic;
}

const GUEST_USER: UserPublic = {
  userId: "guest",
  username: "guest",
  nickname: "游客",
  isGuest: true,
};

function bootstrap(): AppState {
  const cached = getCachedUser();
  const token = getToken();
  if (cached && token && !cached.isGuest) {
    return {
      activeTab: "home",
      currentUserId: cached.userId,
      isAuthed: true,
      authMethod: "password",
      currentUser: cached,
    };
  }
  return {
    activeTab: "home",
    currentUserId: GUEST_USER.userId,
    isAuthed: false,
  };
}

type Listener = () => void;

class Store {
  private state: AppState = bootstrap();
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

  signInWithPassword: (user: UserPublic, accessToken: string) => {
    setToken(accessToken);
    setCachedUser(user);
    store.setState({
      isAuthed: true,
      authMethod: "password",
      currentUser: user,
      currentUserId: user.userId,
      activeTab: "home",
    });
  },

  signInAsGuest: () => {
    clearToken();
    store.setState({
      isAuthed: true,
      authMethod: "guest",
      currentUser: { ...GUEST_USER },
      currentUserId: GUEST_USER.userId,
      activeTab: "home",
    });
  },

  signOut: () => {
    clearToken();
    store.setState({
      isAuthed: false,
      authMethod: undefined,
      currentUser: undefined,
      currentUserId: GUEST_USER.userId,
      activeTab: "home",
    });
  },
};
