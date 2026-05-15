import {
  Award,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  ContactRound,
  FileText,
  Fuel,
  GraduationCap,
  Hourglass,
  House,
  LayoutDashboard,
  Settings,
  Settings2,
  Sun,
  UserRound,
  UserRoundPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "root" | "operacion" | "personas" | "documentos" | "finanzas" | "sistema";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
}

export interface NavSection {
  group: NavGroup;
  label?: string;
  items: NavItem[];
}

export const GROUP_ACCENT: Record<NavGroup, string> = {
  root:       "#94a3b8",
  operacion:  "#f59e0b",
  personas:   "#22d3ee",
  documentos: "#a78bfa",
  finanzas:   "#34d399",
  sistema:    "#94a3b8",
};

export const NAV_SECTIONS: NavSection[] = [
  {
    group: "root",
    items: [
      { id: "inicio", label: "Inicio", icon: House },
    ],
  },
  {
    group: "operacion",
    label: "Operación",
    items: [
      { id: "midia",       label: "Mi Día",           icon: Sun },
      { id: "dashboard",   label: "Dashboard",         icon: LayoutDashboard },
      { id: "cursos",      label: "Cursos / DNC",      icon: GraduationCap },
      { id: "ocs",         label: "OCs Pendientes",    icon: FileText },
      { id: "procesos",    label: "Procesos Pend.",    icon: Hourglass },
    ],
  },
  {
    group: "personas",
    label: "Personas",
    items: [
      { id: "practicantes",   label: "Practicantes",   icon: UserRound },
      { id: "evaluaciones",   label: "Evaluaciones",   icon: ClipboardCheck },
      { id: "reclutamiento",  label: "Reclutamiento",  icon: UserRoundPlus },
      { id: "contactos",      label: "Contactos",      icon: ContactRound },
    ],
  },
  {
    group: "documentos",
    label: "Documentos",
    items: [
      { id: "diplomas", label: "Diplomas/Cert/Lic", icon: Award },
    ],
  },
  {
    group: "finanzas",
    label: "Finanzas",
    items: [
      { id: "presupuesto",   label: "Presupuesto",    icon: Wallet },
      { id: "valesGas",      label: "Vales de Gas",   icon: Fuel },
      { id: "cargaSemanal",  label: "Carga Semanal",  icon: CalendarRange },
    ],
  },
  {
    group: "sistema",
    label: "Sistema",
    items: [
      { id: "configuracion", label: "Configuración", icon: Settings },
      { id: "admin",         label: "Administración", icon: Settings2 },
      { id: "guia",          label: "Guía de uso",    icon: BookOpen },
    ],
  },
];
