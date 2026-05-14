import { getClosedValues, getStatusField } from "../domain/moduleConfig";

export type SemaforoState = { label: string; color: string; order: number };

export interface WeekInfo {
  number: number;
  label: string;
  startDateStr: string;
  endDateStr: string;
  rangeLabel: string;
  monthLabel: string;
}

type RecordLike = Record<string, any>;

const pad2 = (n: number) => n.toString().padStart(2, "0");

export const hoy = () => new Date().toISOString().slice(0, 10);
export const ahora = () => new Date().toISOString();

export const genId = (prefix = "id") => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    if (typeof crypto.getRandomValues === "function") {
      const arr = new Uint32Array(3);
      crypto.getRandomValues(arr);
      return `${prefix}_${arr[0].toString(36)}-${arr[1].toString(36)}-${arr[2].toString(36)}`;
    }
  }
  return `${prefix}_${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  return isValidDateParts(Number(year), Number(month), Number(day));
}

export function isValidDateCL(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const [, day, month, year] = match;
  return isValidDateParts(Number(year), Number(month), Number(day));
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function formatDateCL(value?: string): string {
  if (!value) return "";
  if (value.includes("/")) return value;
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  if (!isValidIsoDate(`${year}-${month}-${day}`)) return value;
  return `${day}/${month}/${year}`;
}

export function parseDateCL(value: string): string {
  const clean = value.trim();
  const parts = clean.split("/");
  if (parts.length !== 3) return clean;
  const [day, month, year] = parts;
  const normalized = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return isValidIsoDate(normalized) ? normalized : "";
}

export const toDDMMYYYY = (iso: string) => formatDateCL(iso);

export function durMesesEntre(ini: string, fin: string): number {
  if (!ini || !fin) return 0;
  const d1 = new Date(ini);
  const d2 = new Date(fin);
  const m = Math.round(((d2.getTime() - d1.getTime()) / (365.25 * 24 * 3600 * 1000)) * 12);
  return m > 0 ? m : 1;
}

export function semaforo(fechaLimite: string, today = hoy()): SemaforoState {
  if (!fechaLimite) return { label: "Sin fecha", color: "#9CA3AF", order: 10 };
  const hoyDate = new Date(today);
  const f = new Date(fechaLimite.slice(0, 10));
  const diff = Math.ceil((f.getTime() - hoyDate.getTime()) / 86400000);
  if (diff < 0) return { label: "Vencido", color: "#DC2626", order: 1 };
  if (diff === 0) return { label: "Vence hoy", color: "#EA580C", order: 2 };
  if (diff <= 3) return { label: "1-3 días", color: "#F59E0B", order: 3 };
  if (diff <= 7) return { label: "4-7 días", color: "#FBBF24", order: 4 };
  return { label: "Sin urgencia", color: "#16A34A", order: 5 };
}

export function getWeeksForYear(year: number): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  for (let w = 1; w <= 53; w++) {
    const monday = new Date(firstMonday.getTime() + (w - 1) * 7 * 86400000);
    const sunday = new Date(monday.getTime() + 6 * 86400000);
    if (monday.getFullYear() > year && w > 52) break;
    const fmt = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    const fmtISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const wednesday = new Date(monday.getTime() + 2 * 86400000);
    weeks.push({
      number: w,
      label: `Semana ${w}`,
      startDateStr: fmtISO(monday),
      endDateStr: fmtISO(sunday),
      rangeLabel: `${fmt(monday)} - ${fmt(sunday)}`,
      monthLabel: monthNames[wednesday.getMonth()]
    });
  }
  return weeks;
}

export function normalizarReclutamientoXLSX(val: string, campo: string): string {
  if (!val) return "";
  const v = val.trim();
  if (v.toUpperCase() === "SI") return "Sí";
  if (v.toUpperCase() === "NO") return "No";
  if (campo === "reclutamiento" && v.toLowerCase().includes("prompci")) return "Promoción interna";
  if (campo === "proceso") return v.replace(/\s+$/, "");
  return v;
}

export function normalizeDateFromXlsx(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (Number.isNaN(date.getTime())) return "";
    const iso = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    return isValidIsoDate(iso) ? iso : "";
  }
  const s = String(value).trim();
  if (!s) return "";
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    return isValidIsoDate(iso) ? iso : "";
  }
  const ymd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(s);
  if (ymd) {
    const iso = `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
    return isValidIsoDate(iso) ? iso : "";
  }
  return "";
}

