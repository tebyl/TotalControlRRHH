import React, { useEffect, useRef, useState as useStateUI } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

// ──────────────────────────────────────────────
// KpiCard — tarjeta KPI con icono, valor y descripción
// ──────────────────────────────────────────────

type KpiVariant = "default" | "danger" | "warning" | "success" | "info" | "purple";
type KpiSize = "hero" | "normal" | "mini";

// Solo danger/warning reciben fondo de color; el resto son blancas neutras.
// El icono conserva su color de acento para orientación visual del grupo.
const kpiVariants: Record<KpiVariant, { bg: string; border: string; value: string; iconColor: string; label: string }> = {
  default: { bg: "bg-white", border: "border-slate-200", value: "text-slate-800", iconColor: "text-slate-400", label: "text-slate-500" },
  danger:  { bg: "bg-red-50",  border: "border-red-200",  value: "text-red-700",  iconColor: "text-red-500",  label: "text-red-600" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", value: "text-amber-700", iconColor: "text-amber-500", label: "text-amber-700" },
  success: { bg: "bg-white", border: "border-slate-200", value: "text-slate-800", iconColor: "text-emerald-500", label: "text-slate-500" },
  info:    { bg: "bg-white", border: "border-slate-200", value: "text-slate-800", iconColor: "text-blue-500",    label: "text-slate-500" },
  purple:  { bg: "bg-white", border: "border-slate-200", value: "text-slate-800", iconColor: "text-violet-500", label: "text-slate-500" },
};

export function KpiCard({
  label,
  value,
  icon,
  description,
  variant = "default",
  onClick,
  size = "normal",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  variant?: KpiVariant;
  onClick?: () => void;
  size?: KpiSize;
}) {
  const v = kpiVariants[variant];
  const clickProps = onClick ? {
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } },
    role: "button" as const,
    tabIndex: 0,
  } : {};

  // Mini: fila horizontal compacta, ideal para listados de stats secundarios
  if (size === "mini") {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2.5 ${onClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}`}
        {...clickProps}
      >
        {icon && <span className={`shrink-0 ${v.iconColor}`}>{icon}</span>}
        <span className="text-[13px] text-slate-600 flex-1 leading-none">{label}</span>
        <span className={`text-sm font-bold ${v.value} tabular-nums`}>{value}</span>
      </div>
    );
  }

  // Hero: prominente, para el 1-3 KPIs críticos del fold superior
  if (size === "hero") {
    return (
      <div
        className={`${v.bg} border ${v.border} rounded-2xl p-5 flex flex-col gap-2 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-200" : ""}`}
        {...clickProps}
      >
        {icon && <span className={`${v.iconColor}`}>{icon}</span>}
        <div className={`text-4xl font-bold leading-none tabular-nums ${v.value}`}>{value}</div>
        <div className={`text-[13px] font-semibold leading-snug ${v.label}`}>{label}</div>
        {description && <div className="text-[11px] text-slate-400 leading-snug">{description}</div>}
      </div>
    );
  }

  // Normal: card estándar
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-200" : ""}`}
      {...clickProps}
    >
      {icon && <span className={`${v.iconColor}`}>{icon}</span>}
      <div className={`text-2xl font-bold leading-none tabular-nums ${v.value}`}>{value}</div>
      <div className={`text-xs font-medium leading-snug ${v.label}`}>{label}</div>
      {description && <div className="text-[11px] text-slate-400 leading-snug">{description}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────
// PageHeader — encabezado de módulo consistente
// ──────────────────────────────────────────────

export function PageHeader({
  icon,
  iconColor = "text-slate-500",
  title,
  subtitle,
  actions,
}: {
  icon?: React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 ${iconColor}`}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────
// SectionCard — contenedor de sección con título opcional
// ──────────────────────────────────────────────

export function SectionCard({
  title,
  subtitle,
  headerRight,
  children,
  noPadding,
}: {
  title?: React.ReactNode;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {title && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// EmptyState — pantalla vacía por módulo
// ──────────────────────────────────────────────

export function EmptyState({
  icon = "📋",
  title = "Sin registros",
  description,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// FormSection — separador visual de secciones en formularios
// ──────────────────────────────────────────────

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{title}</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────
// KpiGroup — grupo de KPIs con título de sección
// ──────────────────────────────────────────────

export function KpiGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// PrimaryButton / SecondaryButton — botones consistentes
// ──────────────────────────────────────────────

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  color = "blue",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  color?: "blue" | "green" | "red";
}) {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    green: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
    red: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${colors[color]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
    >
      {children}
    </button>
  );
}

// ──────────────────────────────────────────────
// ActionBar — barra de acciones de formulario (sticky bottom)
// ──────────────────────────────────────────────

export function ActionBar({
  onCancel,
  onSave,
  saveLabel = "Guardar",
  saveColor = "blue",
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveColor?: "blue" | "green";
}) {
  return (
    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-2">
      <SecondaryButton onClick={onCancel}>Cancelar</SecondaryButton>
      <PrimaryButton onClick={onSave} color={saveColor}>{saveLabel}</PrimaryButton>
    </div>
  );
}

// ──────────────────────────────────────────────
// ModuleHeader — cabecera de módulo con gradiente
// ──────────────────────────────────────────────

export function ModuleHeader({
  icon,
  gradient,
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filterPanel,
  actions,
}: {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  subtitle?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filterPanel?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
      {/* Icon + title */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shadow-black/10 shrink-0`}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {/* Right: search + filter dropdown + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {onSearchChange !== undefined && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-52 focus-within:border-blue-300 transition-colors">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              value={search ?? ""}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-transparent flex-1 text-sm text-slate-700 outline-none placeholder:text-slate-400 min-w-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
        {filterPanel}
        {actions}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// FilterPanel — dropdown de filtros compacto
// ──────────────────────────────────────────────

export function FilterPanel({
  children,
  activeCount,
  onClear,
}: {
  children: React.ReactNode;
  activeCount: number;
  onClear: () => void;
}) {
  const [open, setOpen] = useStateUI(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
          activeCount > 0
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <SlidersHorizontal size={13} className="shrink-0" />
        Filtros
        {activeCount > 0 && (
          <span className="ml-0.5 bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 min-w-[260px] space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtros</span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>
          <div className="space-y-2">{children}</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg py-2 transition-colors mt-1"
          >
            Aplicar y cerrar
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Re-export new UX-Pro-Max components
// ──────────────────────────────────────────────

export { SkeletonLoader, SkeletonCard, SkeletonTable } from "./SkeletonLoader";
export { ExpandableSection, CollapsibleForm } from "./ExpandableSection";
export { Toast, ToastContainer } from "./Toast";
export { ErrorBoundary, FormError } from "./ErrorBoundary";
export { ProgressBar, CircularProgress } from "./ProgressIndicator";
export { LoadingSpinner, PulseLoader, DotsLoader, SkeletonText } from "./LoadingAnimations";
export { Modal, ConfirmDialog } from "./EnhancedModal";
export { ResponsiveCard, ResponsiveGrid, TouchFriendlyButton } from "./ResponsiveComponents";
