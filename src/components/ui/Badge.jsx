import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { STATUS_COLORS } from "../../lib/utils";

export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-primary-50 text-primary-700",
    secondary: "bg-secondary-50 text-secondary-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  const colors = STATUS_COLORS[status] || STATUS_COLORS.not_started;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        colors.bg,
        colors.text
      )}
    >
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  );
}

export function RoleBadge({ role }) {
  const { t } = useTranslation();
  const roleColors = {
    super_admin: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    lead: "bg-orange-100 text-orange-700",
    learner: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        roleColors[role] || "bg-gray-100 text-gray-700"
      )}
    >
      {t(`roles.${role}`, { defaultValue: role })}
    </span>
  );
}
