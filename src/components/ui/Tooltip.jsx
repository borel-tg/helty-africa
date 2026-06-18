import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

export function TooltipProvider({ children, delayDuration = 200 }) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({ children, ...props }) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

export function TooltipTrigger({ className, ...props }) {
  return (
    <TooltipPrimitive.Trigger
      className={cn("inline-flex", className)}
      {...props}
    />
  );
}

export function TooltipContent({
  className,
  sideOffset = 6,
  collisionPadding = 12,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-[100] max-w-[min(14rem,calc(100vw-2rem))] rounded-lg bg-gray-900 px-2.5 py-2 text-left text-[11px] leading-snug text-white shadow-lg",
          "will-change-[transform,opacity]",
          "data-[state=delayed-open]:animate-tooltip-in data-[state=instant-open]:animate-tooltip-in",
          "data-[state=closed]:animate-tooltip-out",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
