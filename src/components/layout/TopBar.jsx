import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { formatTimeAgo } from "../../lib/utils";

export function TopBar({ title, onMenuToggle }) {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const notifications = useQuery(
    api.notifications.listEnrichedForRecipient,
    currentUser?._id && (currentUser.role === "lead" || currentUser.role === "admin" || currentUser.role === "super_admin")
      ? { recipientId: currentUser._id }
      : "skip"
  );

  const markAllRead = useMutation(api.notifications.markAllRead);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showProfile]);

  const unread = (notifications ?? []).filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMarkAllRead = () => {
    if (currentUser?._id) {
      markAllRead({ recipientId: currentUser._id }).catch(() => {});
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
      <button
        className="md:hidden p-2 text-gray-500 hover:text-text-primary min-h-[44px] min-w-[44px]"
        onClick={onMenuToggle}
        aria-label={t("common.menu")}
      >
        <Menu size={20} />
      </button>

      <h1 className="text-base font-semibold text-text-primary flex-1 truncate">
        {title}
      </h1>

      <div className="relative">
        <button
          onClick={() => {
            setShowNotifs((v) => !v);
            setShowProfile(false);
          }}
          className={cn(
            "relative p-2 rounded-btn text-gray-500 hover:text-text-primary hover:bg-gray-100",
            "transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          )}
          aria-label={t("common.notifications")}
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-secondary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="fixed right-2 top-[4.25rem] w-[min(20rem,calc(100vw-1rem))] sm:absolute sm:right-0 sm:top-full sm:mt-1 sm:w-80 bg-white rounded-card shadow-modal border border-gray-100 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold">{t("common.notifications")}</h3>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                {t("common.markAllRead")}
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">
                  {t("common.noNotifications")}
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={cn(
                      "px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer",
                      !n.read && "bg-primary-50"
                    )}
                  >
                    <p className="text-sm text-text-primary">
                      {t("notifications.passedExam", {
                        name: n.learnerName,
                        module: n.moduleName,
                        score: n.score,
                      })}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatTimeAgo(n.createdAt, t)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-1" ref={profileRef}>
        <button
          type="button"
          onClick={() => {
            setShowProfile((v) => !v);
            setShowNotifs(false);
          }}
          className={cn(
            "flex items-center gap-2 rounded-btn p-1 -mr-1",
            "hover:bg-gray-100 transition-colors min-h-[44px]",
            showProfile && "bg-gray-100"
          )}
          aria-label={t("common.accountMenu")}
          aria-expanded={showProfile}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-semibold">
              {currentUser?.name?.charAt(0) || "U"}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-text-primary truncate max-w-[120px]">
            {currentUser?.name}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-gray-400 shrink-0 sm:hidden transition-transform",
              showProfile && "rotate-180"
            )}
          />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="hidden sm:flex p-1 text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
          title={t("common.logout")}
        >
          <LogOut size={16} />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-card shadow-modal border border-gray-100 z-50 py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-text-primary truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {t(`roles.${currentUser?.role}`, { defaultValue: currentUser?.role })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
            >
              <LogOut size={16} />
              {t("common.logout")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
