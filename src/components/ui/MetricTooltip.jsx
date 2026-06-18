import { Info } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./Tooltip";

export function MetricTooltip({ content, className }) {
  if (!content) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          "inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0",
          "text-text-secondary/70 hover:text-primary hover:bg-primary/5",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          className,
        )}
        aria-label={content}
      >
        <Info size={14} strokeWidth={2.5} aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function MetricLabel({ children, tooltip, className, ...props }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center gap-1", className)}
      {...props}
    >
      <span>{children}</span>
      {tooltip ? <MetricTooltip content={tooltip} /> : null}
    </span>
  );
}
