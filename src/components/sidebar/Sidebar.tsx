import { useState } from "react";
import { ChevronLeft, Zap } from "lucide-react";
import { NAV_SECTIONS, GROUP_ACCENT, type NavSection } from "./nav-items";

interface SidebarProps {
  activeId?: string;
  onSelect?: (id: string, href?: string) => void;
  focusMode?: boolean;
  onFocusModeChange?: (next: boolean) => void;
  onQuickCapture?: () => void;
  onLogout?: () => void;
  version?: string;
  user?: { initials: string; name: string; role: string };
  className?: string;
}

const DEFAULT_USER = { initials: "TC", name: "PulsoLaboral", role: "Control Operativo" };

export function Sidebar({
  activeId = "cargaSemanal",
  onSelect,
  focusMode: controlledFocusMode,
  onFocusModeChange,
  onQuickCapture,
  onLogout,
  version,
  user = DEFAULT_USER,
  className = "",
}: SidebarProps) {
  const [internalFocus, setInternalFocus] = useState(false);
  const isControlled = controlledFocusMode !== undefined;
  const focusMode = isControlled ? controlledFocusMode : internalFocus;

  const toggleFocus = () => {
    if (isControlled) {
      onFocusModeChange?.(!focusMode);
    } else {
      setInternalFocus((v) => !v);
      onFocusModeChange?.(!focusMode);
    }
  };

  return (
    <aside
      className={`flex flex-col h-screen w-[232px] shrink-0 border-r ${className}`}
      style={{ background: "#0f1a2e", borderColor: "#1b2942", color: "#e6edf7", fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 px-[14px] py-[14px] border-b"
        style={{ borderColor: "#1b2942" }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-[12px]"
          style={{ background: "linear-gradient(135deg, #3a7afe 0%, #1e4fd8 100%)" }}
        >
          {user.initials}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: "#e6edf7" }}>
            {user.name}
          </p>
          <p className="text-[11px] leading-tight truncate mt-0.5" style={{ color: "#8493ad" }}>
            {user.role}
          </p>
        </div>

        {/* Collapse button */}
        <button
          type="button"
          aria-label="Colapsar barra lateral"
          className="flex items-center justify-center w-6 h-6 rounded-md transition-colors shrink-0"
          style={{ color: "#5d6c87" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e6edf7")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#5d6c87")}
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* ── Body ── */}
      <div
        className="flex-1 overflow-y-auto px-2 py-[10px]"
        style={{ scrollbarWidth: "none" }}
      >
        {NAV_SECTIONS.map((section: NavSection) => {
          const accent = GROUP_ACCENT[section.group];
          return (
            <div key={section.group} className="mb-1">
              {/* Section label */}
              {section.label && (
                <p
                  className="px-[10px] pt-3 pb-1.5 text-[10px] font-bold tracking-[0.12em] uppercase select-none"
                  style={{ color: accent }}
                >
                  {section.label}
                </p>
              )}

              {/* Items */}
              {section.items.map((item) => {
                const isActive = item.id === activeId;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect?.(item.id, item.href)}
                    className="w-full flex items-center gap-[11px] px-[10px] py-2 rounded-md text-left transition-colors group"
                    style={
                      isActive
                        ? { background: "#1d3fa8", color: "#ffffff" }
                        : { color: "#8493ad" }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        e.currentTarget.style.color = "#e6edf7";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#8493ad";
                      }
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2 : 1.75}
                      style={{ color: isActive ? "#ffffff" : accent, flexShrink: 0 }}
                    />
                    <span className="text-[13px] font-medium leading-none">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div
        className="border-t px-3 py-3 flex flex-col gap-[10px]"
        style={{ borderColor: "#1b2942" }}
      >
        {/* Focus mode toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-pressed={focusMode}
            onClick={toggleFocus}
            className="relative shrink-0 rounded-full transition-colors duration-200"
            style={{
              width: 28,
              height: 16,
              background: focusMode ? "#2456e0" : "#2a3650",
            }}
          >
            <span
              className="absolute top-[2px] rounded-full transition-transform duration-200"
              style={{
                width: 12,
                height: 12,
                background: "#cfd6e4",
                transform: focusMode ? "translateX(14px)" : "translateX(2px)",
              }}
            />
          </button>
          <span className="text-[12px]" style={{ color: "#8493ad" }}>
            Modo enfoque
          </span>
        </div>

        {/* Quick capture CTA */}
        <button
          type="button"
          onClick={onQuickCapture}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-[10px] text-[13px] font-semibold text-white transition-transform active:scale-[0.98]"
          style={{
            background: "linear-gradient(180deg, #2f6bff 0%, #1d4dd0 100%)",
            boxShadow: "0 4px 14px -4px rgba(47,107,255,0.6)",
          }}
        >
          <Zap size={14} strokeWidth={2} />
          + Captura rápida
        </button>

        {/* Logout + version */}
        <div className="flex items-center justify-between pt-1">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-[11px] px-1 py-0.5 rounded transition-colors"
              style={{ color: "#5d6c87" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e6edf7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5d6c87")}
            >
              Cerrar sesión
            </button>
          )}
          {version && (
            <span className="text-[10px] ml-auto" style={{ color: "#3a4a63" }}>
              v{version}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
