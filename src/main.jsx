import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./i18n";
import "./index.css";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/ui/Toast";
import { registerSW } from "virtual:pwa-register";
import { APP_BRAND_NAME } from "./lib/brand";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.warn(
    `[${APP_BRAND_NAME}] VITE_CONVEX_URL is not set — file uploads and Convex data will not work.`
  );
}

const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");
registerSW({ immediate: true });

function AppProviders({ children }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
