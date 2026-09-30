import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./ui/App";
import "./ui/styles.css";

registerSW({ immediate: true });

// Ask the browser not to evict the data under storage pressure. Installed PWAs
// usually get this granted automatically; the data page shows the status.
void navigator.storage?.persist?.();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
