import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/global.css";
import { installPullRefreshGuard } from "@/lib/preventPullRefresh";
import App from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root element not found");

installPullRefreshGuard();

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
