import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

function Alert({ children, variant = "info", title, className = "" }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-md border p-4 ${variantClasses[variant]} ${className}`}
    >
      {title ? <p className="mb-1 text-sm font-medium">{title}</p> : null}
      <div className="text-sm">{children}</div>
    </div>
  );
}

export { Alert };
export type { AlertVariant, AlertProps };
