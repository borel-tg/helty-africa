import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { MOCK_NOTIFICATIONS, MOCK_MODULES } from "../../lib/mockData";
import { formatTimeAgo } from "../../lib/utils";
import { cn } from "../../lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-text-secondary mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-text-secondary">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => markRead(n._id)}
              className={cn(
                "bg-white rounded-card shadow-card p-4 cursor-pointer hover:shadow-md transition-all",
                !n.read && "border-l-4 border-primary"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  !n.read ? "bg-primary-50" : "bg-gray-100"
                )}>
                  <Bell size={18} className={!n.read ? "text-primary" : "text-gray-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-semibold">{n.learnerName}</span> passed{" "}
                    <span className="font-semibold">{n.moduleName}</span> with a score of{" "}
                    <span className="font-bold text-primary">{n.score}%</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-1">{formatTimeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email notification settings per module */}
      <div className="mt-8 bg-white rounded-card shadow-card p-5">
        <h3 className="text-base font-semibold text-text-primary mb-4">Email Notification Settings</h3>
        <div className="space-y-3">
          {MOCK_MODULES.filter((m) => m.status === "published").map((mod) => (
            <div key={mod._id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-text-primary">{mod.title}</p>
                <p className="text-xs text-text-secondary">Get emailed when a learner passes this module</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
