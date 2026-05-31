import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const ROUTE_TITLE_KEYS = {
  "/learn": "routes.myTrainings",
  "/learn/certificates": "routes.myCertificates",
  "/learn/program": "routes.programHub",
  "/admin": "routes.adminOverview",
  "/admin/programs": "routes.programs",
  "/admin/modules": "routes.modules",
  "/admin/employees": "routes.learners",
  "/admin/learners": "routes.learners",
  "/admin/stats": "routes.statistics",
  "/admin/certificates": "routes.certificateTemplate",
  "/admin/notifications": "routes.notifications",
  "/admin/settings": "routes.settings",
  "/lead": "routes.teamDashboard",
  "/lead/learners": "routes.learners",
  "/lead/stats": "routes.statistics",
  "/lead/notifications": "routes.notifications",
};

export function AppLayout() {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const titleKey = (() => {
    if (location.pathname.includes("/evaluation")) {
      return "routes.evaluation";
    }
    return Object.entries(ROUTE_TITLE_KEYS)
      .sort(([a], [b]) => b.length - a.length)
      .find(([path]) => location.pathname.startsWith(path))?.[1];
  })();

  const title = titleKey ? t(titleKey) : t("app.name");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={title}
          onMenuToggle={() => setMobileMenuOpen((v) => !v)}
        />

        <main className="flex-1 overflow-y-auto pb-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom tabs are intentionally disabled for usability.
          We rely on the burger/drawer navigation on small screens.
          Keep `BottomNav` component for future re-enable if needed. */}
    </div>
  );
}
