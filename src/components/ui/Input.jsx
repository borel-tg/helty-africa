import { cn } from "../../lib/utils";

export function Input({
  label,
  error,
  helperText,
  className,
  leftIcon,
  rightIcon,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-gray-400">{leftIcon}</span>
        )}
        <input
          className={cn(
            "w-full border border-gray-200 rounded-input px-3 py-2.5 text-base text-text-primary",
            "bg-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "transition-colors duration-150",
            "min-h-[44px]",
            error && "border-red-400 focus:ring-red-400",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-gray-400">{rightIcon}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
}

export function Select({ label, error, helperText, className, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <select
        className={cn(
          "w-full border border-gray-200 rounded-input px-3 py-2.5 text-base text-text-primary",
          "bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "transition-colors duration-150 min-h-[44px]",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
}

export function Textarea({ label, error, helperText, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <textarea
        className={cn(
          "w-full border border-gray-200 rounded-input px-3 py-2.5 text-base text-text-primary",
          "bg-white placeholder-gray-400 resize-y",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "transition-colors duration-150",
          error && "border-red-400",
          className
        )}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
}