export function parseXlsxNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/[$.,\s]/g, "").replace(",", "."));
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return n;
}

export function parseXlsxMoney(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export function normalizeYesNo(value: unknown): string {
  if (!value) return "";
  const v = String(value).trim().toUpperCase();
  if (v === "SI" || v === "SÍ" || v === "YES" || v === "S") return "Sí";
  if (v === "NO" || v === "N") return "No";
  return String(value).trim();
}

export function normalizeReclutamientoCampo(value: unknown, campo: string): string {
  if (!value) return "";
  const v = String(value).trim();
  if (campo === "reclutamiento" && v.toLowerCase().includes("prompci")) return "Promoción interna";
  if (campo === "proceso") return v.replace(/\s+$/, "");
  if (["procesoBuk", "publicado", "cvSeleccionadoBuk", "seleccionado", "firmaCartaOferta"].includes(campo)) return normalizeYesNo(v);
  return v;
}

export function isClosedRecord(row: RecordLike | null | undefined, moduleKey: string): boolean {
  if (!row) return false;
  const statusField = getStatusField(moduleKey);
  if (statusField) {
    const closedValues = getClosedValues(moduleKey);
    if (closedValues.includes(String(row[statusField]))) return true;
  }
  switch (moduleKey) {
    case "cursos":
      return ["Cerrado", "Ejecutado"].includes(String(row.estado));
    case "ocs":
      return row.estadoOC === "Cerrada" || row.estadoOC === "Emitida" || row.estadoOC === "Enviada proveedor";
    case "practicantes":
      return row.estado === "Finalizado";
    case "procesos":
      return ["Cerrado", "Finalizado", "Completado"].includes(String(row.estadoActual));
    case "diplomas":
      return row.etapa === "Completado" || row.estadoBUK === "Subido";
    case "evaluaciones":
    case "evaluacionesPsicolaborales":
      return row.estado === "Cerrada";
    default:
      return false;
  }
}

export function isTableRowClosed(row: RecordLike, closedState?: string): boolean {
  if (!closedState) return false;
  if (row.estado === closedState || row.estadoOC === closedState || row.estadoBUK === closedState || row.proceso === closedState) return true;
  if (row.etapa === "Completado" || row.estadoBUK === "Subido") return true;
  if (["Cerrado", "Desistido"].includes(String(row.proceso))) return true;
  return ["Cerrado", "Cerrada", "Completado", "Finalizado"].includes(String(row.estado));
}

export function markRecordClosed<T extends RecordLike>(modulo: string, item: T, closedState: string, today = hoy()): T {
  if (modulo === "diplomas" && closedState === "Subido") {
    return {
      ...item,
      etapa: "Completado",
      estadoBUK: "Subido",
      fechaSubidaBUK: today,
      bloqueadoPor: "Sin bloqueo",
      ultimaActualizacion: today
    };
  }
  const baseUpdate = { ...item, ultimaActualizacion: today };
  const statusField = getStatusField(modulo);
  if (statusField) return { ...baseUpdate, [statusField]: closedState };
  return { ...baseUpdate, estado: closedState };
}

export function duplicateRecord<T extends RecordLike>(modulo: string, item: T, id: string, today = hoy()): T {
  let extraFields: RecordLike;
  if (modulo === "cargaSemanal") {
    extraFields = {
      semana: item.semana ? `${String(item.semana)} (copia)` : "",
      comentario: item.comentario ? `${String(item.comentario)} (Copia de registro anterior)` : "Copia de registro anterior"
    };
  } else if (modulo === "reclutamiento") {
    extraFields = {
      observaciones: item.observaciones ? `${String(item.observaciones)} (Copia de registro anterior)` : "Copia de registro anterior"
    };
  } else {
    extraFields = {
      curso: item.curso ? `${String(item.curso)} (copia)` : item.curso,
      nombre: item.nombre ? `${String(item.nombre)} (copia)` : item.nombre,
      cargo: item.cargo ? `${String(item.cargo)} (copia)` : item.cargo,
      contacto: item.contacto ? `${String(item.contacto)} (copia)` : item.contacto
    };
  }
  return {
    ...item,
    id,
    ultimaActualizacion: today,
    ...extraFields
  };
}

export function createDataToSave<T extends { meta: RecordLike }>(data: T, timestamp = ahora()): T {
  return {
    ...data,
    meta: {
      ...data.meta,
      actualizado: timestamp
    }
  };
}
