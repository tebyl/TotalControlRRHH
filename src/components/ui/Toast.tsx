import { ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; textColor: string }> = {
  success: { bg: "bg-green-50", border: "border-green-200", icon: "✓", textColor: "text-green-800" },
  error: { bg: "bg-red-50", border: "border-red-200", icon: "⚠", textColor: "text-red-800" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "!", textColor: "text-amber-800" },
  info: { bg: "bg-blue-50", border: "border-blue-200", icon: "ℹ", textColor: "text-blue-800" },
};

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  children?: ReactNode;
  action?: { label: string; onClick: () => void };
  onClose?: () => void;
}

export function Toast({ type, title, message, children, action, onClose }: ToastProps) {
  const style = toastStyles[type];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm animate-in slide-in-from-bottom-2 duration-300`} role="alert">
      <span className={`text-lg leading-none flex-shrink-0 ${style.textColor}`}>{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${style.textColor}`}>{title}</p>
        {message && <p className={`text-sm ${style.textColor} opacity-80 mt-0.5`}>{message}</p>}
        {children}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={`text-sm font-medium ${style.textColor} hover:opacity-70 transition-opacity flex-shrink-0 whitespace-nowrap`}
        >
          {action.label}
        </button>
      )}
      {onClose && (
        <button
          onClick={onClose}
          className={`text-sm font-medium ${style.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove?: (index: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-auto">
      {toasts.map((toast, i) => (
        <Toast key={i} {...toast} onClose={() => onRemove?.(i)} />
      ))}
    </div>
  );
}
