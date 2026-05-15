import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotifications } from "../hooks/useNotifications";
import type { AppData } from "../domain/types";

// Minimal AppData with no open items → no notification expected
const emptyData: AppData = {
  cursos: [], ocs: [], practicantes: [], procesos: [],
  diplomas: [], evaluacionesPsicolaborales: [], reclutamiento: [],
  contactos: [], presupuesto: [], cargaSemanal: [], valesGas: [], valesGasOrg: [],
  meta: { version: 6, lastSaved: "" },
} as unknown as AppData;

// AppData with one overdue open item
const dataConVencido: AppData = {
  ...emptyData,
  cursos: [{ id: "c1", curso: "Excel", estado: "En curso", prioridad: "P3 Medio", fechaProximaAccion: "2000-01-01", fechaRequerida: "2000-01-01", responsableId: "", bloqueadoPor: "Sin bloqueo", observaciones: "" } as any],
};

const mockRequestPermission = vi.fn().mockResolvedValue("granted");
const mockNotification = vi.fn();
let permissionValue: NotificationPermission = "granted";

beforeEach(() => {
  mockNotification.mockClear();
  mockRequestPermission.mockClear().mockResolvedValue("granted");
  localStorage.clear();

  const NotifMock = mockNotification as any;
  NotifMock.requestPermission = mockRequestPermission;
  Object.defineProperty(NotifMock, "permission", {
    get: () => permissionValue,
    configurable: true,
  });
  vi.stubGlobal("Notification", NotifMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useNotifications", () => {
  it("no dispara si no está autenticado", () => {
    renderHook(() => useNotifications(dataConVencido, false));
    expect(mockNotification).not.toHaveBeenCalled();
  });

  it("no dispara si no hay ítems urgentes", () => {
    renderHook(() => useNotifications(emptyData, true));
    expect(mockNotification).not.toHaveBeenCalled();
  });

  it("dispara notificación con ítems vencidos cuando hay permiso", () => {
    permissionValue = "granted";
    renderHook(() => useNotifications(dataConVencido, true));
    expect(mockNotification).toHaveBeenCalledOnce();
    expect(mockNotification).toHaveBeenCalledWith(
      "Control RH — Atención requerida",
      expect.objectContaining({ body: expect.stringContaining("vencido") })
    );
  });

  it("no dispara dos veces el mismo día", () => {
    permissionValue = "granted";
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("controlrh_last_notif_date", today);
    renderHook(() => useNotifications(dataConVencido, true));
    expect(mockNotification).not.toHaveBeenCalled();
  });

  it("pide permiso si está en estado 'default'", async () => {
    permissionValue = "default";
    renderHook(() => useNotifications(dataConVencido, true));
    expect(mockRequestPermission).toHaveBeenCalledOnce();
  });

  it("no pide permiso si ya está denegado", () => {
    permissionValue = "denied";
    renderHook(() => useNotifications(dataConVencido, true));
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockNotification).not.toHaveBeenCalled();
  });
});
