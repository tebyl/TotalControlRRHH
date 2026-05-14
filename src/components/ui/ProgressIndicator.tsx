
interface ProgressIndicatorProps {
  percentage: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
  animated?: boolean;
}

const variantColors: Record<string, { bg: string; bar: string }> = {
  default: { bg: "bg-slate-200", bar: "bg-blue-500" },
  success: { bg: "bg-emerald-100", bar: "bg-emerald-500" },
  warning: { bg: "bg-amber-100", bar: "bg-amber-500" },
  danger: { bg: "bg-red-100", bar: "bg-red-500" },
};

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  percentage,
  label,
  size = "md",
  variant = "default",
  showLabel = true,
  animated = true,
}: ProgressIndicatorProps) {
  const colors = variantColors[variant];
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{label || "Progreso"}</span>
          <span className="text-sm font-semibold text-slate-600">{clampedPercentage}%</span>
        </div>
      )}
      <div className={`w-full ${colors.bg} rounded-full overflow-hidden`}>
        <div
          className={`${sizeMap[size]} ${colors.bar} rounded-full transition-all ${animated ? "duration-500" : ""}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  percentage: number;
  label?: string;
  size?: number;
  variant?: "default" | "success" | "warning" | "danger";
}

export function CircularProgress({ percentage, label, size = 120, variant = "default" }: CircularProgressProps) {
  const colors = variantColors[variant];
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const barColor = colors.bar.replace("bg-", "").split("-")[0];
  const colorMap: Record<string, string> = {
    blue: "#3B82F6",
    emerald: "#10B981",
    amber: "#F59E0B",
    red: "#EF4444",
  };
  const strokeColor = colorMap[barColor] || "#3B82F6";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-800">{percentage}%</div>
        {label && <div className="text-xs text-slate-500">{label}</div>}
      </div>
    </div>
  );
}
