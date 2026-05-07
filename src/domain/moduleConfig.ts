import type { DataModuleKey } from "./types";

type ModuleConfig = {
  label: string;
  statusField?: string;
  closedValue?: string;
  closedValues?: string[];
};

export const MODULE_CONFIG = {
  cursos: {
    label: "Cursos",
    statusField: "estado",
    closedValue: "Cerrado",
    closedValues: ["Cerrado", "Ejecutado"],
  },
  ocs: {
    label: "Órdenes de compra",
    statusField: "estadoOC",
    closedValue: "Cerrada",
    closedValues: ["Cerrada", "Emitida", "Enviada proveedor"],
  },
  practicantes: {
    label: "Practicantes",
    statusField: "estado",
    closedValue: "Finalizado",
    closedValues: ["Finalizado"],
  },
  procesos: {
    label: "Procesos",
    statusField: "estadoActual",
    closedValue: "Cerrado",
    closedValues: ["Cerrado", "Finalizado", "Completado"],
  },
  diplomas: {
    label: "Diplomas",
    statusField: "estadoBUK",
    closedValue: "Subido",
    closedValues: ["Subido"],
  },
  evaluacionesPsicolaborales: {
    label: "Evaluaciones psicolaborales",
    statusField: "estado",
    closedValue: "Cerrada",
    closedValues: ["Cerrada"],
  },
  reclutamiento: {
    label: "Reclutamiento",
    statusField: "proceso",
    closedValue: "Cerrado",
    closedValues: ["Cerrado", "Desistido"],
  },
  valesGas: {
    label: "Vales de gas",
    statusField: "estado",
    closedValue: "Cerrado",
    closedValues: ["Cerrado", "Detenido"],
  },
  valesGasOrganizacion: {
    label: "Vales gas organización",
  },
  presupuesto: {
    label: "Presupuesto",
  },
  cargaSemanal: {
    label: "Carga semanal",
  },
  contactos: {
    label: "Contactos",
  },
} satisfies Record<DataModuleKey, ModuleConfig>;

export function getModuleConfig(moduleKey: string): ModuleConfig | undefined {
  return MODULE_CONFIG[moduleKey as DataModuleKey];
}

export function getStatusField(moduleKey: string): string | undefined {
  return getModuleConfig(moduleKey)?.statusField;
}

export function getClosedValue(moduleKey: string): string | undefined {
  return getModuleConfig(moduleKey)?.closedValue;
}

export function getClosedValues(moduleKey: string): string[] {
  const config = getModuleConfig(moduleKey);
  if (!config) return [];
  return config.closedValues ?? (config.closedValue ? [config.closedValue] : []);
}
