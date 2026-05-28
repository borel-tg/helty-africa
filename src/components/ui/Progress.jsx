import { cn } from "../../lib/utils";

export function ProgressBar({ value = 0, max = 100, className, size = "md", color = "primary" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = { xs: "h-1", sm: "h-1.5", md: "h-2", lg: "h-3" };
  const colors = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "w-full bg-gray-100 rounded-full overflow-hidden",
        heights[size],
        className
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          colors[color] || colors.primary
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CircularProgress({ value = 0, size = 64, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2E7D64"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 300ms ease-out" }}
      />
    </svg>
  );
}
