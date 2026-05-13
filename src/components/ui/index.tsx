import React from "react";

// ──────────────────────────────────────────────
// KpiCard — tarjeta KPI con icono, valor y descripción
// ──────────────────────────────────────────────

type KpiVariant = "default" | "danger" | "warning" | "success" | "info" | "purple";

const kpiVariants: Record<KpiVariant, { bg: string; border: string; value: string; icon: string; label: string }> = {
  default: { bg: "bg-white", border: "border-slate-200", value: "text-slate-800", icon: "text-slate-400", label: "text-slate-500" },
  danger:  { bg: "bg-red-50", border: "border-red-200", value: "text-red-700", icon: "text-red-400", label: "text-red-600" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", value: "text-amber-700", icon: "text-amber-400", label: "text-amber-700" },
  success: { bg: "bg-emerald-50", border: "border-emerald-200", value: "text-emerald-700", icon: "text-emerald-400", label: "text-emerald-700" },
  info:    { bg: "bg-blue-50", border: "border-blue-200", value: "text-blue-700", icon: "text-blue-400", label: "text-blue-700" },
  purple:  { bg: "bg-violet-50", border: "border-violet-200", value: "text-violet-700", icon: "text-violet-400", label: "text-violet-700" },
};

export function KpiCard({
  label,
  value,
  icon,
  description,
  variant = "default",
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: string;
  description?: string;
  variant?: KpiVariant;
  onClick?: () => void;
}) {
  const v = kpiVariants[variant];
  return (
    <div
      className={`${v.bg} border ${v.border} rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-300" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && <span className={`text-xl leading-none ${v.icon}`}>{icon}</span>}
      <div className={`text-2xl font-bold leading-none ${v.value}`}>{value}</div>
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
  title,
  subtitle,
  actions,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0">
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
  title?: string;
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
