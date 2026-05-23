import { useEffect } from "react";
import { useAppState, appActions } from "@/state/appStore";
import "./Toast.css";

export function Toast() {
  const toast = useAppState((s) => s.toast);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => appActions.hideToast(), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.tone ?? "info"}`} role="status">
      {toast.message}
    </div>
  );
}
