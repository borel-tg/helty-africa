import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart2,
  Award,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

const NAV_ITEMS = {
  learner: [
    { to: "/learn", icon: LayoutDashboard, labelKey: "nav.myTraining" },
    { to: "/learn/certificates", icon: Award, labelKey: "nav.certificates" },
  ],
  lead: [
    { to: "/lead", icon: LayoutDashboard, labelKey: "nav.teamDashboard" },
    { to: "/lead/notifications", icon: Bell, labelKey: "nav.notifications" },
  ],
  admin: [
    { to: "/admin", icon: LayoutDashboard, labelKey: "nav.overview" },
    { to: "/admin/modules", icon: BookOpen, labelKey: "nav.modules" },
    { to: "/admin/learners", icon: Users, labelKey: "nav.learners" },
    { to: "/admin/stats", icon: BarChart2, labelKey: "nav.statistics" },
    { to: "/admin/certificates", icon: Award, labelKey: "nav.certificates" },
    { to: "/admin/notifications", icon: Bell, labelKey: "nav.notifications" },
  ],
  super_admin: [
    { to: "/admin", icon: LayoutDashboard, labelKey: "nav.overview" },
    { to: "/admin/modules", icon: BookOpen, labelKey: "nav.modules" },
    { to: "/admin/learners", icon: Users, labelKey: "nav.learners" },
    { to: "/admin/stats", icon: BarChart2, labelKey: "nav.statistics" },
    { to: "/admin/certificates", icon: Award, labelKey: "nav.certificates" },
    { to: "/admin/notifications", icon: Bell, labelKey: "nav.notifications" },
    { to: "/admin/settings", icon: Settings, labelKey: "nav.settings" },
  ],
};

function SidebarContent({ collapsed, onNavigate }) {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const role = currentUser?.role || "learner";
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.learner;

  const handleLogout = () => {
    onNavigate?.();
    logout();
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-gray-100",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">E</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold text-text-primary leading-tight">
              {t("app.name")}
            </p>
            <p className="text-[10px] text-text-secondary leading-tight">
              {t("app.subtitle")}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            end={item.to.endsWith("/admin") || item.to.endsWith("/lead") || item.to.endsWith("/learn")}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium",
                "transition-colors duration-150 rounded-none",
                "hover:bg-primary-50 hover:text-primary",
                "focus:outline-none focus-visible:bg-primary-50",
                isActive
                  ? "bg-primary-50 text-primary border-r-2 border-primary"
                  : "text-text-secondary",
                collapsed && "justify-center px-2"
              )
            }
            title={collapsed ? t(item.labelKey) : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{t(item.labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      <div
        className={cn(
          "border-t border-gray-100 p-3",
          collapsed && "flex justify-center"
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <span className="text-primary text-sm font-semibold">
                {currentUser?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">
                {currentUser?.name}
              </p>
              <p className="text-[10px] text-text-secondary">
                {t(`roles.${currentUser?.role}`, { defaultValue: currentUser?.role })}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title={t("common.logout")}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title={t("common.logout")}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </>
  );
}

export function Sidebar({ collapsed = false, mobileOpen = false, onMobileClose }) {
  const { t } = useTranslation();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={onMobileClose}
          aria-label={t("common.closeMenu")}
        />
      )}

      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-gray-100 shadow-sm",
          "transition-all duration-200",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-56 flex flex-col",
          "bg-white border-r border-gray-100 shadow-xl",
          "transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent collapsed={false} onNavigate={onMobileClose} />
      </aside>
    </>
  );
}
