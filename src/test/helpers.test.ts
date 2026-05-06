import { describe, it, expect, vi } from "vitest";

// ── Helpers copiados del módulo (sin importar App.tsx completo) ──

function formatDateCL(value?: string): string {
  if (!value) return "";
  if (value.includes("/")) return value;
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function parseDateCL(value: string): string {
  const clean = value.trim();
  const parts = clean.split("/");
  if (parts.length !== 3) return clean;
  const [day, month, year] = parts;
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function semaforo(fechaLimite: string): { label: string; color: string; order: number } {
  const hoyStr = new Date().toISOString().slice(0, 10);
  if (!fechaLimite) return { label: "Sin fecha", color: "#9CA3AF", order: 10 };
  const hoyDate = new Date(hoyStr);
  const f = new Date(fechaLimite.slice(0, 10));
  const diff = Math.ceil((f.getTime() - hoyDate.getTime()) / 86400000);
  if (diff < 0) return { label: "Vencido", color: "#DC2626", order: 1 };
  if (diff === 0) return { label: "Vence hoy", color: "#EA580C", order: 2 };
  if (diff <= 3) return { label: "1-3 días", color: "#F59E0B", order: 3 };
  if (diff <= 7) return { label: "4-7 días", color: "#FBBF24", order: 4 };
  return { label: "Sin urgencia", color: "#16A34A", order: 5 };
}

function durMesesEntre(ini: string, fin: string): number {
  if (!ini || !fin) return 0;
  const d1 = new Date(ini);
  const d2 = new Date(fin);
  const m = Math.round((d2.getTime() - d1.getTime()) / (365.25 * 24 * 3600 * 1000) * 12);
  return m > 0 ? m : 1;
}

function getWeeksForYear(year: number) {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  const weeks = [];
  for (let w = 1; w <= 53; w++) {
    const monday = new Date(firstMonday.getTime() + (w - 1) * 7 * 86400000);
    if (monday.getFullYear() > year && w > 52) break;
    weeks.push({ number: w, label: `Semana ${w}` });
  }
  return weeks;
}

// ── Tests ──

describe("formatDateCL", () => {
  it("convierte ISO a dd/mm/yyyy", () => {
    expect(formatDateCL("2026-05-15")).toBe("15/05/2026");
  });
  it("devuelve el mismo valor si ya tiene /", () => {
    expect(formatDateCL("15/05/2026")).toBe("15/05/2026");
  });
  it("devuelve string vacío para valor vacío", () => {
    expect(formatDateCL("")).toBe("");
    expect(formatDateCL(undefined)).toBe("");
  });
});

describe("parseDateCL", () => {
  it("convierte dd/mm/yyyy a ISO", () => {
    expect(parseDateCL("15/05/2026")).toBe("2026-05-15");
  });
  it("rellena zeros en día y mes cortos", () => {
    expect(parseDateCL("5/3/2026")).toBe("2026-03-05");
  });
  it("devuelve el input si no tiene formato válido", () => {
    expect(parseDateCL("sinformato")).toBe("sinformato");
  });
});

describe("semaforo", () => {
  it("retorna Sin fecha si no hay fecha", () => {
    expect(semaforo("").label).toBe("Sin fecha");
  });

  it("detecta fecha vencida", () => {
    expect(semaforo("2000-01-01").label).toBe("Vencido");
  });

  it("detecta sin urgencia para fecha futura lejana", () => {
    expect(semaforo("2099-12-31").label).toBe("Sin urgencia");
  });

  it("el orden de vencido es menor que sin urgencia", () => {
    expect(semaforo("2000-01-01").order).toBeLessThan(semaforo("2099-12-31").order);
  });
});

describe("durMesesEntre", () => {
  it("calcula meses entre dos fechas", () => {
    expect(durMesesEntre("2026-01-01", "2026-07-01")).toBeCloseTo(6, 0);
  });
  it("retorna 0 si alguna fecha está vacía", () => {
    expect(durMesesEntre("", "2026-07-01")).toBe(0);
    expect(durMesesEntre("2026-01-01", "")).toBe(0);
  });
  it("retorna mínimo 1 si las fechas son iguales", () => {
    expect(durMesesEntre("2026-01-01", "2026-01-01")).toBe(1);
  });
});

describe("getWeeksForYear", () => {
  it("genera semanas para 2026", () => {
    const weeks = getWeeksForYear(2026);
    expect(weeks.length).toBeGreaterThan(51);
    expect(weeks[0].label).toBe("Semana 1");
  });

  it("la primera semana siempre es Semana 1", () => {
    const weeks2025 = getWeeksForYear(2025);
    const weeks2026 = getWeeksForYear(2026);
    expect(weeks2025[0].number).toBe(1);
    expect(weeks2026[0].number).toBe(1);
  });

  it("no genera más de 53 semanas", () => {
    const weeks = getWeeksForYear(2026);
    expect(weeks.length).toBeLessThanOrEqual(53);
  });
});
