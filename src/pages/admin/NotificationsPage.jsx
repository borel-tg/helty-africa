import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexSession } from "../../hooks/useConvexSession";
import { formatTimeAgo } from "../../lib/utils";
import { cn } from "../../lib/utils";

export default function NotificationsPage() {
  const { convexUser } = useConvexSession();
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const notifications = useQuery(
    api.notifications.listEnrichedForRecipient,
    convexUser?._id ? { recipientId: convexUser._id } : "skip"
  );

  if (!notifications) {
    return <div className="p-6 text-center text-text-secondary">Loading…</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
        <button
          type="button"
          onClick={() =>
            convexUser?._id &&
            markAllRead({ recipientId: convexUser._id })
          }
          className="text-sm text-primary hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="bg-white rounded-card shadow-card divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <p className="p-8 text-center text-text-secondary">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              type="button"
              onClick={() => markRead({ notificationId: n._id })}
              className={cn(
                "w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors",
                !n.read && "bg-primary-50"
              )}
            >
              <p className="text-sm text-text-primary">
                {n.learnerName} passed {n.moduleName} with {n.score}%
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatTimeAgo(n.createdAt)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
