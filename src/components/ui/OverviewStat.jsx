import { MetricLabel } from "./MetricTooltip";
import { cn } from "../../lib/utils";

export function OverviewStat({ label, value, tooltip, highlight, className }) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-center",
        highlight ? "bg-primary-50 border border-primary-100" : "bg-gray-50",
        className,
      )}
    >
      <p className="text-lg font-bold text-text-primary tabular-nums">{value}</p>
      <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 leading-tight">
        <MetricLabel tooltip={tooltip}>{label}</MetricLabel>
      </p>
    </div>
  );
}
