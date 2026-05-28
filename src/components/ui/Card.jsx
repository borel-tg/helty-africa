import { cn } from "../../lib/utils";

export function Card({ children, className, onClick, hover = false, ...props }) {
  return (
    <div
      className={cn(
        "bg-white rounded-card shadow-card",
        hover &&
          "cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.01]",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn("px-5 py-4 border-b border-gray-100", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-card",
        className
      )}
    >
      {children}
    </div>
  );
}
