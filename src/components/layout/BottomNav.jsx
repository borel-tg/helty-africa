import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart2,
  Award,
  Bell,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

const MOBILE_NAV = {
  learner: [
    { to: "/learn", icon: LayoutDashboard, labelKey: "nav.trainingShort" },
    { to: "/learn/certificates", icon: Award, labelKey: "nav.certsShort" },
  ],
  lead: [
    { to: "/lead", icon: LayoutDashboard, labelKey: "nav.dashboardShort" },
    { to: "/lead/notifications", icon: Bell, labelKey: "nav.alertsShort" },
  ],
  admin: [
    { to: "/admin", icon: LayoutDashboard, labelKey: "nav.overview" },
    { to: "/admin/modules", icon: BookOpen, labelKey: "nav.modules" },
    { to: "/admin/learners", icon: Users, labelKey: "nav.learners" },
    { to: "/admin/stats", icon: BarChart2, labelKey: "nav.statsShort" },
    { to: "/admin/notifications", icon: Bell, labelKey: "nav.alertsShort" },
  ],
  super_admin: [
    { to: "/admin", icon: LayoutDashboard, labelKey: "nav.overview" },
    { to: "/admin/modules", icon: BookOpen, labelKey: "nav.modules" },
    { to: "/admin/learners", icon: Users, labelKey: "nav.learners" },
    { to: "/admin/stats", icon: BarChart2, labelKey: "nav.statsShort" },
    { to: "/admin/notifications", icon: Bell, labelKey: "nav.alertsShort" },
  ],
};

export function BottomNav() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const role = currentUser?.role || "learner";
  const navItems = MOBILE_NAV[role] || MOBILE_NAV.learner;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40 safe-area-bottom">
      <div className="flex items-stretch">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={
              item.to === "/admin" ||
              item.to === "/lead" ||
              item.to === "/learn"
            }
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5",
                "text-xs font-medium transition-colors min-h-[56px]",
                isActive ? "text-primary" : "text-gray-400"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={cn(isActive ? "text-primary" : "text-gray-400")}
                />
                <span className="text-[10px]">{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
