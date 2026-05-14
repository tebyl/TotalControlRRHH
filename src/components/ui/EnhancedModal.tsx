import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeButton?: boolean;
  onBackdropClick?: () => void;
  loading?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  closeButton = true,
  onBackdropClick,
  loading = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      // Focus trap
      setTimeout(() => dialogRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onBackdropClick?.();
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 -z-10" />

      {/* Modal */}
      <div
        ref={dialogRef}
        className={`${sizeClasses[size]} w-full bg-white rounded-2xl shadow-lg overflow-hidden modal-content`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={subtitle ? "modal-subtitle" : undefined}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p id="modal-subtitle" className="text-sm text-slate-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {closeButton && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -m-1 flex-shrink-0"
                aria-label="Cerrar diálogo"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "warning";
  loading?: boolean;
}) {
  const variantColors = {
    default: { button: "bg-blue-600 hover:bg-blue-700", icon: "text-blue-500" },
    danger: { button: "bg-red-600 hover:bg-red-700", icon: "text-red-500" },
    warning: { button: "bg-amber-600 hover:bg-amber-700", icon: "text-amber-500" },
  };

  const colors = variantColors[variant];

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm" closeButton={false}>
      <div className="text-center py-6">
        <div className={`text-4xl mb-4 ${colors.icon}`}>
          {variant === "danger" ? "⚠️" : variant === "warning" ? "❗" : "❓"}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-slate-600 mb-6">{message}</p>}
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 ${colors.button} text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2`}
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
