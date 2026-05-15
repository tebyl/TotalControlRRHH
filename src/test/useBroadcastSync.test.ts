import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBroadcastSync } from "../hooks/useBroadcastSync";
import type { AppData } from "../domain/types";

// Minimal AppData factory
const makeData = (version: number): AppData =>
  ({ cursos: [], ocs: [], practicantes: [], procesos: [], diplomas: [],
     evaluacionesPsicolaborales: [], reclutamiento: [], contactos: [],
     presupuesto: [], cargaSemanal: [], valesGas: [], valesGasOrg: [],
     meta: { version, lastSaved: "" } }) as unknown as AppData;

// BroadcastChannel mock
class MockChannel {
  static instances: MockChannel[] = [];
  name: string;
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();
  constructor(name: string) {
    this.name = name;
    MockChannel.instances.push(this);
  }
  /** Helper: simulate receiving a message from another tab */
  receive(data: unknown) {
    this.onmessage?.(new MessageEvent("message", { data }));
  }
}

beforeEach(() => {
  MockChannel.instances = [];
  vi.stubGlobal("BroadcastChannel", MockChannel);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useBroadcastSync", () => {
  it("no crea canal si no está autenticado", () => {
    const setData = vi.fn();
    renderHook(() => useBroadcastSync(makeData(1), setData, false));
    expect(MockChannel.instances).toHaveLength(0);
  });

  it("crea un BroadcastChannel al autenticarse", () => {
    const setData = vi.fn();
    renderHook(() => useBroadcastSync(makeData(1), setData, true));
    expect(MockChannel.instances).toHaveLength(1);
    expect(MockChannel.instances[0].name).toBe("controlrh-sync");
  });

  it("cierra el canal al desmontar", () => {
    const setData = vi.fn();
    const { unmount } = renderHook(() => useBroadcastSync(makeData(1), setData, true));
    const ch = MockChannel.instances[0];
    unmount();
    expect(ch.close).toHaveBeenCalledOnce();
  });

  it("llama setData al recibir DATA_UPDATED de otro tab", () => {
    const setData = vi.fn();
    const data = makeData(1);
    const incomingData = makeData(2);
    renderHook(() => useBroadcastSync(data, setData, true));
    const ch = MockChannel.instances[0];
    act(() => {
      ch.receive({ type: "DATA_UPDATED", data: incomingData, origin: "otro-tab-id" });
    });
    expect(setData).toHaveBeenCalledWith(incomingData);
  });

  it("ignora mensajes con tipo desconocido", () => {
    const setData = vi.fn();
    renderHook(() => useBroadcastSync(makeData(1), setData, true));
    const ch = MockChannel.instances[0];
    act(() => {
      ch.receive({ type: "OTRO_EVENTO", data: makeData(2), origin: "otro-tab" });
    });
    expect(setData).not.toHaveBeenCalled();
  });

  it("emite postMessage cuando cambian los datos", () => {
    const setData = vi.fn();
    const data1 = makeData(1);
    const data2 = makeData(2);
    const { rerender } = renderHook(({ d }) => useBroadcastSync(d, setData, true), {
      initialProps: { d: data1 },
    });
    const ch = MockChannel.instances[0];
    // First render may or may not post; rerender with new data definitely should
    ch.postMessage.mockClear();
    rerender({ d: data2 });
    expect(ch.postMessage).toHaveBeenCalledOnce();
    expect(ch.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "DATA_UPDATED", data: data2 })
    );
  });
});
