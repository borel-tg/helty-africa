import { cn } from "../../lib/utils";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm",
  secondary:
    "bg-secondary text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-sm",
  outline:
    "border border-primary text-primary bg-transparent hover:bg-primary-50",
  ghost: "text-text-primary bg-transparent hover:bg-gray-100",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
  "danger-outline":
    "border border-red-400 text-red-600 bg-transparent hover:bg-red-50",
};

const sizes = {
  xs: "px-2.5 py-1.5 text-xs rounded",
  sm: "px-3 py-2 text-sm rounded-btn",
  md: "px-4 py-2.5 text-sm rounded-btn",
  lg: "px-6 py-3 text-base rounded-btn",
  xl: "px-8 py-4 text-base rounded-btn",
  icon: "p-2 rounded-btn",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "min-h-[44px] min-w-[44px]", // touch target
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        loading && "cursor-wait",
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
