import type { AppData } from "../domain/types";

export interface XlsxParseResult {
  hojas: Array<{
    nombre: string;
    modulo: string;
    total: number;
    validos: number;
    advertencias: number;
    errores: number;
    registros: any[];
    erroresList: string[];
    advertenciasList: string[];
  }>;
  contactosNuevos: any[];
  parsedData: Partial<AppData>;
  tieneErroresCriticos: boolean;
}

export function xlsxSheetToObjects(
  ws: unknown,
  utils: { sheet_to_json: (sheet: any, opts: { defval: string; raw: boolean }) => any[] }
): any[] {
  if (!ws) return [];
  try {
    return utils.sheet_to_json(ws, { defval: "", raw: false });
  } catch {
    return [];
  }
}
