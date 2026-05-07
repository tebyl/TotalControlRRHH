import * as XLSX from "xlsx";
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

export function xlsxSheetToObjects(ws: XLSX.WorkSheet | null): any[] {
  if (!ws) return [];
  try {
    return XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  } catch {
    return [];
  }
}
