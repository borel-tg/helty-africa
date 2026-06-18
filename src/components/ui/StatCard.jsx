import { Card } from "./Card";
import { MetricLabel } from "./MetricTooltip";
import { cn } from "../../lib/utils";

/**
 * KPI stat card — supports admin, centered (lead), and compact (stats page) layouts.
 */
export function StatCard({
  label,
  value,
  tooltip,
  icon: Icon,
  color,
  iconClassName,
  sub,
  variant = "admin",
  valueClassName,
  className,
}) {
  if (variant === "centered") {
    return (
      <div
        className={cn(
          "bg-white rounded-card shadow-card p-4 text-center",
          className,
        )}
      >
        {Icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2",
              iconClassName,
            )}
          >
            <Icon size={18} className={color} />
          </div>
        )}
        <p className={cn("text-2xl font-bold text-text-primary", valueClassName)}>
          {value}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          <MetricLabel tooltip={tooltip}>{label}</MetricLabel>
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn("bg-white rounded-card shadow-card p-5", className)}
      >
        {Icon && color && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg mb-3 flex items-center justify-center",
              color,
            )}
          >
            <Icon size={16} className="text-white" />
          </div>
        )}
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          <MetricLabel tooltip={tooltip}>{label}</MetricLabel>
        </p>
      </div>
    );
  }

  if (variant === "funnel") {
    return (
      <div
        className={cn("bg-white rounded-card shadow-card p-4", className)}
      >
        <p className="text-xs text-text-secondary">
          <MetricLabel tooltip={tooltip}>{label}</MetricLabel>
        </p>
        <p className={cn("text-2xl font-bold text-text-primary", valueClassName)}>
          {value}
        </p>
      </div>
    );
  }

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-start sm:justify-between sm:text-left sm:gap-0">
        {Icon && color && (
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center order-1 sm:order-2",
              color,
            )}
          >
            <Icon size={20} className="text-white" />
          </div>
        )}
        <div className="order-2 sm:order-1">
          <p className="text-sm text-text-secondary mb-1">
            <MetricLabel tooltip={tooltip}>{label}</MetricLabel>
          </p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}
