import { ReactNode } from "react";

interface ResponsiveCardProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string | number;
  metrics?: Array<{ label: string; value: string | number }>;
  actions?: Array<{ label: string; icon?: string; onClick: () => void }>;
  onClick?: () => void;
  variant?: "default" | "compact" | "featured";
  status?: "idle" | "loading" | "success" | "error";
}

export function ResponsiveCard({
  icon,
  title,
  subtitle,
  value,
  metrics,
  actions,
  onClick,
  variant = "default",
  status = "idle",
}: ResponsiveCardProps) {
  const variants = {
    default: "p-4",
    compact: "p-3",
    featured: "p-6",
  };

  const statusStyles = {
    idle: "border-slate-200",
    loading: "border-blue-200 bg-blue-50",
    success: "border-emerald-200 bg-emerald-50",
    error: "border-red-200 bg-red-50",
  };

  return (
    <div
      className={`bg-white border rounded-xl ${variants[variant]} ${statusStyles[status]} transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-md active:shadow-none" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {icon && <div className="text-2xl flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Value */}
      {value && <div className="text-2xl font-bold text-slate-800 mb-2">{value}</div>}

      {/* Metrics */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-slate-50 rounded p-2">
              <p className="text-xs text-slate-500">{metric.label}</p>
              <p className="text-sm font-semibold text-slate-700">{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ResponsiveGridProps {
  columns?: { sm: number; md: number; lg: number };
  gap?: "sm" | "md" | "lg";
  children: ReactNode;
}

const gapMap = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

export function ResponsiveGrid({
  columns = { sm: 1, md: 2, lg: 3 },
  gap = "md",
  children,
}: ResponsiveGridProps) {
  const gridClass = `grid grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} ${gapMap[gap]}`;

  return <div className={gridClass}>{children}</div>;
}

interface TouchFriendlyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base md:px-6 md:py-4",
};

const variantStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100",
};

export function TouchFriendlyButton({
  children,
  onClick,
  size = "md",
  variant = "primary",
  disabled,
  fullWidth,
  icon,
}: TouchFriendlyButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeStyles[size]} ${variantStyles[variant]} font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 justify-center ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
