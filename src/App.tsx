import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Badge, SemaforoBadge, prioridadColor, estadoColor } from "./shared/badges";
import { FilterBar, SemaforoItem } from "./shared/filterBar";
import { validateGeneral, notifyValidationError, FormMessages, SelectContact, isValidEmail, isValidPhone, isValidRut } from "./shared/formHelpers";
import type { VError, ConfirmState, ToastType, ToastItem } from "./shared/formTypes";
import { fmtCLP, resolveResponsable, getResponsableName } from "./shared/dataHelpers";
import { calcReclutamientoAvance, calcPctRecl } from "./shared/reclutamientoHelpers";
import { useForm } from "./hooks/useForm";
import { FormCursos } from "./forms/FormCursos";
import { FormOCs } from "./forms/FormOCs";
import { FormPracticantes } from "./forms/FormPracticantes";
import { FormPresupuesto } from "./forms/FormPresupuesto";
import { FormProcesos } from "./forms/FormProcesos";
import { FormDiplomas } from "./forms/FormDiplomas";
import { FormEvaluaciones } from "./forms/FormEvaluaciones";
import { FormCargaSemanal } from "./forms/FormCargaSemanal";
import { FormContactos } from "./forms/FormContactos";
import { FormCapturaRapida } from "./forms/FormCapturaRapida";
import { FormValesGas } from "./forms/FormValesGas";
import { FormValeGasOrg } from "./forms/FormValeGasOrg";
import { FormReclutamiento } from "./forms/FormReclutamiento";
import { Badge, SemaforoBadge, prioridadColor, estadoColor } from "./shared/badges";
import { FilterBar, SemaforoItem } from "./shared/filterBar";
import { validateGeneral, notifyValidationError, FormMessages, SelectContact, isValidEmail, isValidPhone, isValidRut } from "./shared/formHelpers";
import type { VError, ConfirmState, ToastType, ToastItem } from "./shared/formTypes";
import { fmtCLP, resolveResponsable, getResponsableName } from "./shared/dataHelpers";
import { calcReclutamientoAvance, calcPctRecl } from "./shared/reclutamientoHelpers";
import { useForm } from "./hooks/useForm";
import { FormCursos } from "./forms/FormCursos";
import { FormOCs } from "./forms/FormOCs";
import { FormPracticantes } from "./forms/FormPracticantes";
import { FormPresupuesto } from "./forms/FormPresupuesto";
import { FormProcesos } from "./forms/FormProcesos";
import { FormDiplomas } from "./forms/FormDiplomas";
import { FormEvaluaciones } from "./forms/FormEvaluaciones";
import { FormCargaSemanal } from "./forms/FormCargaSemanal";
import { FormContactos } from "./forms/FormContactos";
import { FormCapturaRapida } from "./forms/FormCapturaRapida";
import { FormValesGas } from "./forms/FormValesGas";
import { FormValeGasOrg } from "./forms/FormValeGasOrg";
import { FormReclutamiento } from "./forms/FormReclutamiento";
import { cn } from "./utils/cn";
import {
  ahora,
  createDataToSave,
  duplicateRecord,
  durMesesEntre,
  genId,
  getWeeksForYear,
  hoy,
  isClosedRecord,
  markRecordClosed,
  normalizeDateFromXlsx,
  normalizeReclutamientoCampo,
  normalizeYesNo,
  parseXlsxMoney,
  parseXlsxNumber,
  semaforo,
  toDDMMYYYY,
} from "./utils/appHelpers";
import type {
  AppData,
  BackupItem,
  CargaSemanal,
  Contacto,
  Curso,
  Diploma,
  Evaluacion,
  ModuloKey,
  OC,
  Practicante,
  Proceso,
  ProcesoReclutamiento,
  ValeGas,
  ValeGasOrg,
} from "./domain/types";
import {
  BLOQUEOS,
  CATEGORIAS_OC,
  ESTADOS_BUK,
  ESTADOS_CURSO,
  ESTADOS_DIPLOMA,
  ESTADOS_EVALUACION,
  ESTADOS_OC,
  ESTADOS_PRACTICANTE,
  ESTADOS_PROCESO_RECLUTAMIENTO,
  ESTADOS_VALE_GAS,
  ETAPAS_COMPLETADAS_VALUES,
  ETAPAS_NO_APLICA_VALUES,
  ETAPAS_RECLUTAMIENTO,
  MESES,
  OPTS_CARTA_OFERTA,
  OPTS_ENTREVISTA,
  OPTS_ENVIO_CARTA,
  OPTS_PROCESO_BUK,
  OPTS_REVISADO_PPTO,
  OPTS_SELECCION_CV,
  OPTS_SI_NO,
  OPTS_TEST,
  ORIGENES_CURSO,
  PLANTAS_CENTROS,
  PRIORIDADES,
  RELACIONES,
  RESULTADOS_EVALUACION,
  TIPOS_CAPTURA,
  TIPOS_DOCUMENTO,
  TIPOS_EVALUACION,
  TIPOS_MOVIMIENTO_VALES,
  TIPOS_PROCESO,
  TIPOS_RECLUTAMIENTO,
  TIPOS_VACANTE,
} from "./domain/options";
import { ensureBudgetRows } from "./domain/budget";
import { createBackup, getLocalBackups, saveLocalBackups } from "./storage/backupStorage";
import { readStorageJSON, removeStorageKey, saveAppData, writeStorageJSON, STORAGE_KEY } from "./storage/localStorage";
import { migrateData } from "./storage/migrations";
import {
  cachePassphrase,
  clearCachedPassphrase,
  decryptAppData,
  encryptAppData,
  getCachedPassphrase,
  isEncryptedPayload,
  type EncryptedPayload,
} from "./storage/encryption";
import { createJsonBlob } from "./importExport/jsonExport";
import { buildExportSheets } from "./importExport/xlsxExport";
import { xlsxSheetToObjects, type XlsxParseResult } from "./importExport/xlsxImport";
import { DataTable as Table } from "./components/tables/DataTable";
import { DateInput } from "./components/forms/DateInput";
import { Field, Input, Select, Textarea, INPUT_BASE } from "./components/forms/fields";
import {
  ConfirmDialog,
  ErrorBoundary,
  ExpandableSection,
  KpiCard as KpiCardUI,
  KpiGroup,
  LoadingSpinner,
  Modal,
  PageHeader,
  SectionCard,
  SkeletonCard,
  SkeletonTable,
  ToastContainer,
} from "./components/ui";
import { login as authLogin, getSession, logout as authLogout, refreshSession } from "./auth/authService";
import { can } from "./auth/permissions";
import { logAudit } from "./audit/auditService";
import { ValidatedInput } from "./components/forms/ValidatedForm";

const ChartsPanel = React.lazy(() => import("./components/dashboard/ChartsPanel"));

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────

let xlsxModule: typeof import("xlsx") | null = null;
const getXlsx = async () => {
  if (!xlsxModule) {
    xlsxModule = await import("xlsx");
  }
  return xlsxModule;
};
// SAMPLE DATA
// ──────────────────────────────────────────────

function crearDatosEjemplo(): AppData {
  const today = hoy();
  const d = (offset: number) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };
  
  const contactos: Contacto[] = [
    { id: genId(), nombre: "Ana Control", rol: "Coordinadora Operativa", areaEmpresa: "Operaciones", correo: "ana.control@empresa.cl", telefono: "+56911111111", relacion: "Interno", activo: "Sí", observaciones: "Responsable principal" },
    { id: genId(), nombre: "María Silva", rol: "Jefa Operaciones", areaEmpresa: "Operaciones", correo: "msilva@empresa.cl", telefono: "+56912345678", relacion: "Jefatura", activo: "Sí", observaciones: "Aprueba cursos" },
    { id: genId(), nombre: "OTEC ProCaps", rol: "Coordinador", areaEmpresa: "OTEC ProCaps", correo: "contacto@procaps.cl", telefono: "+56222333444", relacion: "OTEC", activo: "Sí", observaciones: "Proveedor principal" },
    { id: genId(), nombre: "Psic. Laura González", rol: "Psicóloga", areaEmpresa: "Evaluaciones Pro", correo: "laura@evalpro.cl", telefono: "+56922233344", relacion: "Psicólogo / Proveedor evaluación", activo: "Sí", observaciones: "Evaluaciones psicolaborales" },
  ];
  const anaId = contactos[0].id;

  return {
    cursos: [
      { id: genId(), curso: "Liderazgo y Gestión de Equipos", origen: "DNC", area: "Operaciones", solicitante: "María Silva", fechaSolicitud: d(-30), fechaRequerida: d(-5), estado: "Pendiente revisar", prioridad: "P1 Crítico", nivelCritico: "Crítico", requiereOC: "Sí", numeroOC: "OC-0045", proveedor: "OTEC ProCaps", responsableId: anaId, proximaAccion: "Revisar cotización pendiente", fechaProximaAccion: d(-2), bloqueadoPor: "Falta cotización", ultimaActualizacion: d(-15), observaciones: "Curso DNC planificado Q1" },
      { id: genId(), curso: "Manejo de Extintores", origen: "Requerimiento legal", area: "Prevención", solicitante: "Juan Pérez", fechaSolicitud: d(-7), fechaRequerida: d(5), estado: "En cotización", prioridad: "P1 Crítico", nivelCritico: "Alto", requiereOC: "Sí", numeroOC: "", proveedor: "", responsableId: anaId, proximaAccion: "Esperar cotización OTEC", fechaProximaAccion: d(2), bloqueadoPor: "Falta cotización", ultimaActualizacion: d(-3), observaciones: "Requerimiento legal urgente" },
      { id: genId(), curso: "Excel Avanzado", origen: "Urgente no planificado", area: "Administración", solicitante: "Carla Rojas", fechaSolicitud: d(-1), fechaRequerida: d(10), estado: "En aprobación", prioridad: "P2 Alto", nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "OTEC Digital", responsableId: anaId, proximaAccion: "Confirmar participantes", fechaProximaAccion: d(7), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-1), observaciones: "Urgente, jefatura solicitó" },
    ],
    ocs: [
      { id: genId(), numeroOC: "OC-0045", categoriaOC: "Curso / Capacitación", cursoAsociado: "Liderazgo y Gestión de Equipos", proveedor: "OTEC ProCaps", monto: 1200000, fechaSolicitud: d(-25), fechaLimite: d(-5), estadoOC: "En aprobación", prioridad: "P1 Crítico", accionPendiente: "Seguir con compras", responsableId: anaId, bloqueadoPor: "Falta aprobación", ultimaActualizacion: d(-10), observaciones: "Urgente aprobar" },
      { id: genId(), numeroOC: "OC-0052", categoriaOC: "Curso / Capacitación", cursoAsociado: "Norma ISO 9001:2025", proveedor: "OTEC CalidadPlus", monto: 2500000, fechaSolicitud: d(-15), fechaLimite: d(10), estadoOC: "Solicitada", prioridad: "P3 Medio", accionPendiente: "Esperar emisión", responsableId: anaId, bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-2), observaciones: "En proceso normal" },
    ],
    practicantes: [
      { id: genId(), nombre: "Camila Vega", area: "Operaciones", especialidad: "Ing. Industrial", fechaInicio: d(-60), fechaTermino: d(120), costoMensual: 350000, estado: "Activo", responsableId: anaId, proximoPaso: "Evaluación de desempeño", fechaProximaAccion: d(14), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-1), observaciones: "Buen desempeño" },
      { id: genId(), nombre: "Diego Fuentes", area: "Administración", especialidad: "Contabilidad", fechaInicio: "", fechaTermino: "", costoMensual: 300000, estado: "Por buscar", responsableId: anaId, proximoPaso: "Publicar aviso", fechaProximaAccion: d(3), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-4), observaciones: "Reemplazo por licencia" },
    ],
    presupuesto: [
      { id: genId(), concepto: "Cursos", presupuestoTotal: 15000000, gastado: 7500000, responsableId: anaId, ultimaActualizacion: d(-1), observaciones: "50% utilizado" },
      { id: genId(), concepto: "Practicantes", presupuestoTotal: 8000000, gastado: 6400000, responsableId: anaId, ultimaActualizacion: d(-1), observaciones: "80% utilizado - ATENCIÓN" },
      { id: genId(), concepto: "Diplomas / Certificados / Licencias", presupuestoTotal: 2000000, gastado: 300000, responsableId: anaId, ultimaActualizacion: d(-5), observaciones: "Aún hay margen" },
      { id: genId(), concepto: "Evaluaciones Psicolaborales", presupuestoTotal: 3000000, gastado: 500000, responsableId: anaId, ultimaActualizacion: d(-1), observaciones: "20% utilizado" },
    ],
    procesos: [
      { id: genId(), proceso: "Subida masiva BUK Q1", tipo: "BUK", estadoActual: "Pendiente", queFalta: "Reunir todos los documentos", responsableId: anaId, fechaLimite: d(-3), riesgo: "Incumplimiento auditoría interna", prioridad: "P1 Crítico", proximaAccion: "Subir diplomas pendientes", fechaProximaAccion: d(-1), bloqueadoPor: "Falta subir a BUK", ultimaActualizacion: d(-10), observaciones: "Vencido, urgente" },
      { id: genId(), proceso: "Reclutamiento reemplazo licencia", tipo: "Reclutamiento", estadoActual: "En proceso", queFalta: "Publicar en portales", responsableId: anaId, fechaLimite: d(7), riesgo: "Quedar sin personal en área crítica", prioridad: "P2 Alto", proximaAccion: "Contactar a RRHH", fechaProximaAccion: d(1), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-4), observaciones: "" },
    ],
    diplomas: [
      { id: genId(), cursoAsociado: "Liderazgo y Gestión de Equipos", participante: "Equipo Operaciones", tipoDocumento: "Diploma", otec: "OTEC ProCaps", etapa: "Pedir a la OTEC", fechaSolicitudOTEC: "", fechaRecepcionDoc: "", fechaEnvioParticipante: "", fechaSubidaBUK: "", estadoBUK: "Pendiente subir", prioridad: "P1 Crítico", responsableId: anaId, proximaAccion: "Solicitar diplomas a OTEC", fechaProximaAccion: d(-1), bloqueadoPor: "Falta subir a BUK", ultimaActualizacion: d(-10), observaciones: "Curso ya ejecutado, faltan diplomas" },
      { id: genId(), cursoAsociado: "Excel Avanzado", participante: "Carla Rojas", tipoDocumento: "Certificado", otec: "OTEC Digital", etapa: "Enviar o pedir al participante", fechaSolicitudOTEC: d(-15), fechaRecepcionDoc: d(-5), fechaEnvioParticipante: "", fechaSubidaBUK: "", estadoBUK: "Pendiente subir", prioridad: "P2 Alto", responsableId: anaId, proximaAccion: "Enviar certificado a participante", fechaProximaAccion: d(2), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-3), observaciones: "Certificado recibido de OTEC" },
      { id: genId(), cursoAsociado: "Manejo de Extintores", participante: "Brigada Emergencia", tipoDocumento: "Licencia", otec: "OTEC SafetyFirst", etapa: "Subir a BUK", fechaSolicitudOTEC: d(-20), fechaRecepcionDoc: d(-10), fechaEnvioParticipante: d(-7), fechaSubidaBUK: "", estadoBUK: "Pendiente subir", prioridad: "P1 Crítico", responsableId: anaId, proximaAccion: "Subir licencias a BUK hoy", fechaProximaAccion: d(-2), bloqueadoPor: "Falta subir a BUK", ultimaActualizacion: d(-8), observaciones: "Documentos listos, falta sólo subir" },
    ],
    cargaSemanal: [
      { id: genId(), semana: "Semana 15", cursosPlanificados: 3, cursosUrgentesNuevos: 5, cursosNoPlanificados: 2, ocsNuevas: 3, diplomasPendientes: 4, procesosBloqueados: 2, comentario: "Semana muy cargada, más urgentes que planificados" },
      { id: genId(), semana: "Semana 14", cursosPlanificados: 2, cursosUrgentesNuevos: 3, cursosNoPlanificados: 1, ocsNuevas: 2, diplomasPendientes: 3, procesosBloqueados: 1, comentario: "Tendencia: urgentes superan planificación" },
    ],
    contactos,
    evaluacionesPsicolaborales: [
      { id: genId(), mes: "Enero", ano: 2026, cargo: "Administrativo RRHH", area: "RRHH", candidato: "Sofía Martínez", rut: "12.345.678-9", tipoEvaluacion: "Psicolaboral", proveedor: "Psic. Laura González", fechaSolicitud: d(-20), fechaEvaluacion: d(5), fechaEntregaInforme: d(10), estado: "Agendada", resultado: "Pendiente", prioridad: "P2 Alto", responsableId: anaId, costo: 150000, requiereOC: "No", numeroOC: "", proximaAccion: "Confirmar fecha evaluación", fechaProximaAccion: d(3), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-2), observaciones: "Evaluación programada" },
      { id: genId(), mes: "Enero", ano: 2026, cargo: "Supervisor de Operaciones", area: "Operaciones", candidato: "Roberto Díaz", rut: "15.678.901-2", tipoEvaluacion: "Evaluación mixta", proveedor: "Psic. Laura González", fechaSolicitud: d(-15), fechaEvaluacion: d(-3), fechaEntregaInforme: d(0), estado: "Realizada", resultado: "Pendiente", prioridad: "P1 Crítico", responsableId: anaId, costo: 200000, requiereOC: "No", numeroOC: "", proximaAccion: "Solicitar informe al psicólogo", fechaProximaAccion: d(-1), bloqueadoPor: "Falta informe", ultimaActualizacion: d(-5), observaciones: "Evaluación realizada, informe pendiente" },
      { id: genId(), mes: "Diciembre", ano: 2025, cargo: "Analista de Compras", area: "Compras", candidato: "Patricia López", rut: "18.234.567-8", tipoEvaluacion: "Psicolaboral", proveedor: "Psic. Laura González", fechaSolicitud: d(-45), fechaEvaluacion: d(-30), fechaEntregaInforme: d(-25), estado: "Cerrada", resultado: "Recomendado", prioridad: "P3 Medio", responsableId: anaId, costo: 150000, requiereOC: "No", numeroOC: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-25), observaciones: "Evaluación aprobada" },
      { id: genId(), mes: "Enero", ano: 2026, cargo: "Prevencionista de Riesgos", area: "Prevención", candidato: "Fernando Ruiz", rut: "11.111.222-3", tipoEvaluacion: "Psicolaboral", proveedor: "Psic. Laura González", fechaSolicitud: d(-10), fechaEvaluacion: "", fechaEntregaInforme: "", estado: "Solicitada", resultado: "Pendiente", prioridad: "P2 Alto", responsableId: anaId, costo: 150000, requiereOC: "Sí", numeroOC: "", proximaAccion: "Gestionar OC", fechaProximaAccion: d(2), bloqueadoPor: "Falta OC", ultimaActualizacion: d(-3), observaciones: "Bloqueada por falta de OC" },
      { id: genId(), mes: "Diciembre", ano: 2025, cargo: "Operador", area: "Operaciones", candidato: "Carlos Vega", rut: "19.876.543-2", tipoEvaluacion: "Psicolaboral", proveedor: "Psic. Laura González", fechaSolicitud: d(-40), fechaEvaluacion: d(-20), fechaEntregaInforme: d(-18), estado: "En revisión", resultado: "No recomendado", prioridad: "P2 Alto", responsableId: anaId, costo: 150000, requiereOC: "No", numeroOC: "", proximaAccion: "Revisar con RRHH", fechaProximaAccion: d(5), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-10), observaciones: "No recomendado, revisar alternativa" },
    ],
    valesGas: [
      { id: genId(), colaborador: "Juan Pérez", contactoId: "", area: "Operaciones", periodo: "Mayo 2026", fechaEntrega: d(-5), totalValesAsignados: 10, valesUsados: 3, descuentoDiario: 1, diasDescuento: 3, totalDescontado: 3, saldoVales: 7, estado: "En descuento", responsableId: anaId, fechaProximaRevision: d(7), observaciones: "Descuento iniciado", ultimaActualizacion: d(-1) },
      { id: genId(), colaborador: "Ana Soto", contactoId: "", area: "Administración", periodo: "Mayo 2026", fechaEntrega: d(-10), totalValesAsignados: 5, valesUsados: 5, descuentoDiario: 0, diasDescuento: 0, totalDescontado: 0, saldoVales: 0, estado: "Cerrado", responsableId: anaId, fechaProximaRevision: "", observaciones: "Vales completamente usados", ultimaActualizacion: d(-2) },
      { id: genId(), colaborador: "Luis Rojas", contactoId: "", area: "Prevención", periodo: "Mayo 2026", fechaEntrega: d(3), totalValesAsignados: 8, valesUsados: 0, descuentoDiario: 0, diasDescuento: 0, totalDescontado: 0, saldoVales: 8, estado: "Pendiente entregar", responsableId: anaId, fechaProximaRevision: d(3), observaciones: "Pendiente entregar vales", ultimaActualizacion: d(-1) },
    ],
    valesGasOrganizacion: [
      { id: genId(), fechaRegistro: d(-10), periodo: "Mayo 2026", tipoMovimiento: "Ingreso de vales", cantidadVales: 100, motivo: "Compra mensual de vales", responsableId: anaId, observaciones: "Vales comprados para el mes", ultimaActualizacion: d(-10) },
      { id: genId(), fechaRegistro: d(-3), periodo: "Mayo 2026", tipoMovimiento: "Ajuste positivo", cantidadVales: 20, motivo: "Ajuste por diferencia de inventario", responsableId: anaId, observaciones: "Ajuste corregido en revisión semanal", ultimaActualizacion: d(-3) },
    ],
    reclutamiento: [
      {
        id: genId(),
        reclutamiento: "Interno", plantaCentro: "Planta Bio Bio", tipoVacante: "Cosecha",
        mesIngreso: "Enero", revisadoPPTO: "Gloria", procesoBuk: "Sí", publicado: "Sí",
        seleccionCV: "En proceso", cvSeleccionadoBuk: "Sí", entrevistaJefatura: "Agendada",
        entrevistaGP: "Agendada", testPsicolaboral: "Solicitado", testHogan: "Solicitado",
        seleccionado: "Sí", cartaOferta: "Solicitada", envioCartaOferta: "Realizado",
        firmaCartaOferta: "Sí", fechaIngreso: "", reclutador: "Gloria", proceso: "Abierto",
        reclutadorId: "", prioridad: "P2 Alto", bloqueadoPor: "Sin bloqueo",
        proximaAccion: "Confirmar fecha ingreso", fechaProximaAccion: d(3),
        observaciones: "Proceso avanzado", ultimaActualizacion: d(0)
      },
      {
        id: genId(),
        reclutamiento: "Externo", plantaCentro: "Planta Freire", tipoVacante: "Reemplazo",
        mesIngreso: "Febrero", revisadoPPTO: "Hernan", procesoBuk: "No", publicado: "No",
        seleccionCV: "Finalizado", cvSeleccionadoBuk: "No", entrevistaJefatura: "Realizada",
        entrevistaGP: "Realizada", testPsicolaboral: "Realizado", testHogan: "Realizado",
        seleccionado: "No", cartaOferta: "N/A", envioCartaOferta: "Pendiente",
        firmaCartaOferta: "No", fechaIngreso: "", reclutador: "Matías", proceso: "Cerrado",
        reclutadorId: "", prioridad: "P3 Medio", bloqueadoPor: "Sin bloqueo",
        proximaAccion: "", fechaProximaAccion: "",
        observaciones: "Candidato desistió", ultimaActualizacion: d(-5)
      },
      {
        id: genId(),
        reclutamiento: "Promoción interna", plantaCentro: "Planta Perquenco", tipoVacante: "Fijo",
        mesIngreso: "Marzo", revisadoPPTO: "Pendiente", procesoBuk: "Confidencial", publicado: "",
        seleccionCV: "", cvSeleccionadoBuk: "", entrevistaJefatura: "Pendiente",
        entrevistaGP: "Pendiente", testPsicolaboral: "Pendiente", testHogan: "Pendiente",
        seleccionado: "", cartaOferta: "Pendiente", envioCartaOferta: "N/A",
        firmaCartaOferta: "Pendiente", fechaIngreso: "", reclutador: "Katalina", proceso: "Pausado",
        reclutadorId: "", prioridad: "P2 Alto", bloqueadoPor: "Falta aprobación",
        proximaAccion: "Esperar aprobación PPTO", fechaProximaAccion: d(7),
        observaciones: "En espera de presupuesto", ultimaActualizacion: d(-2)
      }
    ],
    meta: { version: "1.1", ultimaExportacion: "", actualizado: ahora() },
  };
}

function hydrateData(raw: unknown): AppData {
  const parsed = migrateData(raw, crearDatosEjemplo());
  parsed.presupuesto = ensureBudgetRows(parsed.presupuesto);
  return parsed;
}

function limpiarDatos() {
  removeStorageKey(STORAGE_KEY);
  clearCachedPassphrase();
}

// ──────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────

function Login({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const session = await authLogin(user.trim(), pass);
    setLoading(false);
    if (session) {
      logAudit("login", { detail: `Usuario ${session.username} inició sesión` });
      onLogin();
    } else {
      setError("Usuario o clave incorrectos");
      setPass("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Control Operativo</h1>
          <p className="text-slate-500 text-sm mt-1">Ingreso autorizado</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Usuario</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre de usuario" autoComplete="username" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clave</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm">{showPass ? "Ocultar" : "Mostrar"}</button>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60">{loading ? "Verificando…" : "Ingresar"}</button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">Acceso local básico. Para seguridad real se requiere backend.</p>
      </div>
    </div>
  );
}

function EncryptionUnlock({
  passphrase,
  setPassphrase,
  error,
  onUnlock,
}: {
  passphrase: string;
  setPassphrase: (value: string) => void;
  error: string;
  onUnlock: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Datos protegidos</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresa la clave local para desbloquear la información.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clave de cifrado</label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={onUnlock} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">Desbloquear</button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">La clave no se guarda en el navegador; se conserva solo durante esta sesión.</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────

type Modulo = ModuloKey;

type NavGroup = { group: string; items: { key: Modulo; label: string; icon: string }[] };
const navGroups: NavGroup[] = [
  { group: "", items: [{ key: "inicio", label: "Inicio", icon: "🏠" }] },
  { group: "Operación", items: [
    { key: "midia", label: "Mi Día", icon: "☀️" },
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "cursos", label: "Cursos / DNC", icon: "📚" },
    { key: "ocs", label: "OCs Pendientes", icon: "🧾" },
    { key: "procesos", label: "Procesos Pend.", icon: "⏳" },
  ]},
  { group: "Personas", items: [
    { key: "practicantes", label: "Practicantes", icon: "👤" },
    { key: "evaluaciones", label: "Evaluaciones", icon: "🧠" },
    { key: "reclutamiento", label: "Reclutamiento", icon: "👥" },
    { key: "contactos", label: "Contactos", icon: "📇" },
  ]},
  { group: "Documentos", items: [
    { key: "diplomas", label: "Diplomas/Cert/Lic", icon: "📜" },
  ]},
  { group: "Finanzas", items: [
    { key: "presupuesto", label: "Presupuesto", icon: "💰" },
    { key: "valesGas", label: "Vales de Gas", icon: "⛽" },
    { key: "cargaSemanal", label: "Carga Semanal", icon: "📅" },
  ]},
  { group: "Sistema", items: [
    { key: "configuracion", label: "Configuración", icon: "⚙️" },
  ]},
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => getSession() !== null);
  const [data, setData] = useState<AppData>(() => {
    const de = crearDatosEjemplo();
    de.presupuesto = ensureBudgetRows(de.presupuesto);
    return de;
  });
  const [dataReady, setDataReady] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockPassphrase, setUnlockPassphrase] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [encryptionSetupOpen, setEncryptionSetupOpen] = useState(false);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState("");
  const [encryptionPassphraseConfirm, setEncryptionPassphraseConfirm] = useState("");
  const [encryptionSetupError, setEncryptionSetupError] = useState("");
  const [activeModulo, setActiveModulo] = useState<Modulo>("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem("kata_focus_mode") === "true");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [exporting, setExporting] = useState<null | "json" | "jsonAnon" | "jsonSummary" | "xlsx" | "xlsxAnon" | "template" | "cleanTemplate">(
    null
  );
  const [modalModulo, setModalModulo] = useState<string>("");
  const [editItem, setEditItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  const [backups, setBackups] = useState<BackupItem[]>(() => getLocalBackups());
  const [lastJSONExport, setLastJSONExport] = useState<string>(() => localStorage.getItem("kata_last_json_export") || "");
  const [lastXLSXExport, setLastXLSXExport] = useState<string>(() => localStorage.getItem("kata_last_xlsx_export") || "");

  const toggleFocusMode = () => { const v = !focusMode; setFocusMode(v); localStorage.setItem("kata_focus_mode", String(v)); };

  // Role derived from session — cheap sessionStorage read, no memoization needed
  const currentRole = authenticated ? getSession()?.role : undefined;

  // Initial data load (supports encrypted payload)
  useEffect(() => {
    let active = true;
    const init = async () => {
      const raw = readStorageJSON<unknown>(STORAGE_KEY);
      if (!raw) {
        const de = crearDatosEjemplo();
        de.presupuesto = ensureBudgetRows(de.presupuesto);
        if (!active) return;
        setData(de);
        setDataReady(true);
        return;
      }
      if (isEncryptedPayload(raw)) {
        if (!active) return;
        setEncryptionEnabled(true);
        setEncryptedPayload(raw);
        const cached = getCachedPassphrase();
        if (!cached) {
          setUnlockOpen(true);
          return;
        }
        try {
          const decrypted = await decryptAppData(raw, cached);
          if (!active) return;
          setData(hydrateData(decrypted));
          setDataReady(true);
          setUnlockOpen(false);
        } catch {
          if (!active) return;
          setUnlockError("Clave incorrecta o datos corruptos.");
          setUnlockOpen(true);
        }
        return;
      }
      if (!active) return;
      setEncryptionEnabled(false);
      setEncryptedPayload(null);
      setData(hydrateData(raw));
      setDataReady(true);
    };
    void init();
    return () => { active = false; };
  }, []);

  // Session expiry check — every 60 s, only while authenticated
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      if (getSession() === null) {
        logAudit("logout", { detail: "Sesión expirada automáticamente" });
        authLogout();
        setAuthenticated(false);
        toastShow("Sesión expirada", { type: "warning", message: "Por seguridad, inicia sesión nuevamente." });
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [authenticated]);

  // Refresh session on user interaction (throttled to once per minute)
  useEffect(() => {
    if (!authenticated) return;
    let lastRefresh = 0;
    const handler = () => {
      const now = Date.now();
      if (now - lastRefresh > 60_000) { refreshSession(); lastRefresh = now; }
    };
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("click", handler); window.removeEventListener("keydown", handler); };
  }, [authenticated]);

  useEffect(() => {
    if (!dataReady) return;
    if (!encryptionEnabled) {
      saveAppData(STORAGE_KEY, data);
      return;
    }
    const passphrase = getCachedPassphrase();
    if (!passphrase) return;
    const dataToSave = createDataToSave(data);
    void (async () => {
      try {
        const encrypted = await encryptAppData(dataToSave, passphrase);
        writeStorageJSON(STORAGE_KEY, encrypted);
      } catch (error) {
        console.warn("[storage] No se pudo cifrar datos", error);
      }
    })();
  }, [data, dataReady, encryptionEnabled]);

  useEffect(() => {
    if (!dataReady) return;
    setTableLoading(true);
    const timer = setTimeout(() => setTableLoading(false), 200);
    return () => clearTimeout(timer);
  }, [activeModulo, search, dataReady]);

  const toastShow = (
    title: string,
    options?: {
      type?: ToastType;
      message?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    }
  ) => {
    const { type = "info", message, action, duration = 2500 } = options || {};
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => {
      if (prev.some(t => t.title === title && t.message === message)) return prev;
      return [...prev, { id, type, title, message, action }];
    });
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const runBackupAndToast = (motivo: string) => {
    const success = createBackup(data, motivo);
    if (!success) {
      toastShow("No se pudo crear respaldo", {
        type: "error",
        message: "El almacenamiento local está lleno. Libera espacio o elimina respaldos antiguos.",
      });
    } else {
      setBackups(getLocalBackups());
    }
  };

  const openEncryptionSetup = () => {
    setEncryptionSetupError("");
    setEncryptionPassphrase("");
    setEncryptionPassphraseConfirm("");
    setEncryptionSetupOpen(true);
  };

  const handleEnableEncryption = async () => {
    const passphrase = encryptionPassphrase.trim();
    if (passphrase.length < 8) { setEncryptionSetupError("La clave debe tener al menos 8 caracteres."); return; }
    if (passphrase !== encryptionPassphraseConfirm.trim()) { setEncryptionSetupError("Las claves no coinciden."); return; }
    try {
      cachePassphrase(passphrase);
      const encrypted = await encryptAppData(createDataToSave(data), passphrase);
      writeStorageJSON(STORAGE_KEY, encrypted);
      setEncryptionEnabled(true);
      setEncryptedPayload(encrypted);
      setEncryptionSetupOpen(false);
      toastShow("Cifrado local activado", { type: "success" });
    } catch {
      setEncryptionSetupError("No se pudo activar el cifrado.");
    }
  };

  const handleDisableEncryption = () => {
    setConfirm({
      title: "Desactivar cifrado local",
      message: "Los datos quedarán en texto plano en este navegador.",
      variant: "warning",
      confirmLabel: "Desactivar",
      onConfirm: () => {
        clearCachedPassphrase();
        setEncryptionEnabled(false);
        setEncryptedPayload(null);
        setUnlockOpen(false);
        setUnlockError("");
        setUnlockPassphrase("");
        saveAppData(STORAGE_KEY, data);
        toastShow("Cifrado local desactivado", { type: "info" });
        setConfirm(null);
      },
    });
  };

  const handleUnlock = async () => {
    if (!encryptedPayload) return;
    const passphrase = unlockPassphrase.trim();
    if (!passphrase) { setUnlockError("Ingresa la clave de cifrado."); return; }
    try {
      const decrypted = await decryptAppData(encryptedPayload, passphrase);
      setData(hydrateData(decrypted));
      setDataReady(true);
      cachePassphrase(passphrase);
      setUnlockPassphrase("");
      setUnlockError("");
      setUnlockOpen(false);
    } catch {
      setUnlockError("Clave incorrecta. Intenta nuevamente.");
    }
  };

  // ── EXPORT / IMPORT ────────────────────────

  const confirmSensitiveExport = (label: string, cb: () => void) => {
    setConfirm({
      title: "Confirmar exportación sensible",
      message: `La exportación ${label} incluye datos sensibles (RUT, correo, teléfono y nombres). Confirma que tienes autorización y que guardarás el archivo de forma segura.`,
      variant: "warning",
      confirmLabel: "Sí, exportar",
      onConfirm: () => { cb(); setConfirm(null); },
    });
  };

  const anonymizeData = (input: AppData): AppData => {
    const redact = (value: string) => (value ? "REDACTADO" : "");
    return {
      ...input,
      cursos: input.cursos.map(c => ({ ...c, solicitante: redact(c.solicitante) })),
      practicantes: input.practicantes.map(p => ({ ...p, nombre: redact(p.nombre) })),
      diplomas: input.diplomas.map(d => ({ ...d, participante: redact(d.participante) })),
      contactos: input.contactos.map(c => ({
        ...c,
        nombre: redact(c.nombre),
        correo: redact(c.correo),
        telefono: redact(c.telefono),
      })),
      evaluacionesPsicolaborales: input.evaluacionesPsicolaborales.map(e => ({
        ...e,
        candidato: redact(e.candidato),
        rut: redact(e.rut),
      })),
      valesGas: input.valesGas.map(v => ({ ...v, colaborador: redact(v.colaborador) })),
      reclutamiento: input.reclutamiento.map(r => ({ ...r, reclutador: redact(r.reclutador) })),
    };
  };

  const buildSummary = (input: AppData) => ({
    generadoEn: ahora(),
    versionEsquema: input.meta.version,
    conteos: {
      cursos: input.cursos.length,
      ocs: input.ocs.length,
      practicantes: input.practicantes.length,
      presupuesto: input.presupuesto.length,
      procesos: input.procesos.length,
      diplomas: input.diplomas.length,
      cargaSemanal: input.cargaSemanal.length,
      contactos: input.contactos.length,
      evaluacionesPsicolaborales: input.evaluacionesPsicolaborales.length,
      valesGas: input.valesGas.length,
      valesGasOrganizacion: input.valesGasOrganizacion.length,
      reclutamiento: input.reclutamiento.length,
    },
  });

  const exportJSONFull = () => {
    setExporting("json");
    try {
      logAudit("data:export", { detail: "Exportación JSON completa" });
      const backupFileName = `total-control-rh-backup-${hoy()}.json`;
      const blob = createJsonBlob(data);
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = backupFileName;
      a.click();
      URL.revokeObjectURL(url);
      const timeNow = ahora();
      localStorage.setItem("kata_last_json_export", timeNow);
      setLastJSONExport(timeNow);
      setData(d => ({ ...d, meta: { ...d.meta, ultimaExportacion: timeNow } }));
      toastShow("JSON exportado correctamente", { type: "success" });
    } finally {
      setExporting(null);
    }
  };

  const exportJSON = () => {
    if (!canExportFull) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos completos." }); return; }
    confirmSensitiveExport("JSON completo", exportJSONFull);
  };

  const exportJSONAnonymized = () => {
    if (!canExportAnonymized) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos anonimizados." }); return; }
    setExporting("jsonAnon");
    try {
      logAudit("data:export", { detail: "Exportación JSON anonimizada" });
      const backupFileName = `total-control-rh-backup-anon-${hoy()}.json`;
      const blob = createJsonBlob(anonymizeData(data));
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = backupFileName;
      a.click();
      URL.revokeObjectURL(url);
      toastShow("JSON anonimizado exportado correctamente", { type: "success" });
    } finally {
      setExporting(null);
    }
  };

  const exportJSONSummary = () => {
    if (!canExportSummary) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar resúmenes." }); return; }
    setExporting("jsonSummary");
    try {
      logAudit("data:export", { detail: "Exportación JSON resumen" });
      const summaryFileName = `total-control-rh-resumen-${hoy()}.json`;
      const blob = new Blob([JSON.stringify(buildSummary(data), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = summaryFileName;
      a.click();
      URL.revokeObjectURL(url);
      toastShow("Resumen exportado correctamente", { type: "success" });
    } finally {
      setExporting(null);
    }
  };

  const importJSON = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (!parsed || typeof parsed !== "object") {
            toastShow("Respaldo corrupto o inválido", { type: "error" });
            return;
          }
          const imported = migrateData(parsed, crearDatosEjemplo());
          setConfirm({
            title: "Confirmar importación JSON",
            message: "Se reemplazarán los datos actuales. Se creará un respaldo automático antes de importar.",
            variant: "warning",
            confirmLabel: "Importar",
            onConfirm: () => {
              runBackupAndToast("importar");
              setData(imported);
              toastShow("Datos importados exitosamente", { type: "success" });
              setConfirm(null);
            },
          });
        } catch {
          toastShow("Error al leer el archivo JSON", { type: "error", message: "Verifica que el archivo sea válido." });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportXLSXFull = async () => {
    setExporting("xlsx");
    try {
      logAudit("data:export", { detail: "Exportación XLSX completa" });
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const sheets = buildExportSheets(data, getResponsableName);
      sheets.forEach(([name, rows]) => { const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, name); });
      XLSX.writeFile(wb, `control_operativo_kata_v5_${hoy()}.xlsx`);
      const timeNow = ahora();
      localStorage.setItem("kata_last_xlsx_export", timeNow);
      setLastXLSXExport(timeNow);
      setData(d => ({ ...d, meta: { ...d.meta, ultimaExportacion: timeNow } }));
      toastShow("XLSX exportado correctamente", { type: "success" });
    } finally {
      setExporting(null);
    }
  };

  const exportXLSX = () => {
    if (!canExportFull) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos completos." }); return; }
    confirmSensitiveExport("XLSX completo", exportXLSXFull);
  };

  const exportXLSXAnonymized = async () => {
    if (!canExportAnonymized) { toastShow("Permiso insuficiente", { type: "error", message: "No tienes permiso para exportar datos anonimizados." }); return; }
    setExporting("xlsxAnon");
    try {
      logAudit("data:export", { detail: "Exportación XLSX anonimizada" });
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const anon = anonymizeData(data);
      const sheets = buildExportSheets(anon, getResponsableName);
      sheets.forEach(([name, rows]) => { const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, name); });
      XLSX.writeFile(wb, `control_operativo_kata_v5_anon_${hoy()}.xlsx`);
      toastShow("XLSX anonimizado exportado correctamente", { type: "success" });
    } finally {
      setExporting(null);
    }
  };

  const exportLimpia = async () => {
    setExporting("cleanTemplate");
    try {
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const headers: Record<string, string[]> = {
        Cursos: ["id","curso","origen","area","solicitante","fechaSolicitud","fechaRequerida","estado","prioridad","nivelCritico","requiereOC","numeroOC","proveedor","responsable","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        OCs: ["id","numeroOC","categoriaOC","cursoAsociado","proveedor","monto","fechaSolicitud","fechaLimite","estadoOC","prioridad","accionPendiente","responsable","bloqueadoPor","ultimaActualizacion","observaciones"],
        Practicantes: ["id","nombre","area","especialidad","fechaInicio","fechaTermino","costoMensual","estado","responsable","proximoPaso","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        Presupuesto: ["id","concepto","presupuestoTotal","gastado","responsable","ultimaActualizacion","observaciones"],
        Procesos: ["id","proceso","tipo","estadoActual","queFalta","responsable","fechaLimite","riesgo","prioridad","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        Diplomas: ["id","cursoAsociado","participante","tipoDocumento","otec","etapa","fechaSolicitudOTEC","fechaRecepcionDoc","fechaEnvioParticipante","fechaSubidaBUK","estadoBUK","prioridad","responsable","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        "Evaluaciones Psicolaborales": ["id","mes","ano","cargo","area","candidato","rut","tipoEvaluacion","proveedor","fechaSolicitud","fechaEvaluacion","fechaEntregaInforme","estado","resultado","prioridad","responsable","costo","requiereOC","numeroOC","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
        "Carga Semanal": ["id","semana","cursosPlanificados","cursosUrgentesNuevos","cursosNoPlanificados","ocsNuevas","diplomasPendientes","procesosBloqueados","comentario"],
        Contactos: ["id","nombre","rol","areaEmpresa","correo","telefono","relacion","activo","observaciones"],
        "Vales de Gas": ["id","colaborador","contactoId","area","periodo","fechaEntrega","totalValesAsignados","valesUsados","saldoVales","descuentoDiario","diasDescuento","totalDescontado","estado","responsable","fechaProximaRevision","observaciones","ultimaActualizacion"],
        "Vales Gas Organización": ["id","fechaRegistro","periodo","tipoMovimiento","cantidadVales","motivo","responsable","observaciones","ultimaActualizacion"],
        "Reclutamiento": ["id","reclutamiento","plantaCentro","tipoVacante","mesIngreso","revisadoPPTO","procesoBuk","publicado","seleccionCV","cvSeleccionadoBuk","entrevistaJefatura","entrevistaGP","testPsicolaboral","testHogan","seleccionado","cartaOferta","envioCartaOferta","firmaCartaOferta","fechaIngreso","reclutador","proceso","prioridad","bloqueadoPor","proximaAccion","fechaProximaAccion","observaciones","ultimaActualizacion"],
      };
      Object.entries(headers).forEach(([name, cols]) => { const ws = XLSX.utils.aoa_to_sheet([cols]); XLSX.utils.book_append_sheet(wb, ws, name); });
      XLSX.writeFile(wb, `plantilla_limpia_kata_v5.xlsx`);
      toastShow("Plantilla limpia descargada", { type: "success" });
    } finally {
      setExporting(null);
    }
  };

  const downloadXlsxTemplate = async () => {
    setExporting("template");
    try {
      const XLSX = await getXlsx();
      const wb = XLSX.utils.book_new();
      const readmeData = [
        ["PulsoLaboral — Plantilla oficial de carga XLSX"],
        [""],
        ["INSTRUCCIONES:"],
        ["1. No cambiar nombres de hojas."],
        ["2. No cambiar encabezados de columnas."],
        ["3. Completar una fila por registro."],
        ["4. Las fechas deben ir en formato dd/mm/yyyy."],
        ["5. Los montos deben ir como números (sin puntos de miles ni símbolos $)."],
        ["6. Las columnas ID pueden dejarse vacías; la app generará IDs automáticamente."],
        ["7. Si se deja responsable vacío, se usará 'Sin responsable'."],
        ["8. Antes de importar, se recomienda exportar un respaldo JSON."],
        ["9. Cada hoja corresponde a un módulo de la app."],
        ["10. Modo fusión: registros con ID existente se actualizan; sin ID se crean como nuevos."],
        ["11. Modo reemplazo: módulos presentes en el XLSX reemplazan la información actual."],
        ["12. Las hojas no incluidas en el XLSX no serán modificadas."],
      ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readmeData), "README");

    const sheets: Record<string, string[]> = {
      "Contactos": ["ID","Nombre","Rol","Área / Empresa","Correo","Teléfono","Relación","Activo","Observaciones"],
      "Cursos": ["ID","Curso / Capacitación","Origen","Área","Solicitante","Fecha solicitud","Fecha requerida","Estado","Prioridad","Nivel crítico","Requiere OC","N° OC asociada","Proveedor / OTEC","Responsable","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
      "OCs": ["ID","N° OC","Categoría OC","Curso / Servicio asociado","Proveedor","Monto","Fecha solicitud","Fecha límite","Estado OC","Prioridad","Acción pendiente","Responsable","Bloqueado por","Observaciones"],
      "Practicantes": ["ID","Nombre","Área","Especialidad","Fecha inicio","Fecha término","Costo mensual","Estado","Responsable","Próximo paso","Fecha próxima acción","Bloqueado por","Observaciones"],
      "Presupuesto": ["ID","Área / Módulo","Presupuesto asignado","Monto comprometido manual","Monto ejecutado manual","Modo cálculo","Observaciones"],
      "Procesos Pendientes": ["ID","Proceso","Tipo","Estado actual","Qué falta","Responsable","Fecha límite","Riesgo si no se hace","Prioridad","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
      "Diplomas BUK": ["ID","Curso asociado","Participante","Tipo documento","OTEC / proveedor","Etapa","Fecha solicitud a OTEC","Fecha recepción documento","Fecha envío al participante","Fecha subida a BUK","Estado BUK","Prioridad","Responsable","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
      "Evaluaciones Psicolaborales": ["ID","Mes","Año","Cargo","Área","Candidato","RUT candidato","Tipo evaluación","Proveedor / Psicólogo","Fecha solicitud","Fecha evaluación","Fecha entrega informe","Estado","Resultado","Prioridad","Responsable","Costo","Requiere OC","N° OC asociada","Próxima acción","Fecha próxima acción","Bloqueado por","Observaciones"],
      "Carga Semanal": ["ID","Semana","Año","Cursos planificados","Cursos urgentes nuevos","Cursos no planificados necesarios","OCs nuevas","Diplomas pendientes","Procesos bloqueados","Comentario"],
      "Vales de Gas Colaboradores": ["ID","Colaborador","Contacto asociado","Área","Periodo","Fecha entrega","Vales asignados al colaborador","Vales entregados / utilizados","Descuento diario","Días descuento","Estado","Responsable","Fecha próxima revisión","Observaciones"],
      "Vales Gas Organización": ["ID","Fecha registro","Periodo","Tipo movimiento","Cantidad vales","Motivo","Responsable","Observaciones","Última actualización"],
      "Reclutamiento": ["ID","Reclutamiento","Planta o Centro","Tipo de vacante","Mes ingreso","Revisado PPTO","Proceso en BUK","Publicado","Selección de CV","CV Seleccionado en BUK","Entrevista Jefatura","Entrevista GP","Test Psicolaboral","Test Hogan","Seleccionado","Carta Oferta","Envio carta Oferta","Firma Carta Oferta","Fecha Ingreso","Reclutador","Proceso","Prioridad","Bloqueado por","Próxima acción","Fecha próxima acción","Observaciones","Última actualización"],
    };

    const reclEjemplos = [
      ["","Interno","Planta Bio Bio","Cosecha","Enero","Gloria","Sí","Sí","En proceso","Sí","Agendada","Agendada","Solicitado","Solicitado","Sí","Solicitada","Realizado","Sí","","Gloria","Abierto","P2 Alto","Sin bloqueo","Confirmar fecha ingreso","","Proceso avanzado",""],
      ["","Externo","Planta Freire","Reemplazo","Febrero","Hernan","No","No","Finalizado","No","Realizada","Realizada","Realizado","Realizado","No","N/A","Pendiente","No","","Matías","Cerrado","P3 Medio","Sin bloqueo","","","Candidato desistió",""],
      ["","Promoción interna","Planta Perquenco","Fijo","Marzo","Pendiente","Confidencial","","","","Pendiente","Pendiente","Pendiente","Pendiente","","Pendiente","N/A","Pendiente","","Katalina","Pausado","P2 Alto","Falta aprobación","Esperar aprobación PPTO","","En espera de presupuesto",""],
    ];

    Object.entries(sheets).forEach(([sheetName, headers]) => {
      const rows: any[][] = [headers];
      if (sheetName === "Reclutamiento") {
        reclEjemplos.forEach(r => rows.push(r));
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
    });

      XLSX.writeFile(wb, "Plantilla_TotalControlRH.xlsx");
      toastShow("Plantilla XLSX descargada", { type: "success" });
    } finally {
      setExporting(null);
    }
  };

  const parseXlsxFile = async (file: File): Promise<XlsxParseResult> => {
    const MAX_FILE_MB = 10;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toastShow("Archivo demasiado grande", {
        type: "warning",
        message: `El archivo supera los ${MAX_FILE_MB} MB permitidos.`,
      });
      return { hojas: [], contactosNuevos: [], parsedData: {}, tieneErroresCriticos: true };
    }
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toastShow("Formato inválido", {
        type: "warning",
        message: "Solo se aceptan archivos .xlsx o .xls.",
      });
      return { hojas: [], contactosNuevos: [], parsedData: {}, tieneErroresCriticos: true };
    }
    const buffer = await file.arrayBuffer();
    const XLSX = await getXlsx();
    const wb = XLSX.read(buffer, { type: "array", cellDates: false });

    const result: XlsxParseResult = {
      hojas: [], contactosNuevos: [], parsedData: {}, tieneErroresCriticos: false
    };

    let contactosActualizados = [...data.contactos];

    const getSheet = (names: string[]): any => {
      for (const n of names) {
        const found = wb.SheetNames.find((s: string) => s.trim().toLowerCase() === n.toLowerCase());
        if (found) return wb.Sheets[found];
      }
      return null;
    };

    const processSheet = (sheetNames: string[], modulo: string, processor: (rows: any[]) => { registros: any[]; erroresList: string[]; advertenciasList: string[] }) => {
      const ws = getSheet(sheetNames);
      if (!ws) return;
      const rows = xlsxSheetToObjects(ws, XLSX.utils).filter((r: any) => Object.values(r).some((v: any) => v !== "" && v !== null && v !== undefined));
      const { registros, erroresList, advertenciasList } = processor(rows);
      const validos = registros.filter((r: any) => !r._hasError).length;
      const conError = registros.filter((r: any) => r._hasError).length;
      const conAdv = registros.filter((r: any) => r._hasWarning).length;
      if (conError > 0) result.tieneErroresCriticos = true;
      result.hojas.push({ nombre: sheetNames[0], modulo, total: rows.length, validos, advertencias: conAdv, errores: conError, registros, erroresList, advertenciasList });
      (result.parsedData as any)[modulo] = registros.filter((r: any) => !r._hasError).map((r: any) => {
        const clean = { ...r };
        delete clean._hasError;
        delete clean._hasWarning;
        delete clean._errorMsg;
        return clean;
      });
    };

    // CONTACTOS
    processSheet(["Contactos"], "contactos", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const nombre = String(row["Nombre"] || "").trim();
        if (!nombre) { erroresList.push(`Fila ${i+2}: Nombre obligatorio`); registros.push({ ...row, _hasError: true, _errorMsg: "Nombre obligatorio" }); return; }
        const existing = contactosActualizados.find((c: any) => c.nombre?.toLowerCase() === nombre.toLowerCase());
        registros.push({
          id: String(row["ID"] || existing?.id || `contacto_${Date.now()}_${i}`),
          nombre, rol: String(row["Rol"] || ""), areaEmpresa: String(row["Área / Empresa"] || ""),
          correo: String(row["Correo"] || ""), telefono: String(row["Teléfono"] || ""),
          relacion: String(row["Relación"] || "Interno"), activo: normalizeYesNo(row["Activo"]) || "Sí",
          observaciones: String(row["Observaciones"] || ""), _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // CURSOS
    processSheet(["Cursos"], "cursos", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const curso = String(row["Curso / Capacitación"] || row["Curso"] || "").trim();
        if (!curso) { erroresList.push(`Fila ${i+2}: Curso/Capacitación obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({
          id: String(row["ID"] || `curso_${Date.now()}_${i}`), curso,
          origen: String(row["Origen"] || ""), area: String(row["Área"] || ""),
          solicitante: String(row["Solicitante"] || ""),
          fechaSolicitud: normalizeDateFromXlsx(row["Fecha solicitud"]),
          fechaRequerida: normalizeDateFromXlsx(row["Fecha requerida"]),
          estado: String(row["Estado"] || "Pendiente revisar"),
          prioridad: String(row["Prioridad"] || "P3 Medio"),
          nivelCritico: String(row["Nivel crítico"] || "Medio"),
          requiereOC: String(row["Requiere OC"] || "No"),
          numeroOC: String(row["N° OC asociada"] || ""),
          proveedor: String(row["Proveedor / OTEC"] || ""),
          responsableId: respId,
          proximaAccion: String(row["Próxima acción"] || ""),
          fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]),
          bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          observaciones: String(row["Observaciones"] || ""),
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // OCs
    processSheet(["OCs"], "ocs", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const numeroOC = String(row["N° OC"] || "").trim();
        const cursoAsociado = String(row["Curso / Servicio asociado"] || "").trim();
        if (!numeroOC && !cursoAsociado) { erroresList.push(`Fila ${i+2}: N° OC o Curso asociado obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        const monto = parseXlsxMoney(row["Monto"]);
        registros.push({
          id: String(row["ID"] || `oc_${Date.now()}_${i}`), numeroOC, cursoAsociado,
          categoriaOC: String(row["Categoría OC"] || ""),
          proveedor: String(row["Proveedor"] || ""), monto,
          fechaSolicitud: normalizeDateFromXlsx(row["Fecha solicitud"]),
          fechaLimite: normalizeDateFromXlsx(row["Fecha límite"]),
          estadoOC: String(row["Estado OC"] || "Pendiente crear"),
          prioridad: String(row["Prioridad"] || "P3 Medio"),
          accionPendiente: String(row["Acción pendiente"] || ""),
          responsableId: respId,
          bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          observaciones: String(row["Observaciones"] || ""),
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // PRACTICANTES
    processSheet(["Practicantes"], "practicantes", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const nombre = String(row["Nombre"] || "").trim();
        if (!nombre) { erroresList.push(`Fila ${i+2}: Nombre obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({
          id: String(row["ID"] || `prac_${Date.now()}_${i}`), nombre,
          area: String(row["Área"] || ""), especialidad: String(row["Especialidad"] || ""),
          fechaInicio: normalizeDateFromXlsx(row["Fecha inicio"]),
          fechaTermino: normalizeDateFromXlsx(row["Fecha término"]),
          costoMensual: parseXlsxMoney(row["Costo mensual"]),
          estado: String(row["Estado"] || "Por buscar"), responsableId: respId,
          proximoPaso: String(row["Próximo paso"] || ""),
          fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]),
          bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          observaciones: String(row["Observaciones"] || ""),
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // PRESUPUESTO
    processSheet(["Presupuesto"], "presupuesto", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const concepto = String(row["Área / Módulo"] || "").trim();
        if (!concepto) { erroresList.push(`Fila ${i+2}: Área/Módulo obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const total = parseXlsxMoney(row["Presupuesto asignado"]);
        const comprometido = parseXlsxMoney(row["Monto comprometido manual"]);
        const ejecutado = parseXlsxMoney(row["Monto ejecutado manual"]);
        const hasNeg = total < 0 || comprometido < 0 || ejecutado < 0;
        registros.push({
          id: String(row["ID"] || `pres_${Date.now()}_${i}`), concepto,
          presupuestoTotal: Math.max(0, total),
          montoComprometidoManual: Math.max(0, comprometido),
          montoEjecutadoManual: Math.max(0, ejecutado),
          gastado: Math.max(0, ejecutado),
          modoCalculo: String(row["Modo cálculo"] || "Manual"),
          observaciones: String(row["Observaciones"] || ""),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          _hasError: hasNeg, _hasWarning: false,
          _errorMsg: hasNeg ? "Montos no pueden ser negativos" : ""
        });
        if (hasNeg) erroresList.push(`Fila ${i+2}: Montos negativos no permitidos`);
      });
      return { registros, erroresList, advertenciasList };
    });

    // PROCESOS
    processSheet(["Procesos Pendientes", "Procesos"], "procesos", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const proceso = String(row["Proceso"] || "").trim();
        if (!proceso) { erroresList.push(`Fila ${i+2}: Proceso obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({
          id: String(row["ID"] || `proc_${Date.now()}_${i}`), proceso,
          tipo: String(row["Tipo"] || "Otro"),
          estadoActual: String(row["Estado actual"] || "Pendiente"),
          queFalta: String(row["Qué falta"] || ""),
          responsableId: respId,
          fechaLimite: normalizeDateFromXlsx(row["Fecha límite"]),
          riesgo: String(row["Riesgo si no se hace"] || ""),
          prioridad: String(row["Prioridad"] || "P3 Medio"),
          proximaAccion: String(row["Próxima acción"] || ""),
          fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]),
          bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          observaciones: String(row["Observaciones"] || ""),
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // DIPLOMAS
    processSheet(["Diplomas BUK", "Diplomas"], "diplomas", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const participante = String(row["Participante"] || "").trim();
        const cursoAsociado = String(row["Curso asociado"] || "").trim();
        if (!participante && !cursoAsociado) { erroresList.push(`Fila ${i+2}: Participante o Curso asociado obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({
          id: String(row["ID"] || `dip_${Date.now()}_${i}`), cursoAsociado, participante,
          tipoDocumento: String(row["Tipo documento"] || "Diploma"),
          otec: String(row["OTEC / proveedor"] || ""),
          etapa: String(row["Etapa"] || "Pedir a la OTEC"),
          fechaSolicitudOTEC: normalizeDateFromXlsx(row["Fecha solicitud a OTEC"]),
          fechaRecepcionDoc: normalizeDateFromXlsx(row["Fecha recepción documento"]),
          fechaEnvioParticipante: normalizeDateFromXlsx(row["Fecha envío al participante"]),
          fechaSubidaBUK: normalizeDateFromXlsx(row["Fecha subida a BUK"]),
          estadoBUK: String(row["Estado BUK"] || "Pendiente subir"),
          prioridad: String(row["Prioridad"] || "P3 Medio"), responsableId: respId,
          proximaAccion: String(row["Próxima acción"] || ""),
          fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]),
          bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          observaciones: String(row["Observaciones"] || ""),
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // EVALUACIONES
    processSheet(["Evaluaciones Psicolaborales", "Evaluaciones"], "evaluacionesPsicolaborales", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const cargo = String(row["Cargo"] || "").trim();
        if (!cargo) { erroresList.push(`Fila ${i+2}: Cargo obligatorio`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({
          id: String(row["ID"] || `eval_${Date.now()}_${i}`),
          mes: String(row["Mes"] || ""), ano: parseXlsxNumber(row["Año"]) || new Date().getFullYear(),
          cargo, area: String(row["Área"] || ""), candidato: String(row["Candidato"] || ""),
          rut: String(row["RUT candidato"] || ""),
          tipoEvaluacion: String(row["Tipo evaluación"] || "Psicolaboral"),
          proveedor: String(row["Proveedor / Psicólogo"] || ""),
          fechaSolicitud: normalizeDateFromXlsx(row["Fecha solicitud"]),
          fechaEvaluacion: normalizeDateFromXlsx(row["Fecha evaluación"]),
          fechaEntregaInforme: normalizeDateFromXlsx(row["Fecha entrega informe"]),
          estado: String(row["Estado"] || "Pendiente solicitar"),
          resultado: String(row["Resultado"] || "Pendiente"),
          prioridad: String(row["Prioridad"] || "P3 Medio"), responsableId: respId,
          costo: parseXlsxMoney(row["Costo"]),
          requiereOC: String(row["Requiere OC"] || "No"),
          numeroOC: String(row["N° OC asociada"] || ""),
          proximaAccion: String(row["Próxima acción"] || ""),
          fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]),
          bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          observaciones: String(row["Observaciones"] || ""),
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // CARGA SEMANAL
    processSheet(["Carga Semanal"], "cargaSemanal", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const semana = String(row["Semana"] || "").trim();
        if (!semana) { erroresList.push(`Fila ${i+2}: Semana obligatoria`); registros.push({ ...row, _hasError: true }); return; }
        registros.push({
          id: String(row["ID"] || `carga_${Date.now()}_${i}`), semana,
          cursosPlanificados: parseXlsxNumber(row["Cursos planificados"]),
          cursosUrgentesNuevos: parseXlsxNumber(row["Cursos urgentes nuevos"]),
          cursosNoPlanificados: parseXlsxNumber(row["Cursos no planificados necesarios"]),
          ocsNuevas: parseXlsxNumber(row["OCs nuevas"]),
          diplomasPendientes: parseXlsxNumber(row["Diplomas pendientes"]),
          procesosBloqueados: parseXlsxNumber(row["Procesos bloqueados"]),
          comentario: String(row["Comentario"] || ""),
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // VALES GAS COLABORADORES
    processSheet(["Vales de Gas Colaboradores", "Vales de Gas"], "valesGas", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const colaborador = String(row["Colaborador"] || "").trim();
        const area = String(row["Área"] || "").trim();
        const periodo = String(row["Periodo"] || "").trim();
        const hasErr = !colaborador || !area || !periodo;
        if (hasErr) { erroresList.push(`Fila ${i+2}: Colaborador, Área y Periodo son obligatorios`); registros.push({ ...row, _hasError: true }); return; }
        const asignados = parseXlsxNumber(row["Vales asignados al colaborador"] || row["Total vales asignados"]);
        const usados = parseXlsxNumber(row["Vales entregados / utilizados"] || row["Vales usados"]);
        const descDiario = parseXlsxNumber(row["Descuento diario"]);
        const diasDesc = parseXlsxNumber(row["Días descuento"]);
        const saldo = Math.max(0, asignados - usados);
        const totalDesc = descDiario * diasDesc;
        const hasWarn = usados > asignados;
        if (hasWarn) advertenciasList.push(`Fila ${i+2}: Vales utilizados (${usados}) > asignados (${asignados})`);
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({
          id: String(row["ID"] || `valegas_${Date.now()}_${i}`), colaborador,
          contactoId: String(row["Contacto asociado"] || ""), area, periodo,
          fechaEntrega: normalizeDateFromXlsx(row["Fecha entrega"]),
          totalValesAsignados: asignados, valesUsados: usados, saldoVales: saldo,
          descuentoDiario: descDiario, diasDescuento: diasDesc, totalDescontado: totalDesc,
          estado: String(row["Estado"] || "Pendiente entregar"), responsableId: respId,
          fechaProximaRevision: normalizeDateFromXlsx(row["Fecha próxima revisión"]),
          ultimaActualizacion: new Date().toISOString().split("T")[0],
          observaciones: String(row["Observaciones"] || ""),
          _hasError: false, _hasWarning: hasWarn
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // VALES GAS ORGANIZACIÓN
    processSheet(["Vales Gas Organización", "Vales Gas Organizacion"], "valesGasOrganizacion", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const fechaRegistro = normalizeDateFromXlsx(row["Fecha registro"]);
        const periodo = String(row["Periodo"] || "").trim();
        const tipoMovimiento = String(row["Tipo movimiento"] || "").trim();
        const cantidad = parseXlsxNumber(row["Cantidad vales"]);
        const hasErr = !fechaRegistro || !periodo || !tipoMovimiento || cantidad <= 0;
        if (hasErr) { erroresList.push(`Fila ${i+2}: Fecha, Periodo, Tipo movimiento y Cantidad (>0) son obligatorios`); registros.push({ ...row, _hasError: true }); return; }
        const respNombre = String(row["Responsable"] || "");
        const { id: respId, contactosActualizados: ca } = resolveResponsable(respNombre, contactosActualizados);
        contactosActualizados = ca;
        registros.push({
          id: String(row["ID"] || `valegasorg_${Date.now()}_${i}`), fechaRegistro, periodo,
          tipoMovimiento, cantidadVales: cantidad,
          motivo: String(row["Motivo"] || ""), responsableId: respId,
          observaciones: String(row["Observaciones"] || ""),
          ultimaActualizacion: normalizeDateFromXlsx(row["Última actualización"]) || new Date().toISOString().split("T")[0],
          _hasError: false, _hasWarning: false
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    // RECLUTAMIENTO
    processSheet(["Reclutamiento", "Hoja1", "RECLUTAMIENTO", "Reclutamiento RRHH"], "reclutamiento", (rows) => {
      const registros: any[] = []; const erroresList: string[] = []; const advertenciasList: string[] = [];
      rows.forEach((row: any, i: number) => {
        const plantaCentro = String(row["Planta o Centro"] || "").trim();
        const tipoVacante = String(row["Tipo de vacante"] || "").trim();
        const mesIngreso = String(row["Mes ingreso"] || "").trim();
        const proceso = normalizeReclutamientoCampo(row["Proceso"], "proceso");
        const hasErr = !plantaCentro || !tipoVacante || !mesIngreso || !proceso;
        if (hasErr) { erroresList.push(`Fila ${i+2}: Planta, Tipo vacante, Mes ingreso y Proceso son obligatorios`); registros.push({ ...row, _hasError: true }); return; }
        const reclutadorNombre = String(row["Reclutador"] || "").trim();
        let reclutadorId = "";
        if (reclutadorNombre) {
          const { id, contactosActualizados: ca } = resolveResponsable(reclutadorNombre, contactosActualizados, "RRHH");
          reclutadorId = id; contactosActualizados = ca;
        }
        const reclutamientoVal = normalizeReclutamientoCampo(row["Reclutamiento"], "reclutamiento");
        const hasWarn = proceso === "Pausado" && (!row["Bloqueado por"] || row["Bloqueado por"] === "Sin bloqueo");
        if (hasWarn) advertenciasList.push(`Fila ${i+2}: Proceso Pausado sin bloqueo definido`);
        registros.push({
          id: String(row["ID"] || `recl_${Date.now()}_${i}`),
          reclutamiento: reclutamientoVal, plantaCentro, tipoVacante, mesIngreso,
          revisadoPPTO: String(row["Revisado PPTO"] || ""),
          procesoBuk: normalizeReclutamientoCampo(row["Proceso en BUK"], "procesoBuk"),
          publicado: normalizeReclutamientoCampo(row["Publicado"], "publicado"),
          seleccionCV: String(row["Selección de CV"] || ""),
          cvSeleccionadoBuk: normalizeReclutamientoCampo(row["CV Seleccionado en BUK"], "cvSeleccionadoBuk"),
          entrevistaJefatura: String(row["Entrevista Jefatura"] || ""),
          entrevistaGP: String(row["Entrevista GP"] || ""),
          testPsicolaboral: String(row["Test Psicolaboral"] || ""),
          testHogan: String(row["Test Hogan"] || ""),
          seleccionado: normalizeReclutamientoCampo(row["Seleccionado"], "seleccionado"),
          cartaOferta: String(row["Carta Oferta"] || ""),
          envioCartaOferta: String(row["Envio carta Oferta"] || row["Envío carta oferta"] || ""),
          firmaCartaOferta: normalizeReclutamientoCampo(row["Firma Carta Oferta"], "firmaCartaOferta"),
          fechaIngreso: normalizeDateFromXlsx(row["Fecha Ingreso"] || row["Fecha ingreso"]),
          reclutador: reclutadorNombre, proceso, reclutadorId,
          prioridad: String(row["Prioridad"] || "P3 Medio"),
          bloqueadoPor: String(row["Bloqueado por"] || "Sin bloqueo"),
          proximaAccion: String(row["Próxima acción"] || ""),
          fechaProximaAccion: normalizeDateFromXlsx(row["Fecha próxima acción"]),
          observaciones: String(row["Observaciones"] || ""),
          ultimaActualizacion: normalizeDateFromXlsx(row["Última actualización"]) || new Date().toISOString().split("T")[0],
          _hasError: false, _hasWarning: hasWarn
        });
      });
      return { registros, erroresList, advertenciasList };
    });

    result.contactosNuevos = contactosActualizados.filter((c: any) =>
      !data.contactos.find((existing: any) => existing.id === c.id)
    );

    return result;
  };

  const restaurarEjemplos = () => {
    setConfirm({
      title: "Restaurar datos de ejemplo",
      message: "Se perderán los datos actuales y se reemplazarán por datos de ejemplo.",
      variant: "warning",
      confirmLabel: "Restaurar",
      onConfirm: () => {
        logAudit("backup:restore", { detail: "Restaurar datos de ejemplo" });
        runBackupAndToast("restaurar");
        limpiarDatos();
        setData(crearDatosEjemplo());
        toastShow("Datos de ejemplo restaurados", { type: "success" });
        setConfirm(null);
      },
    });
  };

  const limpiarTodo = () => {
    setConfirm({
      title: "Eliminar todos los datos",
      message: "Esta acción no se puede deshacer. Se creará un respaldo antes de limpiar.",
      variant: "warning",
      confirmLabel: "Continuar",
      onConfirm: () => {
        setConfirm({
          title: "Confirmación final",
          message: "Se borrará todo definitivamente. ¿Deseas continuar?",
          variant: "danger",
          confirmLabel: "Eliminar definitivamente",
          onConfirm: () => {
            logAudit("record:delete", { detail: "Limpiar todos los datos del sistema" });
            runBackupAndToast("limpiar");
            limpiarDatos();
            setData({
              ...crearDatosEjemplo(),
              cursos: [],
              ocs: [],
              practicantes: [],
              presupuesto: [],
              procesos: [],
              diplomas: [],
              cargaSemanal: [],
              contactos: [],
              evaluacionesPsicolaborales: [],
              valesGas: [],
              valesGasOrganizacion: [],
              reclutamiento: [],
            });
            toastShow("Todos los datos eliminados", { type: "success" });
            setConfirm(null);
          },
        });
      },
    });
  };

  const logout = () => { logAudit("logout", { detail: "Cierre de sesión manual" }); authLogout(); setAuthenticated(false); toastShow("Sesión cerrada", { type: "info" }); };

  // ── CRUD OPERATIONS ────────────────────────

  const openNew = (modulo: string) => { setModalModulo(modulo); setEditItem(null); setModalOpen(true); };
  const openEdit = (modulo: string, item: any) => { setModalModulo(modulo); setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const deleteItem = (modulo: string, id: string) => {
    // Protect contacts that are in use as responsable
    if (modulo === "contactos") {
      const allModules = ["cursos", "ocs", "practicantes", "presupuesto", "procesos", "diplomas", "evaluacionesPsicolaborales"];
      const usedIn: string[] = [];
      allModules.forEach(m => {
        const arr = (data as any)[m] || [];
        if (arr.some((x: any) => x.responsableId === id)) usedIn.push(m);
      });
      if (usedIn.length > 0) {
        setConfirm({
          title: "Eliminar contacto con reasignación",
          message: `Este contacto está asignado como responsable en: ${usedIn.join(", ")}. ¿Reasignar a "Sin responsable" y eliminar?`,
          variant: "warning",
          confirmLabel: "Reasignar y eliminar",
          onConfirm: () => {
            logAudit("record:delete", { module: "contactos", recordId: id, detail: "Eliminado con reasignación de responsable" });
            setData(d => {
              const nd = { ...d };
              allModules.forEach(m => {
                (nd as any)[m] = (nd as any)[m].map((x: any) => x.responsableId === id ? { ...x, responsableId: "" } : x);
              });
              nd.contactos = nd.contactos.filter(c => c.id !== id);
              return nd;
            });
            toastShow("Contacto eliminado", { type: "success", message: "Los registros fueron reasignados a \"Sin responsable\"." });
            setConfirm(null);
          }
        });
        return;
      }
    }
    setConfirm({
      title: "Eliminar registro",
      message: "Esta acción no se puede deshacer.",
      variant: "danger",
      confirmLabel: "Eliminar",
      onConfirm: () => {
        logAudit("record:delete", { module: modulo, recordId: id });
        setData(d => { const nd = { ...d }; (nd as any)[modulo] = (nd as any)[modulo].filter((x: any) => x.id !== id); return nd; });
        toastShow("Registro eliminado", { type: "success" });
        setConfirm(null);
      },
    });
  };

  const duplicateItem = (modulo: string, item: any) => {
    logAudit("record:duplicate", { module: modulo, recordId: item.id });
    runBackupAndToast("crear");
    setData(d => {
      const nd = { ...d };
      const arr = [...(nd as any)[modulo]];
      const newItem = duplicateRecord(modulo, item, genId());
      arr.push(newItem);
      (nd as any)[modulo] = arr;
      return nd;
    });
    toastShow("Registro duplicado correctamente", { type: "success" });
  };

  const saveItem = (modulo: string, item: any) => {
    const isEdit = !!editItem;
    runBackupAndToast(isEdit ? "editar" : "crear");
    logAudit(isEdit ? "record:edit" : "record:create", { module: modulo, recordId: item.id || editItem?.id });
    setData(d => {
      const nd = { ...d };
      const arr = [...(nd as any)[modulo]];
      if (isEdit) {
        const idx = arr.findIndex((x: any) => x.id === editItem.id);
        if (idx >= 0) arr[idx] = { ...item, ultimaActualizacion: hoy() };
      } else {
        arr.push({ ...item, id: genId(), ultimaActualizacion: hoy() });
      }
      (nd as any)[modulo] = arr;
      return nd;
    });
    closeModal();
    toastShow(isEdit ? "Registro actualizado" : "Registro creado", { type: "success" });
  };

  // ── CAPTURA RÁPIDA ─────────────────────────
  const ensureSinResponsable = (): string => {
    const existing = data.contactos.find(c => c.nombre.trim().toLowerCase() === "sin responsable");
    if (existing) return existing.id;
    const newId = genId();
    const newContact: Contacto = {
      id: newId, nombre: "Sin responsable", rol: "Auto", areaEmpresa: "",
      correo: "", telefono: "", relacion: "Interno", activo: "Sí",
      observaciones: "Contacto base creado automáticamente para capturas rápidas",
    };
    setData(d => ({ ...d, contactos: [...d.contactos, newContact] }));
    return newId;
  };

  // Saves a minimal record across any of the 6 main modules with a single form.
  const saveCaptura = (capture: { tipo: string; nombre: string; prioridad: string; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; observaciones: string; }) => {
    const today = hoy();
    const baseId = genId();
    const resolvedResponsableId = capture.responsableId || ensureSinResponsable();
    const baseFields = {
      id: baseId,
      prioridad: capture.prioridad,
      responsableId: resolvedResponsableId,
      proximaAccion: capture.proximaAccion,
      fechaProximaAccion: capture.fechaProximaAccion,
      bloqueadoPor: capture.bloqueadoPor || "Sin bloqueo",
      observaciones: capture.observaciones,
      ultimaActualizacion: today,
    };

    type CapturaTarget = { modulo: Modulo; dataKey: keyof AppData };
    let target: CapturaTarget = { modulo: "cursos", dataKey: "cursos" };
    let newItem: any = {};

    switch (capture.tipo) {
      case "Curso":
        target = { modulo: "cursos", dataKey: "cursos" };
        newItem = {
          ...baseFields, curso: capture.nombre, origen: "Urgente no planificado", area: "", solicitante: "",
          fechaSolicitud: today, fechaRequerida: capture.fechaProximaAccion || "", estado: "Pendiente revisar",
          nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "", montoEstimado: 0,
        };
        break;
      case "OC":
        target = { modulo: "ocs", dataKey: "ocs" };
        newItem = {
          ...baseFields, numeroOC: capture.nombre, categoriaOC: "", cursoAsociado: "", proveedor: "", monto: 0,
          fechaSolicitud: today, fechaLimite: capture.fechaProximaAccion || "", estadoOC: "Pendiente crear",
          accionPendiente: capture.proximaAccion,
        };
        break;
      case "Practicante":
        target = { modulo: "practicantes", dataKey: "practicantes" };
        newItem = {
          ...baseFields, nombre: capture.nombre, area: "", especialidad: "",
          fechaInicio: "", fechaTermino: "", costoMensual: 0, estado: "Por buscar",
          proximoPaso: capture.proximaAccion,
        };
        break;
      case "Diploma / Certificado / Licencia":
        target = { modulo: "diplomas", dataKey: "diplomas" };
        newItem = {
          ...baseFields, cursoAsociado: capture.nombre, participante: "", tipoDocumento: "Diploma",
          otec: "", etapa: "Pedir a la OTEC", fechaSolicitudOTEC: "", fechaRecepcionDoc: "",
          fechaEnvioParticipante: "", fechaSubidaBUK: "", estadoBUK: "Pendiente subir",
        };
        break;
      case "Evaluación Psicolaboral":
        target = { modulo: "evaluaciones", dataKey: "evaluacionesPsicolaborales" };
        newItem = {
          ...baseFields, mes: MESES[new Date().getMonth()], ano: new Date().getFullYear(),
          cargo: capture.nombre, area: "", candidato: "", rut: "", tipoEvaluacion: "Psicolaboral",
          proveedor: "", fechaSolicitud: today, fechaEvaluacion: "", fechaEntregaInforme: "",
          estado: "Pendiente solicitar", resultado: "Pendiente", costo: 0, requiereOC: "No", numeroOC: "",
        };
        break;
      case "Vale de Gas":
        target = { modulo: "valesGas", dataKey: "valesGas" };
        newItem = {
          ...baseFields, colaborador: capture.nombre, contactoId: "", area: "", periodo: "",
          fechaEntrega: today, totalValesAsignados: 0, valesUsados: 0, descuentoDiario: 0,
          diasDescuento: 0, totalDescontado: 0, saldoVales: 0, estado: "Pendiente entregar",
          fechaProximaRevision: capture.fechaProximaAccion || "",
        };
        break;
      case "Proceso Pendiente":
        target = { modulo: "procesos", dataKey: "procesos" };
        newItem = {
          ...baseFields, proceso: capture.nombre, tipo: "Otro", estadoActual: "Pendiente revisar",
          queFalta: capture.proximaAccion, fechaLimite: capture.fechaProximaAccion || "", riesgo: "",
        };
        break;
      case "Reclutamiento":
        target = { modulo: "reclutamiento", dataKey: "reclutamiento" };
        newItem = {
          ...baseFields,
          reclutamiento: "Por definir",
          plantaCentro: capture.nombre || "",
          tipoVacante: "Por definir",
          mesIngreso: new Date().toLocaleString("es-CL", { month: "long" }).replace(/^\w/, (c: string) => c.toUpperCase()),
          revisadoPPTO: "", procesoBuk: "", publicado: "", seleccionCV: "",
          cvSeleccionadoBuk: "", entrevistaJefatura: "", entrevistaGP: "",
          testPsicolaboral: "", testHogan: "", seleccionado: "", cartaOferta: "",
          envioCartaOferta: "", firmaCartaOferta: "", fechaIngreso: "",
          reclutador: "", proceso: "Abierto",
          proximaAccion: capture.proximaAccion || "",
          fechaProximaAccion: capture.fechaProximaAccion || "",
        };
        break;
      default:
        return;
    }

    setData(d => {
      const nd = { ...d };
      (nd as any)[target.dataKey] = [...(nd as any)[target.dataKey], newItem];
      return nd;
    });
    setCaptureOpen(false);
    toastShow("Captura guardada correctamente", {
      type: "success",
      action: {
        label: "Ir al módulo",
        onClick: () => setActiveModulo(target.modulo),
      },
    });
  };

  const markClosed = (modulo: string, id: string, closedState: string) => {
    setConfirm({
      title: "Cerrar registro",
      message: "Se marcará como cerrado. Esta acción no elimina información.",
      variant: "warning",
      confirmLabel: "Cerrar",
      onConfirm: () => {
        logAudit("record:close", { module: modulo, recordId: id });
        setData(d => {
          const nd = { ...d };
          const arr = [...(nd as any)[modulo]];
          const idx = arr.findIndex((x: any) => x.id === id);
          if (idx >= 0) {
            arr[idx] = markRecordClosed(modulo, arr[idx], closedState);
          }
          (nd as any)[modulo] = arr;
          return nd;
        });
        toastShow("Estado actualizado", { type: "success" });
        setConfirm(null);
      },
    });
  };

  // Permission-gated action wrappers — pass undefined when role lacks the permission
  // so DataTable hides the button rather than calling undefined()
  const permDeleteItem = can(currentRole, "record:delete") ? deleteItem : undefined;
  const permDuplicateItem = can(currentRole, "record:duplicate") ? duplicateItem : undefined;
  const permMarkClosed = can(currentRole, "record:close") ? markClosed : undefined;
  const canExportFull = can(currentRole, "data:export:full");
  const canExportSummary = can(currentRole, "data:export:summary");
  const canExportAnonymized = can(currentRole, "data:export:anonymized");

  // ── DASHBOARD DATA ─────────────────────────

  const dashboardData = useMemo(() => {
    const hoyStr = hoy();
    const hace7 = new Date(hoyStr); hace7.setDate(hace7.getDate() - 7); const hace7Str = hace7.toISOString().slice(0, 10);

    const cursosAbiertos = data.cursos.filter(c => !isClosedRecord(c, "cursos")).length;
    const cursosP1 = data.cursos.filter(c => c.prioridad === "P1 Crítico" && !isClosedRecord(c, "cursos")).length;
    const ocsPendientes = data.ocs.filter(o => !isClosedRecord(o, "ocs")).length;
    const diplomasBUK = data.diplomas.filter(d => d.estadoBUK === "Pendiente subir").length;
    const evaluacionesAbiertas = data.evaluacionesPsicolaborales.filter(e => !isClosedRecord(e, "evaluacionesPsicolaborales")).length;
    const evaluacionesInformePendiente = data.evaluacionesPsicolaborales.filter(e => e.estado === "Realizada" && e.resultado === "Pendiente").length;
    const presupuestoUsado = data.presupuesto.reduce((s, p) => s + p.gastado, 0);
    const presupuestoTotal = data.presupuesto.reduce((s, p) => s + p.presupuestoTotal, 0);
    const procesosBloqueados = data.procesos.filter(p => p.bloqueadoPor !== "Sin bloqueo" && !isClosedRecord(p, "procesos")).length;
    const sinActualizar = [...data.cursos, ...data.procesos, ...data.diplomas, ...data.evaluacionesPsicolaborales].filter((x: any) => x.ultimaActualizacion && x.ultimaActualizacion < hace7Str && !["Cerrado", "Cerrada", "Completado", "Finalizado", "Subido"].includes(x.estado || x.etapa)).length;
    const valesGasActivos = (data.valesGas || []).filter(v => v.estado !== "Cerrado" && v.estado !== "Detenido").length;
    const valesGasEnDescuento = (data.valesGas || []).filter(v => v.estado === "En descuento").length;
    const valesGasSaldoTotal = (data.valesGas || []).reduce((s, v) => s + (v.saldoVales || 0), 0);
    const valesGasVencidos = (data.valesGas || []).filter(v => v.fechaProximaRevision && semaforo(v.fechaProximaRevision).label === "Vencido" && v.estado !== "Cerrado").length;
    const valesGasStockOrg = (data.valesGasOrganizacion || []).reduce((s, v) => v.tipoMovimiento === "Ajuste negativo" ? s - (v.cantidadVales || 0) : s + (v.cantidadVales || 0), 0);
    const valesGasAsignados = (data.valesGas || []).reduce((s, v) => s + (v.totalValesAsignados || 0), 0);
    const valesGasSaldoOrg = valesGasStockOrg - valesGasAsignados;

    // Bandeja priorizada
    interface ItemBandeja { order: number; tipo: string; nombre: string; prioridad: string; estado: string; bloqueadoPor: string; proximaAccion: string; fechaProximaAccion: string; responsableId: string; modulo: string; id?: string; }
    const bandeja: ItemBandeja[] = [];

    data.cursos.filter(c => !isClosedRecord(c, "cursos")).forEach(c => {
      const s = semaforo(c.fechaProximaAccion || c.fechaRequerida);
      const order = s.label === "Vencido" ? 1
        : c.prioridad === "P1 Crítico" ? 2
        : c.bloqueadoPor !== "Sin bloqueo" ? 3
        : s.label === "Vence hoy" ? 4
        : s.label === "1-3 días" ? 5
        : c.ultimaActualizacion && c.ultimaActualizacion < hace7Str ? 8
        : c.prioridad === "P2 Alto" ? 9
        : c.prioridad === "P3 Medio" ? 10
        : 11;
      bandeja.push({ order, tipo: "Curso", nombre: c.curso, prioridad: c.prioridad, estado: c.estado, bloqueadoPor: c.bloqueadoPor, proximaAccion: c.proximaAccion, fechaProximaAccion: c.fechaProximaAccion, responsableId: c.responsableId, modulo: "cursos" });
    });

    data.ocs.filter(o => !isClosedRecord(o, "ocs")).forEach(o => {
      const s = semaforo(o.fechaLimite);
      const order = s.label === "Vencido" ? 1
        : o.prioridad === "P1 Crítico" ? 2
        : o.bloqueadoPor !== "Sin bloqueo" ? 3
        : s.label === "Vence hoy" ? 4
        : s.label === "1-3 días" ? 5
        : o.ultimaActualizacion && o.ultimaActualizacion < hace7Str ? 8
        : 10;
      bandeja.push({ order, tipo: "OC", nombre: `${o.numeroOC} - ${o.cursoAsociado}`, prioridad: o.prioridad, estado: o.estadoOC, bloqueadoPor: o.bloqueadoPor, proximaAccion: o.accionPendiente, fechaProximaAccion: o.fechaLimite, responsableId: o.responsableId, modulo: "ocs" });
    });

    data.diplomas.filter(d => !isClosedRecord(d, "diplomas")).forEach(d => {
      const s = semaforo(d.fechaProximaAccion);
      const order = d.etapa === "Subir a BUK" && d.estadoBUK === "Pendiente subir" ? 6
        : s.label === "Vencido" ? 1
        : d.prioridad === "P1 Crítico" ? 2
        : d.bloqueadoPor !== "Sin bloqueo" ? 3
        : s.label === "Vence hoy" ? 4
        : s.label === "1-3 días" ? 5
        : 10;
      bandeja.push({ order, tipo: "Diploma/Cert/Lic", nombre: `${d.tipoDocumento} - ${d.participante}`, prioridad: d.prioridad, estado: d.etapa, bloqueadoPor: d.bloqueadoPor, proximaAccion: d.proximaAccion, fechaProximaAccion: d.fechaProximaAccion, responsableId: d.responsableId, modulo: "diplomas" });
    });

    data.evaluacionesPsicolaborales.filter(e => !isClosedRecord(e, "evaluacionesPsicolaborales")).forEach(e => {
      const s = semaforo(e.fechaProximaAccion || e.fechaEntregaInforme);
      const order = s.label === "Vencido" ? 1
        : e.prioridad === "P1 Crítico" ? 2
        : e.bloqueadoPor !== "Sin bloqueo" ? 3
        : e.estado === "Realizada" && e.resultado === "Pendiente" ? 7
        : s.label === "Vence hoy" ? 4
        : s.label === "1-3 días" ? 5
        : 10;
      bandeja.push({ order, tipo: "Evaluación Psico", nombre: `${e.cargo} - ${e.candidato}`, prioridad: e.prioridad, estado: e.estado, bloqueadoPor: e.bloqueadoPor, proximaAccion: e.proximaAccion, fechaProximaAccion: e.fechaProximaAccion, responsableId: e.responsableId, modulo: "evaluaciones" });
    });

    data.procesos.filter(p => !isClosedRecord(p, "procesos")).forEach(p => {
      const s = semaforo(p.fechaProximaAccion || p.fechaLimite);
      const order = s.label === "Vencido" ? 1
        : p.prioridad === "P1 Crítico" ? 2
        : p.bloqueadoPor !== "Sin bloqueo" ? 3
        : s.label === "Vence hoy" ? 4
        : 10;
      bandeja.push({ order, tipo: "Proceso", nombre: p.proceso, prioridad: p.prioridad, estado: p.estadoActual, bloqueadoPor: p.bloqueadoPor, proximaAccion: p.proximaAccion, fechaProximaAccion: p.fechaProximaAccion, responsableId: p.responsableId, modulo: "procesos" });
    });

    (data.valesGas || []).filter(v => v.estado !== "Cerrado" && v.estado !== "Detenido").forEach(v => {
      const s = semaforo(v.fechaProximaRevision);
      const order = s.label === "Vencido" ? 1
        : v.estado === "En descuento" ? 5
        : s.label === "Vence hoy" ? 4
        : s.label === "1-3 días" ? 6
        : 11;
      bandeja.push({ order, tipo: "Vale Gas", nombre: `${v.colaborador} - ${v.periodo}`, prioridad: "P3 Medio", estado: v.estado, bloqueadoPor: "Sin bloqueo", proximaAccion: v.observaciones || "", fechaProximaAccion: v.fechaProximaRevision, responsableId: v.responsableId, modulo: "valesGas" });
    });

    (data.reclutamiento || []).filter((r: ProcesoReclutamiento) => !["Cerrado", "Desistido"].includes(r.proceso)).forEach((r: ProcesoReclutamiento) => {
      const fechaRef = r.fechaProximaAccion || r.fechaIngreso;
      const s = semaforo(fechaRef);
      const order = s.order + (r.prioridad === "P1 Crítico" ? -0.5 : 0);
      if (s.order <= 3 || r.proceso === "Pausado" || (r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo")) {
        bandeja.push({ order, tipo: "Reclutamiento", nombre: `${r.reclutamiento || "Proceso"} - ${r.plantaCentro}`, prioridad: r.prioridad, estado: r.proceso, bloqueadoPor: r.bloqueadoPor, proximaAccion: r.proximaAccion, fechaProximaAccion: fechaRef, responsableId: r.reclutadorId, modulo: "reclutamiento" });
      }
    });

    // Alertas de reclutamiento
    const reclAbiertos = (data.reclutamiento || []).filter((r: any) => r.proceso === "Abierto").length;
    const reclPausados = (data.reclutamiento || []).filter((r: any) => r.proceso === "Pausado").length;
    const reclBloqueados = (data.reclutamiento || []).filter((r: any) => !["Cerrado","Desistido"].includes(r.proceso) && r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo").length;
    const reclSinReclutador = (data.reclutamiento || []).filter((r: any) => !r.reclutador && !r.reclutadorId).length;
    const hoy7 = new Date(); hoy7.setDate(hoy7.getDate() + 7);
    const reclIngresosProximos = (data.reclutamiento || []).filter((r: any) => { if (!r.fechaIngreso) return false; const df = new Date(r.fechaIngreso); return df >= new Date() && df <= hoy7; }).length;

    bandeja.sort((a, b) => a.order - b.order);

    const semaforoCounts = { vencido: 0, venceHoy: 0, unoATres: 0, cuatroASiete: 0, sinUrgencia: 0, sinFecha: 0 };
    const allItems = [...data.cursos.filter(c => !isClosedRecord(c, "cursos")).map(c => c.fechaProximaAccion || c.fechaRequerida), ...data.ocs.filter(o => !isClosedRecord(o, "ocs")).map(o => o.fechaLimite), ...data.diplomas.map(d => d.fechaProximaAccion), ...data.procesos.map(p => p.fechaProximaAccion || p.fechaLimite), ...data.evaluacionesPsicolaborales.map(e => e.fechaProximaAccion || e.fechaEntregaInforme)];
    allItems.forEach(f => {
      const s = semaforo(f);
      if (s.label === "Vencido") semaforoCounts.vencido++;
      else if (s.label === "Vence hoy") semaforoCounts.venceHoy++;
      else if (s.label === "1-3 días") semaforoCounts.unoATres++;
      else if (s.label === "4-7 días") semaforoCounts.cuatroASiete++;
      else if (s.label === "Sin urgencia") semaforoCounts.sinUrgencia++;
      else semaforoCounts.sinFecha++;
    });

    return { cursosAbiertos, cursosP1, ocsPendientes, diplomasBUK, evaluacionesAbiertas, evaluacionesInformePendiente, presupuestoUsado, presupuestoTotal, procesosBloqueados, sinActualizar, bandeja, semaforoCounts, valesGasActivos, valesGasEnDescuento, valesGasSaldoTotal, valesGasVencidos, valesGasStockOrg, valesGasAsignados, valesGasSaldoOrg, reclAbiertos, reclPausados, reclBloqueados, reclSinReclutador, reclIngresosProximos };
  }, [data]);

  // ── CHARTS ─────────────────────────────────

  const chartCursosPorPrioridad = useMemo(() => {
    const counts: Record<string, number> = { "P1 Crítico": 0, "P2 Alto": 0, "P3 Medio": 0, "P4 Bajo": 0 };
    data.cursos.filter(c => c.estado !== "Cerrado").forEach(c => { if (counts[c.prioridad] !== undefined) counts[c.prioridad]++; });
    return { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ["#DC2626", "#EA580C", "#F59E0B", "#16A34A"] }] };
  }, [data]);

  const chartEvaluacionesPorEstado = useMemo(() => {
    const map: Record<string, number> = {};
    data.evaluacionesPsicolaborales.forEach(e => { map[e.estado] = (map[e.estado] || 0) + 1; });
    return { labels: Object.keys(map), datasets: [{ data: Object.values(map), backgroundColor: ["#9CA3AF", "#3B82F6", "#60A5FA", "#8B5CF6", "#14B8A6", "#F59E0B", "#16A34A", "#6B7280"] }] };
  }, [data]);

  const chartPresupuesto = useMemo(() => {
    return { labels: data.presupuesto.map(p => p.concepto), datasets: [{ label: "Gastado", data: data.presupuesto.map(p => p.gastado), backgroundColor: "#DC2626" }, { label: "Disponible", data: data.presupuesto.map(p => p.presupuestoTotal - p.gastado), backgroundColor: "#16A34A" }] };
  }, [data]);

  // ── MODULES RENDER ────────────────────────

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;
  if (unlockOpen) {
    return (
      <EncryptionUnlock
        passphrase={unlockPassphrase}
        setPassphrase={setUnlockPassphrase}
        error={unlockError}
        onUnlock={handleUnlock}
      />
    );
  }
  if (!dataReady) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={6} />
        </div>
      </div>
    );
  }

  // ── INSTRUCTIONS MODAL ────────────────────

  const instructionsContent = `
# Guía rápida de uso del Control Operativo

## 1. Regla de oro
"Si no está registrado aquí, no existe para seguimiento."

## 2. Rutina semanal recomendada
- **Lunes:** Revisar cursos, OCs y presupuesto.
- **Miércoles:** Revisar diplomas/certificados/licencias, BUK y evaluaciones psicolaborales.
- **Viernes:** Cerrar pendientes, actualizar estados y preparar la semana siguiente.

## 3. Cómo usar el Dashboard
El dashboard responde:
- Qué está crítico (P1)
- Qué está vencido o por vencer
- Qué está bloqueado
- Qué debo hacer primero hoy
- Qué está pendiente de BUK
- Qué evaluaciones están pendientes o bloqueadas

## 4. Cómo registrar un curso
- Ir a Control Cursos
- Crear nuevo registro
- Definir origen, estado, prioridad, responsable y próxima acción
- Si requiere OC, asociar OC
- Actualizar hasta cerrar

## 5. Cómo controlar OCs
- Crear OC
- Asociarla a curso o servicio
- Definir estado y fecha límite
- Revisar bloqueos

## 6. Cómo controlar diplomas/certificados/licencias
- Crear registro asociado al curso
- Seguir etapas: Pedir a la OTEC → Enviar al participante → Subir a BUK → Completado
- Revisar pendientes de BUK en Dashboard

## 7. Cómo controlar evaluaciones psicolaborales
- Crear evaluación por mes, cargo y candidato
- Registrar proveedor/psicólogo
- Definir fecha de evaluación y fecha entrega informe
- Actualizar resultado
- Cerrar cuando esté revisada

## 8. Cómo usar responsables/contactos
- Todo responsable debe existir en Contactos
- Crear contacto antes de asignarlo
- Usar solo contactos activos
- Mantener correos y roles actualizados

## 9. Cómo respaldar información
- Exportar JSON semanalmente
- Exportar XLSX para reportes
- Importar JSON solo si se confía en el archivo
- Guardar respaldo con fecha

## 10. Buenas prácticas
- No dejar fecha próxima acción vacía en temas críticos
- Actualizar estados el mismo día
- Cerrar lo finalizado
- Usar observaciones para contexto breve
- Revisar bloqueos antes de pedir ayuda
  `.trim();

  const copyInstructions = () => { navigator.clipboard.writeText(instructionsContent); toastShow("Instrucciones copiadas", { type: "success" }); };
  const downloadInstructions = () => {
    const blob = new Blob([instructionsContent], { type: "text/plain" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "instrucciones_kata_v5.txt";
    a.click();
    URL.revokeObjectURL(url);
    toastShow("Instrucciones descargadas", { type: "success" });
  };

  // ── MAIN RENDER ────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-[60px]"} bg-[#0F172A] text-white transition-all duration-300 flex flex-col shrink-0 border-r border-white/5`}>
        {/* Logo / Brand */}
        <div className={`flex items-center border-b border-white/10 ${sidebarOpen ? "px-4 py-4 gap-3" : "px-3 py-4 justify-center"}`}>
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-base shrink-0 font-bold shadow-md shadow-blue-900/50">TC</div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white leading-tight">PulsoLaboral</div>
              <div className="text-[10px] text-white/40 leading-tight">Control Operativo</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/30 hover:text-white/70 w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors shrink-0"
            aria-label={sidebarOpen ? "Contraer sidebar" : "Expandir sidebar"}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5" aria-label="Navegación principal">
          {navGroups.map((grp, gi) => (
            <div key={gi} className={grp.group ? "mt-3" : ""}>
              {grp.group && sidebarOpen && (
                <div className="px-4 pt-1 pb-1.5 text-[11px] font-bold tracking-[0.12em] text-white/30 uppercase">{grp.group}</div>
              )}
              {!grp.group && !sidebarOpen && gi > 0 && <div className="mx-3 my-2 h-px bg-white/10" />}
              {grp.items.map(m => {
                const active = activeModulo === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setActiveModulo(m.key)}
                    title={!sidebarOpen ? m.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`w-full text-left flex items-center gap-3 text-sm transition-all relative
                      ${sidebarOpen ? "px-4 py-2.5 mx-0" : "px-0 py-2.5 mx-0 justify-center"}
                      ${active
                        ? "bg-blue-600/20 text-white font-semibold"
                        : "text-white/55 hover:bg-white/6 hover:text-white/90"
                      }`}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />
                    )}
                    <span className={`text-base leading-none ${sidebarOpen ? "" : "mx-auto"}`}>{m.icon}</span>
                    {sidebarOpen && <span className="truncate">{m.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 space-y-1">
          {sidebarOpen && (
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              <input type="checkbox" checked={focusMode} onChange={toggleFocusMode} className="sr-only peer" aria-label="Modo enfoque" />
              <div className="w-8 h-4 bg-white/15 rounded-full peer-checked:bg-blue-500 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4 shrink-0" />
              <span className="text-xs text-white/50">Modo enfoque</span>
            </label>
          )}
          <button
            onClick={logout}
            className={`w-full text-left text-sm text-rose-300/70 hover:text-rose-200 hover:bg-white/5 rounded-lg transition-colors ${sidebarOpen ? "px-3 py-2" : "py-2 flex justify-center"}`}
            title={!sidebarOpen ? "Cerrar sesión" : undefined}
          >
            {sidebarOpen ? "🚪 Cerrar sesión" : "🚪"}
          </button>
          {sidebarOpen && <div className="text-[10px] text-white/20 px-3 pt-0.5">v{data.meta.version}</div>}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto ${focusMode ? "p-4 max-w-4xl mx-auto" : "p-6"}`}>
      <ErrorBoundary>
        {activeModulo === "inicio" && (
          <div className="space-y-6">
            {/* Hero banner */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 text-white rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12" />
              <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-blue-400/5 rounded-full translate-y-8" />
              <div className="relative">
                <div className="text-xs font-semibold tracking-widest text-blue-300 uppercase mb-2">PulsoLaboral</div>
                <h1 className="text-2xl font-bold mb-2 leading-tight">Control Operativo RH</h1>
                <p className="text-blue-200 text-sm">Registra todo el mismo día · Revisa cada mañana · Cierra lo que termines</p>
              </div>
            </div>

            {/* Alerta regla de oro */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Regla de oro</p>
                <p className="text-sm text-amber-800 mt-0.5">"Si no está registrado aquí, no existe para seguimiento."</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SectionCard title="📋 Rutina semanal sugerida">
                <ul className="text-sm text-slate-600 space-y-2.5">
                  {[
                    { day: "Lunes", task: "Revisar cursos, OCs y presupuesto" },
                    { day: "Miércoles", task: "Revisar diplomas, BUK y evaluaciones psicolaborales" },
                    { day: "Viernes", task: "Cerrar pendientes, actualizar estados y preparar semana siguiente" },
                  ].map(({ day, task }) => (
                    <li key={day} className="flex gap-2">
                      <span className="inline-block w-20 shrink-0 text-xs font-bold text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 h-fit mt-0.5">{day}</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="🔑 Lógica del sistema">
                <ul className="text-sm text-slate-600 space-y-1.5">
                  {["Registrar todo el mismo día", "Actualizar estado, prioridad y bloqueo", "Usar P1/P2/P3/P4 correctamente", "Cerrar procesos finalizados", "Exportar respaldo semanal (JSON/XLSX)"].map(t => (
                    <li key={t} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{t}</li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="⚡ Accesos rápidos">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setActiveModulo("cursos"); openNew("cursos"); }} className="text-xs bg-blue-600 text-white rounded-xl px-3 py-2.5 hover:bg-blue-700 transition font-medium">+ Nuevo curso</button>
                  <button onClick={() => { setActiveModulo("ocs"); openNew("ocs"); }} className="text-xs bg-blue-600 text-white rounded-xl px-3 py-2.5 hover:bg-blue-700 transition font-medium">+ Nueva OC</button>
                  <button onClick={() => { setActiveModulo("practicantes"); openNew("practicantes"); }} className="text-xs bg-blue-600 text-white rounded-xl px-3 py-2.5 hover:bg-blue-700 transition font-medium">+ Practicante</button>
                  <button onClick={() => { setActiveModulo("diplomas"); openNew("diplomas"); }} className="text-xs bg-blue-600 text-white rounded-xl px-3 py-2.5 hover:bg-blue-700 transition font-medium">+ Diploma</button>
                  <button onClick={() => { setActiveModulo("evaluaciones"); openNew("evaluaciones"); }} className="text-xs bg-violet-600 text-white rounded-xl px-3 py-2.5 hover:bg-violet-700 transition font-medium">+ Evaluación</button>
                  {canExportFull && (
                    <>
                      <button onClick={exportJSON} className="text-xs bg-emerald-600 text-white rounded-xl px-3 py-2.5 hover:bg-emerald-700 transition font-medium">📥 Exportar JSON</button>
                      <button onClick={exportXLSX} className="text-xs bg-emerald-600 text-white rounded-xl px-3 py-2.5 hover:bg-emerald-700 transition col-span-2 font-medium">📥 Exportar XLSX</button>
                    </>
                  )}
                  {!canExportFull && canExportAnonymized && (
                    <>
                      <button onClick={exportJSONAnonymized} className="text-xs bg-emerald-600 text-white rounded-xl px-3 py-2.5 hover:bg-emerald-700 transition font-medium">📥 Exportar JSON anon.</button>
                      <button onClick={exportXLSXAnonymized} className="text-xs bg-emerald-600 text-white rounded-xl px-3 py-2.5 hover:bg-emerald-700 transition col-span-2 font-medium">📥 Exportar XLSX anon.</button>
                    </>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Resumen rápido */}
            <SectionCard title="📈 Resumen rápido">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCardUI label="Cursos abiertos" value={dashboardData.cursosAbiertos} icon="📚" variant={dashboardData.cursosAbiertos > 5 ? "warning" : "info"} onClick={() => setActiveModulo("cursos")} />
                <KpiCardUI label="P1 Críticos" value={dashboardData.cursosP1} icon="🔴" variant={dashboardData.cursosP1 > 0 ? "danger" : "success"} onClick={() => setActiveModulo("cursos")} />
                <KpiCardUI label="OCs pendientes" value={dashboardData.ocsPendientes} icon="🧾" variant={dashboardData.ocsPendientes > 3 ? "warning" : "default"} onClick={() => setActiveModulo("ocs")} />
                <KpiCardUI label="Pendientes BUK" value={dashboardData.diplomasBUK} icon="📜" variant={dashboardData.diplomasBUK > 0 ? "danger" : "success"} onClick={() => setActiveModulo("diplomas")} />
                <KpiCardUI label="Evaluaciones abiertas" value={dashboardData.evaluacionesAbiertas} icon="🧠" variant="purple" onClick={() => setActiveModulo("evaluaciones")} />
                <KpiCardUI label="Informe pendiente" value={dashboardData.evaluacionesInformePendiente} icon="⏳" variant={dashboardData.evaluacionesInformePendiente > 0 ? "warning" : "success"} onClick={() => setActiveModulo("evaluaciones")} />
                <KpiCardUI label="Presupuesto usado" value={fmtCLP(dashboardData.presupuestoUsado)} icon="💰" variant="purple" onClick={() => setActiveModulo("presupuesto")} />
                <KpiCardUI label="Procesos bloqueados" value={dashboardData.procesosBloqueados} icon="🚫" variant={dashboardData.procesosBloqueados > 0 ? "danger" : "success"} onClick={() => setActiveModulo("procesos")} />
              </div>
            </SectionCard>
          </div>
        )}

        {activeModulo === "midia" && <ModuloMiDia data={data} setActiveModulo={setActiveModulo} onCapturaRapida={() => setCaptureOpen(true)} />}
        {activeModulo === "dashboard" && (
          <div className="space-y-6">
            <PageHeader
              icon="📊"
              title="¿Qué hago primero hoy?"
              subtitle="Vista centralizada de estado operacional, alertas y prioridades."
              actions={
                <button onClick={() => setCaptureOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  ⚡ Captura rápida
                </button>
              }
            />

            {/* KPIs agrupados por área */}
            <div className="space-y-4">
              <KpiGroup title="Operacional">
                <KpiCardUI label="Cursos abiertos" value={dashboardData.cursosAbiertos} icon="📚" variant={dashboardData.cursosAbiertos > 5 ? "warning" : "info"} description="Sin cerrar" onClick={() => setActiveModulo("cursos")} />
                <KpiCardUI label="P1 Críticos" value={dashboardData.cursosP1} icon="🔴" variant={dashboardData.cursosP1 > 0 ? "danger" : "success"} description="Prioridad máxima" onClick={() => setActiveModulo("cursos")} />
                <KpiCardUI label="OCs pendientes" value={dashboardData.ocsPendientes} icon="🧾" variant={dashboardData.ocsPendientes > 3 ? "warning" : "default"} description="En proceso" onClick={() => setActiveModulo("ocs")} />
                <KpiCardUI label="Pendientes BUK" value={dashboardData.diplomasBUK} icon="📜" variant={dashboardData.diplomasBUK > 0 ? "danger" : "success"} description="Por subir" onClick={() => setActiveModulo("diplomas")} />
              </KpiGroup>
              <KpiGroup title="Personas y evaluaciones">
                <KpiCardUI label="Evaluaciones abiertas" value={dashboardData.evaluacionesAbiertas} icon="🧠" variant="purple" description="En seguimiento" onClick={() => setActiveModulo("evaluaciones")} />
                <KpiCardUI label="Informe pendiente" value={dashboardData.evaluacionesInformePendiente} icon="⏳" variant={dashboardData.evaluacionesInformePendiente > 0 ? "warning" : "success"} description="Realizada sin informe" onClick={() => setActiveModulo("evaluaciones")} />
                <KpiCardUI label="Procesos bloqueados" value={dashboardData.procesosBloqueados} icon="🚫" variant={dashboardData.procesosBloqueados > 0 ? "danger" : "success"} description="Con bloqueo activo" onClick={() => setActiveModulo("procesos")} />
                <KpiCardUI label="Sin actualizar +7d" value={dashboardData.sinActualizar} icon="🕐" variant={dashboardData.sinActualizar > 0 ? "warning" : "success"} description="Requieren revisión" />
              </KpiGroup>
              <KpiGroup title="Vales de gas">
                <KpiCardUI label="Stock organización" value={dashboardData.valesGasStockOrg} icon="⛽" variant="info" description="Total registrado" onClick={() => setActiveModulo("valesGas")} />
                <KpiCardUI label="Saldo disponible" value={dashboardData.valesGasSaldoOrg} icon="📦" variant={dashboardData.valesGasSaldoOrg < 0 ? "danger" : "success"} description="Stock − asignados" onClick={() => setActiveModulo("valesGas")} />
                <KpiCardUI label="Vales asignados" value={dashboardData.valesGasAsignados} icon="👤" variant="default" description="A colaboradores" onClick={() => setActiveModulo("valesGas")} />
                <KpiCardUI label="En descuento" value={dashboardData.valesGasEnDescuento} icon="💸" variant={dashboardData.valesGasEnDescuento > 0 ? "warning" : "default"} description="Activos" onClick={() => setActiveModulo("valesGas")} />
              </KpiGroup>
              <KpiGroup title="Reclutamiento">
                <KpiCardUI label="Procesos abiertos" value={dashboardData.reclAbiertos} icon="👥" variant="info" description="En curso" onClick={() => setActiveModulo("reclutamiento")} />
                <KpiCardUI label="Pausados" value={dashboardData.reclPausados} icon="⏸" variant={dashboardData.reclPausados > 0 ? "warning" : "success"} description="Con bloqueo" onClick={() => setActiveModulo("reclutamiento")} />
                <KpiCardUI label="Bloqueados" value={dashboardData.reclBloqueados} icon="🚧" variant={dashboardData.reclBloqueados > 0 ? "danger" : "success"} description="Requieren acción" onClick={() => setActiveModulo("reclutamiento")} />
                <KpiCardUI label="Ingresos próximos" value={dashboardData.reclIngresosProximos} icon="📅" variant={dashboardData.reclIngresosProximos > 0 ? "info" : "default"} description="En los próximos 7 días" onClick={() => setActiveModulo("reclutamiento")} />
              </KpiGroup>
            </div>

            {/* Semáforo general */}
            <SectionCard title="🚦 Semáforo general" subtitle="Distribución de urgencias por fecha próxima acción">
              <div className="flex flex-wrap gap-3">
                <SemaforoItem color="#DC2626" label="Vencido" count={dashboardData.semaforoCounts.vencido} />
                <SemaforoItem color="#EA580C" label="Vence hoy" count={dashboardData.semaforoCounts.venceHoy} />
                <SemaforoItem color="#F59E0B" label="1-3 días" count={dashboardData.semaforoCounts.unoATres} />
                <SemaforoItem color="#FBBF24" label="4-7 días" count={dashboardData.semaforoCounts.cuatroASiete} />
                <SemaforoItem color="#16A34A" label="Sin urgencia" count={dashboardData.semaforoCounts.sinUrgencia} />
                <SemaforoItem color="#9CA3AF" label="Sin fecha" count={dashboardData.semaforoCounts.sinFecha} />
              </div>
            </SectionCard>

            {/* Bandeja de acción */}
            <SectionCard title="📋 Bandeja de acción priorizada" subtitle="Los 20 ítems más urgentes de todos los módulos activos" noPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" aria-label="Bandeja de acción priorizada">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["#","Tipo","Nombre / Proceso","Prioridad","Estado","Bloqueado por","Próxima acción","Fecha","Responsable","Módulo"].map(h => (
                        <th key={h} scope="col" className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.bandeja.length === 0 ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                            <div className="text-4xl mb-3 opacity-60">🎉</div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Sin ítems urgentes por ahora</p>
                            <p className="text-xs text-slate-400">Cuando haya pendientes críticos o próximos a vencer aparecerán aquí.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      dashboardData.bandeja.slice(0, 20).map((item, i) => (
                        <tr
                          key={`${item.modulo}_${item.id || i}`}
                          tabIndex={0}
                          role="button"
                          aria-label={`Ir a ${item.nombre} en módulo ${item.modulo}`}
                          className={`border-t border-slate-100 hover:bg-blue-50/50 focus:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                          onClick={() => setActiveModulo(item.modulo as Modulo)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveModulo(item.modulo as Modulo); } }}
                        >
                          <td className="px-3 py-2.5 text-xs text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-3 py-2.5"><Badge label={item.tipo} colorClass="bg-slate-100 text-slate-600 border border-slate-200" /></td>
                          <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[200px]"><div className="truncate">{item.nombre}</div></td>
                          <td className="px-3 py-2.5"><Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} /></td>
                          <td className="px-3 py-2.5"><Badge label={item.estado} colorClass={estadoColor[item.estado] || ""} /></td>
                          <td className="px-3 py-2.5">{item.bloqueadoPor !== "Sin bloqueo" ? <Badge label={item.bloqueadoPor} colorClass="bg-red-100 text-red-700 border border-red-200" /> : <span className="text-slate-300">—</span>}</td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs max-w-[160px]"><div className="truncate">{item.proximaAccion || "—"}</div></td>
                          <td className="px-3 py-2.5">{item.fechaProximaAccion ? <SemaforoBadge fecha={item.fechaProximaAccion} /> : <span className="text-slate-300">—</span>}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">{getResponsableName(data, item.responsableId)}</td>
                          <td className="px-3 py-2.5"><span className="text-xs text-blue-600 underline">{item.modulo}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Gráficos */}
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              }
            >
              <ChartsPanel
                chartCursosPorPrioridad={chartCursosPorPrioridad}
                chartEvaluacionesPorEstado={chartEvaluacionesPorEstado}
                chartPresupuesto={chartPresupuesto}
              />
            </Suspense>

            {/* Reporte Mensual Ejecutivo */}
            <div className="border-t border-slate-200 pt-6">
              <ModuloReporteMensual data={data} toastShow={toastShow} />
            </div>
          </div>
        )}

        {activeModulo === "cursos" && <ModuloCursos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "ocs" && <ModuloOCs data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "practicantes" && <ModuloPracticantes data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "presupuesto" && <ModuloPresupuesto data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} getResponsableName={getResponsableName} />}
        {activeModulo === "procesos" && <ModuloProcesos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "diplomas" && <ModuloDiplomas data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "evaluaciones" && <ModuloEvaluaciones data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} duplicateItem={permDuplicateItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "cargaSemanal" && <ModuloCargaSemanal data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} duplicateItem={permDuplicateItem} tableLoading={tableLoading} />}
        {activeModulo === "contactos" && <ModuloContactos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} tableLoading={tableLoading} />}
        {activeModulo === "valesGas" && <ModuloValesGas data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "reclutamiento" && <ModuloReclutamiento data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={permDeleteItem} duplicateItem={permDuplicateItem} markClosed={permMarkClosed} getResponsableName={getResponsableName} tableLoading={tableLoading} />}
        {activeModulo === "configuracion" && (
          <ModuloConfiguracion
            data={data}
            exportJSON={exportJSON}
            exportJSONSummary={exportJSONSummary}
            exportJSONAnonymized={exportJSONAnonymized}
            importJSON={importJSON}
            exportXLSX={exportXLSX}
            exportXLSXAnonymized={exportXLSXAnonymized}
            exportLimpia={exportLimpia}
            restaurarEjemplos={restaurarEjemplos}
            limpiarTodo={limpiarTodo}
            showInstructions={() => setShowInstructions(true)}
            backups={backups}
            setBackups={setBackups}
            lastJSONExport={lastJSONExport}
            lastXLSXExport={lastXLSXExport}
            runBackupAndToast={runBackupAndToast}
            setData={setData}
            toastShow={toastShow}
            downloadXlsxTemplate={downloadXlsxTemplate}
            parseXlsxFile={parseXlsxFile}
            canExportFull={canExportFull}
            canExportSummary={canExportSummary}
            canExportAnonymized={canExportAnonymized}
            encryptionEnabled={encryptionEnabled}
            openEncryptionSetup={openEncryptionSetup}
            disableEncryption={handleDisableEncryption}
            exporting={exporting}
          />
        )}

        {/* Modals */}
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editItem ? "Editar registro" : "Nuevo registro"}
          size={modalModulo === "cursos" || modalModulo === "diplomas" || modalModulo === "evaluaciones" ? "xl" : "lg"}
        >
          {modalModulo === "cursos" && <FormCursos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "ocs" && <FormOCs data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "practicantes" && <FormPracticantes data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "presupuesto" && <FormPresupuesto data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "procesos" && <FormProcesos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "diplomas" && <FormDiplomas data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "evaluaciones" && <FormEvaluaciones data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "cargaSemanal" && <FormCargaSemanal data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "contactos" && <FormContactos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "valesGas" && <FormValesGas data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "valesGasOrganizacion" && <FormValeGasOrg data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "reclutamiento" && <FormReclutamiento data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
        </Modal>

        <ConfirmDialog
          isOpen={!!confirm}
          title={confirm?.title || "Confirmar acción"}
          message={confirm?.message}
          variant={confirm?.variant || "default"}
          confirmLabel={confirm?.confirmLabel}
          cancelLabel={confirm?.cancelLabel}
          onConfirm={() => { const cb = confirm?.onConfirm; if (cb) cb(); }}
          onCancel={() => setConfirm(null)}
        />

        <Modal isOpen={encryptionSetupOpen} onClose={() => setEncryptionSetupOpen(false)} title="🔐 Activar cifrado local" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">La clave protege los datos sensibles en este navegador. No se puede recuperar si la olvidas.</p>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva clave</label>
              <input
                type="password"
                value={encryptionPassphrase}
                onChange={(e) => setEncryptionPassphrase(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar clave</label>
              <input
                type="password"
                value={encryptionPassphraseConfirm}
                onChange={(e) => setEncryptionPassphraseConfirm(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repite la clave"
                autoComplete="new-password"
              />
            </div>
            {encryptionSetupError && <p className="text-red-600 text-sm">{encryptionSetupError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEncryptionSetupOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">Cancelar</button>
              <button onClick={handleEnableEncryption} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">Activar cifrado</button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showInstructions} onClose={() => setShowInstructions(false)} title="📖 Instrucciones de uso" size="xl">
          <div className="space-y-3">
            {[
              { title: "1. Regla de oro", body: "Si no está registrado aquí, no existe para seguimiento." },
              { title: "2. Rutina semanal", body: "Lunes: cursos, OCs, presupuesto · Miércoles: diplomas, BUK, evaluaciones · Viernes: cerrar pendientes y preparar próxima semana." },
              { title: "3. Dashboard y Mi Día", body: "El Dashboard muestra qué está crítico, vencido, bloqueado y qué hacer primero. Usa también Mi Día para una vista simplificada." },
              { title: "4. Cómo registrar un curso", body: "Ve a Cursos / DNC → Agregar nuevo → Define origen, estado, prioridad, responsable y próxima acción. Si requiere OC, asóciala. Actualiza hasta cerrar." },
              { title: "5. Cómo controlar OCs", body: "Crea la OC en OCs Pendientes → Asóciala al curso → Define estado y fecha límite → Revisa bloqueos periódicamente." },
              { title: "6. Diplomas, certificados y licencias", body: "Crea el registro asociado al curso → Sigue las etapas: Pedir a la OTEC → Enviar al participante → Subir a BUK → Completado." },
              { title: "7. Evaluaciones psicolaborales", body: "Crea evaluación por mes, cargo y candidato → Registra proveedor → Define fecha de evaluación e informe → Actualiza resultado y cierra." },
              { title: "8. Responsables y contactos", body: "Todo responsable debe existir primero en Contactos. Créalo antes de asignarlo. Usa solo contactos activos." },
              { title: "9. Cómo respaldar", body: "Exporta JSON semanalmente desde Configuración. Guarda el archivo en la carpeta /backups del proyecto. También puedes exportar XLSX para reportes." },
              { title: "10. Buenas prácticas", body: "No dejes fechas vacías en temas críticos. Actualiza estados el mismo día. Cierra lo finalizado. Usa observaciones breves. Revisa bloqueos antes de pedir ayuda." },
            ].map((step, idx) => (
              <details key={idx} className="bg-slate-50 rounded-xl border border-[#D9E2EC]">
                <summary className="px-5 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">{step.title}</summary>
                <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{step.body}</p>
              </details>
            ))}
          </div>
          <div className="flex gap-3 mt-6"><button onClick={copyInstructions} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">📋 Copiar todo</button><button onClick={downloadInstructions} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">📥 Descargar .txt</button></div>
        </Modal>

        {/* CAPTURA RÁPIDA: Modal global */}
        <Modal isOpen={captureOpen} onClose={() => setCaptureOpen(false)} title="⚡ Captura rápida" size="md">
          <FormCapturaRapida data={data} onCancel={() => setCaptureOpen(false)} onSave={saveCaptura} />
        </Modal>

        {/* CAPTURA RÁPIDA: Botón flotante global (visible en cualquier pantalla) */}
        <button
          onClick={() => setCaptureOpen(true)}
          title="Captura rápida"
          className="fixed bottom-6 left-6 z-[60] bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-blue-200/40 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <span className="text-lg">⚡</span>
          <span className="hidden sm:inline">+ Captura rápida</span>
        </button>

        <div aria-live="polite">
          <ToastContainer toasts={toasts.map(({ id, ...rest }) => rest)} onRemove={(index) => {
            const target = toasts[index];
            if (target) removeToast(target.id);
          }} />
        </div>
      </ErrorBoundary>
      </main>
    </div>
  );
}

// ── HELPER COMPONENTS ────────────────────────
// ── "MI DÍA" MODULE ──────────────────────────

function ModuloMiDia({ data, setActiveModulo, onCapturaRapida }: { data: AppData; setActiveModulo: (m: Modulo) => void; onCapturaRapida: () => void }) {
  const hoyStr = hoy();
  const hace7Str = new Date(new Date(hoyStr).getTime() - 7 * 86400000).toISOString().slice(0, 10);

  interface Tarjeta {
    tipo: string;
    nombre: string;
    prioridad: string;
    estado: string;
    responsable: string;
    proximaAccion: string;
    fecha: string;
    bloqueadoPor: string;
    modulo: Modulo;
    semaforoLabel: string;
    semaforoColor: string;
    order: number;
  }

    const allOpenItems = useMemo(() => {
      const items: Tarjeta[] = [];

      data.cursos.forEach(c => {
        if (isClosedRecord(c, "cursos")) return;
        const s = semaforo(c.fechaProximaAccion || c.fechaRequerida);
        items.push({
          tipo: "Curso", nombre: c.curso, prioridad: c.prioridad, estado: c.estado,
          responsable: getResponsableName(data, c.responsableId),
          proximaAccion: c.proximaAccion, fecha: c.fechaProximaAccion || c.fechaRequerida,
          bloqueadoPor: c.bloqueadoPor, modulo: "cursos",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.ocs.forEach(o => {
        if (isClosedRecord(o, "ocs")) return;
        const s = semaforo(o.fechaLimite);
        items.push({
          tipo: "OC", nombre: `${o.numeroOC} - ${o.cursoAsociado}`, prioridad: o.prioridad,
          estado: o.estadoOC, responsable: getResponsableName(data, o.responsableId),
          proximaAccion: o.accionPendiente, fecha: o.fechaLimite,
          bloqueadoPor: o.bloqueadoPor, modulo: "ocs",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.practicantes.forEach(p => {
        if (isClosedRecord(p, "practicantes")) return;
        const s = semaforo(p.fechaProximaAccion || p.fechaTermino);
        items.push({
          tipo: "Practicante", nombre: p.nombre, prioridad: "P3 Medio", estado: p.estado,
          responsable: getResponsableName(data, p.responsableId),
          proximaAccion: p.proximoPaso, fecha: p.fechaProximaAccion || p.fechaTermino,
          bloqueadoPor: p.bloqueadoPor, modulo: "practicantes",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.procesos.forEach(p => {
        if (isClosedRecord(p, "procesos")) return;
        const s = semaforo(p.fechaProximaAccion || p.fechaLimite);
        items.push({
          tipo: "Proceso", nombre: p.proceso, prioridad: p.prioridad,
          estado: p.estadoActual, responsable: getResponsableName(data, p.responsableId),
          proximaAccion: p.proximaAccion, fecha: p.fechaProximaAccion || p.fechaLimite,
          bloqueadoPor: p.bloqueadoPor, modulo: "procesos",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.diplomas.forEach(d => {
        if (isClosedRecord(d, "diplomas")) return;
        const s = semaforo(d.fechaProximaAccion);
        items.push({
          tipo: "Diploma/Cert/Lic", nombre: `${d.tipoDocumento} - ${d.participante}`,
          prioridad: d.prioridad, estado: d.etapa, responsable: getResponsableName(data, d.responsableId),
          proximaAccion: d.proximaAccion, fecha: d.fechaProximaAccion,
          bloqueadoPor: d.bloqueadoPor, modulo: "diplomas",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      data.evaluacionesPsicolaborales.forEach(e => {
        if (isClosedRecord(e, "evaluacionesPsicolaborales")) return;
        const s = semaforo(e.fechaProximaAccion || e.fechaEntregaInforme);
        items.push({
          tipo: "Eval. Psico", nombre: `${e.cargo} - ${e.candidato}`,
          prioridad: e.prioridad, estado: e.estado, responsable: getResponsableName(data, e.responsableId),
          proximaAccion: e.proximaAccion, fecha: e.fechaProximaAccion || e.fechaEntregaInforme,
          bloqueadoPor: e.bloqueadoPor, modulo: "evaluaciones",
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      (data.reclutamiento || []).forEach((r: ProcesoReclutamiento) => {
        if (["Cerrado", "Desistido"].includes(r.proceso)) return;
        const fechaRef = r.fechaProximaAccion || r.fechaIngreso;
        const s = semaforo(fechaRef);
        items.push({
          tipo: "Reclutamiento", nombre: `${r.reclutamiento || "Proceso"} - ${r.plantaCentro}`,
          prioridad: r.prioridad, estado: r.proceso, responsable: getResponsableName(data, r.reclutadorId),
          proximaAccion: r.proximaAccion, fecha: fechaRef,
          bloqueadoPor: r.bloqueadoPor, modulo: "reclutamiento" as Modulo,
          semaforoLabel: s.label, semaforoColor: s.color, order: s.order,
        });
      });

      return items;
    }, [data]);

  const blocked = (b: string) => b && b !== "Sin bloqueo" && b !== "";

  const urgenteHoy = allOpenItems.filter(item =>
    item.semaforoLabel === "Vence hoy" || item.prioridad === "P1 Crítico"
  ).sort((a, b) => a.order - b.order);

  const vencido = allOpenItems.filter(item =>
    item.semaforoLabel === "Vencido"
  ).sort((a, b) => a.order - b.order);

  const bloqueadoList = allOpenItems.filter(item =>
    blocked(item.bloqueadoPor)
  ).sort((a, b) => a.order - b.order);

  const actualizar = allOpenItems.filter(item => {
    const c = data.cursos.find((x: any) => x.curso === item.nombre);
    const ult = (c as any)?.ultimaActualizacion || "";
    return (ult && ult < hace7Str) || (!item.proximaAccion && !item.fecha);
  }).sort((a, b) => a.order - b.order);

  const secciones = [
    { title: "🔴 Urgente hoy", desc: "Fecha hoy o prioridad P1 Crítico", items: urgenteHoy, color: "border-red-300", bg: "bg-red-50/50" },
    { title: "⚠️ Vencido", desc: "Fecha límite anterior a hoy, sin cerrar", items: vencido, color: "border-orange-300", bg: "bg-orange-50/50" },
    { title: "🚫 Bloqueado", desc: "Registros con un bloqueo activo", items: bloqueadoList, color: "border-purple-300", bg: "bg-purple-50/50" },
    { title: "📝 Actualizar antes de cerrar el día", desc: "Sin actualizar hace más de 7 días o sin próxima acción", items: actualizar, color: "border-blue-300", bg: "bg-blue-50/50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">☀️ Mi Día</h1>
          <p className="text-sm text-slate-500 mt-1">Qué revisar primero hoy, sin entrar a todos los módulos.</p>
        </div>
        <button onClick={onCapturaRapida} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Captura rápida</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {secciones.map(sec => (
          <div key={sec.title} className={`bg-white rounded-xl border ${sec.color} shadow-sm overflow-hidden`}>
            <div className={`px-5 py-4 ${sec.bg} border-b ${sec.color}`}>
              <h3 className="font-bold text-slate-800 text-sm">{sec.title}</h3>
              <p className="text-xs text-slate-500">{sec.desc}</p>
            </div>
            <div className="divide-y divide-slate-100">
              {sec.items.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-green-600">
                  ✅ No hay elementos en esta categoría.
                </div>
              ) : (
                sec.items.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge label={item.tipo} colorClass="bg-slate-200 text-slate-700" />
                          <Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} />
                          <span className="text-sm font-semibold text-slate-800 truncate">{item.nombre}</span>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5">
                          <div>Estado: <span className="font-medium">{item.estado}</span> · Resp: {item.responsable}</div>
                          {item.proximaAccion && <div>Próxima acción: {item.proximaAccion}</div>}
                          {blocked(item.bloqueadoPor) && <div className="text-red-600 font-medium">Bloqueado por: {item.bloqueadoPor}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {item.fecha && <SemaforoBadge fecha={item.fecha} />}
                        <button
                          onClick={() => setActiveModulo(item.modulo)}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          Ir al módulo →
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {sec.items.length > 5 && (
                <div className="px-5 py-2 text-center">
                  <button className="text-xs text-blue-600 hover:underline">Ver {sec.items.length - 5} más...</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MODULE COMPONENTS ────────────────────────

function ModuloCursos({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroOrigen, setFiltroOrigen] = useState("");
  const [filtroSemaforo, setFiltroSemaforo] = useState("");

  const filtered = data.cursos.filter((c: Curso) => {
    if (filtroPrioridad && c.prioridad !== filtroPrioridad) return false;
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroOrigen && c.origen !== filtroOrigen) return false;
    if (filtroSemaforo) { const s = semaforo(c.fechaProximaAccion || c.fechaRequerida); if (s.label !== filtroSemaforo) return false; }
    if (search && !c.curso.toLowerCase().includes(search.toLowerCase()) && !c.proveedor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [{ key: "curso", label: "Curso" }, { key: "origen", label: "Origen", render: (r: Curso) => <Badge label={r.origen} colorClass="bg-slate-200 text-slate-700" /> }, { key: "prioridad", label: "Prioridad", render: (r: Curso) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "estado", label: "Estado", render: (r: Curso) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> }, { key: "fechaRequerida", label: "Fecha req.", render: (r: Curso) => toDDMMYYYY(r.fechaRequerida) }, { key: "semaforo", label: "Semáforo", render: (r: Curso) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaRequerida} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: Curso) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: Curso) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="📚"
        title="Cursos / DNC"
        subtitle="Control de cursos y capacitaciones planificadas y emergentes."
        actions={<button onClick={() => openNew("cursos")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Agregar nuevo</button>}
      />
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar curso o proveedor..." filters={<><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_CURSO} placeholder="Estado" /><Select value={filtroOrigen} onChange={setFiltroOrigen} options={ORIGENES_CURSO} placeholder="Origen" /><Select value={filtroSemaforo} onChange={setFiltroSemaforo} options={["Vencido", "Vence hoy", "1-3 días", "4-7 días", "Sin urgencia", "Sin fecha"]} placeholder="Semáforo" /></>} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("cursos", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("cursos", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("cursos", id, "Cerrado") : undefined}
        closedState="Cerrado"
        emptyMessage="Aún no hay cursos registrados"
        emptyHint="Crea el primero con «+ Agregar nuevo» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "curso" : "cursos"}</p>
    </div>
  );
}

function ModuloOCs({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const filtered = data.ocs.filter((o: OC) => {
    if (filtroEstado && o.estadoOC !== filtroEstado) return false;
    if (filtroPrioridad && o.prioridad !== filtroPrioridad) return false;
    if (filtroCategoria && o.categoriaOC !== filtroCategoria) return false;
    if (search && !o.numeroOC.toLowerCase().includes(search.toLowerCase()) && !o.cursoAsociado.toLowerCase().includes(search.toLowerCase()) && !o.proveedor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "numeroOC", label: "N° OC", render: (r: OC) => <span className="font-semibold">{r.numeroOC}</span> }, { key: "categoriaOC", label: "Categoría", render: (r: OC) => r.categoriaOC ? <Badge label={r.categoriaOC} colorClass="bg-indigo-100 text-indigo-700" /> : <span className="text-slate-400 text-xs">-</span> }, { key: "cursoAsociado", label: "Curso / Servicio" }, { key: "proveedor", label: "Proveedor" }, { key: "monto", label: "Monto", render: (r: OC) => fmtCLP(r.monto) }, { key: "estadoOC", label: "Estado", render: (r: OC) => <Badge label={r.estadoOC} colorClass={estadoColor[r.estadoOC] || ""} /> }, { key: "prioridad", label: "Prioridad", render: (r: OC) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "fechaLimite", label: "Fecha límite", render: (r: OC) => toDDMMYYYY(r.fechaLimite) }, { key: "semaforo", label: "Semáforo", render: (r: OC) => <SemaforoBadge fecha={r.fechaLimite} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: OC) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: OC) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="🧾"
        title="OCs Pendientes"
        subtitle="Seguimiento de órdenes de compra por categoría, estado y monto."
        actions={<button onClick={() => openNew("ocs")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nueva OC</button>}
      />
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar OC, curso o proveedor..." filters={<><Select value={filtroCategoria} onChange={setFiltroCategoria} options={CATEGORIAS_OC} placeholder="Categoría" /><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_OC} placeholder="Estado" /><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></>} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("ocs", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("ocs", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("ocs", id, "Cerrada") : undefined}
        closedState="Cerrada"
        emptyMessage="Aún no hay OCs registradas"
        emptyHint="Crea la primera con «+ Nueva OC» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "OC" : "OCs"}</p>
    </div>
  );
}

function ModuloPracticantes({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const filtered = data.practicantes.filter((p: Practicante) => {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.area.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const durMeses = (ini: string, fin: string) => ini && fin ? durMesesEntre(ini, fin) : "-";
  const columns = [{ key: "nombre", label: "Nombre" }, { key: "area", label: "Área" }, { key: "especialidad", label: "Especialidad" }, { key: "duracion", label: "Duración (meses)", render: (r: Practicante) => durMeses(r.fechaInicio, r.fechaTermino) }, { key: "costoMensual", label: "Costo/mes", render: (r: Practicante) => fmtCLP(r.costoMensual) }, { key: "costoTotal", label: "Costo total", render: (r: Practicante) => r.fechaInicio && r.fechaTermino ? fmtCLP(r.costoMensual * (durMeses(r.fechaInicio, r.fechaTermino) as number)) : "-" }, { key: "estado", label: "Estado", render: (r: Practicante) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> }, { key: "fechaTermino", label: "Fecha término", render: (r: Practicante) => toDDMMYYYY(r.fechaTermino) }, { key: "semaforo", label: "Semáforo", render: (r: Practicante) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaTermino} /> }, { key: "responsable", label: "Resp.", render: (r: Practicante) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="👤"
        title="Practicantes"
        subtitle="Control de prácticas profesionales: estado, duración y costos."
        actions={<button onClick={() => openNew("practicantes")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo practicante</button>}
      />
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar practicante o área..." filters={<Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_PRACTICANTE} placeholder="Estado" />} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("practicantes", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("practicantes", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("practicantes", id, "Finalizado") : undefined}
        closedState="Finalizado"
        emptyMessage="Aún no hay practicantes registrados"
        emptyHint="Crea el primero con «+ Nuevo practicante» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "practicante" : "practicantes"}</p>
    </div>
  );
}

function ModuloPresupuesto({ data, search, setSearch, openNew: _openNew, openEdit, deleteItem: _deleteItem }: any) {

  // Calculate dynamic breakdowns
  const budgetBreakdown = useMemo(() => {
    // 1. OCs — calculado desde registros
    const ocBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase() === "ocs" || p.concepto.toLowerCase().startsWith("oc")) || { id: "", presupuestoTotal: 0, montoComprometidoManual: 0, montoEjecutadoManual: 0, observaciones: "" };
    const ocComprometido = data.ocs.filter((o: any) => ["Pendiente crear", "Solicitada", "En aprobación"].includes(o.estadoOC)).reduce((sum: number, o: any) => sum + (o.monto || 0), 0);
    const ocEjecutado = data.ocs.filter((o: any) => ["Emitida", "Enviada proveedor", "Cerrada"].includes(o.estadoOC)).reduce((sum: number, o: any) => sum + (o.monto || 0), 0);

    // 2. Practicantes — calculado desde registros
    const pracBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("practicante")) || { id: "", presupuestoTotal: 0, observaciones: "" };
    const pracComprometido = data.practicantes.filter((p: any) => p.estado !== "Finalizado" && p.fechaInicio && p.fechaTermino).reduce((sum: number, p: any) => sum + ((p.costoMensual || 0) * durMesesEntre(p.fechaInicio, p.fechaTermino)), 0);
    const pracEjecutado = data.practicantes.filter((p: any) => p.estado === "Finalizado" && p.fechaInicio && p.fechaTermino).reduce((sum: number, p: any) => sum + ((p.costoMensual || 0) * durMesesEntre(p.fechaInicio, p.fechaTermino)), 0);

    // 3. Evaluaciones Psicolaborales — calculado desde registros
    const evalBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("evaluaci")) || { id: "", presupuestoTotal: 0, observaciones: "" };
    const evalComprometido = data.evaluacionesPsicolaborales.filter((e: any) => !["Cerrada", "Detenida"].includes(e.estado)).reduce((sum: number, e: any) => sum + (e.costo || 0), 0);
    const evalEjecutado = data.evaluacionesPsicolaborales.filter((e: any) => ["Cerrada"].includes(e.estado)).reduce((sum: number, e: any) => sum + (e.costo || 0), 0);

    const rows = [
      {
        id: ocBudgetRow.id,
        key: "oc",
        area: "Órdenes de Compra (OC)",
        presupuesto: ocBudgetRow.presupuestoTotal,
        comprometido: ocComprometido,
        ejecutado: ocEjecutado,
        saldo: ocBudgetRow.presupuestoTotal - ocEjecutado - ocComprometido,
        observaciones: ocBudgetRow.observaciones || "Calculado desde módulo OCs"
      },
      {
        id: pracBudgetRow.id,
        key: "practicante",
        area: "Practicantes",
        presupuesto: pracBudgetRow.presupuestoTotal,
        comprometido: pracComprometido,
        ejecutado: pracEjecutado,
        saldo: pracBudgetRow.presupuestoTotal - pracEjecutado - pracComprometido,
        observaciones: pracBudgetRow.observaciones || "Calculado desde módulo Practicantes"
      },
      {
        id: evalBudgetRow.id,
        key: "evaluacion",
        area: "Evaluaciones Psicolaborales",
        presupuesto: evalBudgetRow.presupuestoTotal,
        comprometido: evalComprometido,
        ejecutado: evalEjecutado,
        saldo: evalBudgetRow.presupuestoTotal - evalEjecutado - evalComprometido,
        observaciones: evalBudgetRow.observaciones || "Calculado desde módulo Evaluaciones"
      }
    ];

    return rows;
  }, [data]);

  // Compute overall global totals across all defined budget categories
  const totalPresupuesto = budgetBreakdown.reduce((s, r) => s + r.presupuesto, 0);
  const totalComprometido = budgetBreakdown.reduce((s, r) => s + r.comprometido, 0);
  const totalEjecutado = budgetBreakdown.reduce((s, r) => s + r.ejecutado, 0);
  const saldoDisponible = totalPresupuesto - totalEjecutado - totalComprometido;
  const pctTotal = totalPresupuesto > 0 ? Math.round(((totalEjecutado + totalComprometido) / totalPresupuesto) * 100) : 0;

  // Filter breakdown rows for view search if search is active
  const filteredBreakdown = budgetBreakdown.filter(row => {
    if (!search) return true;
    return row.area.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">💰 Control Financiero y Presupuesto</h1>
          <p className="text-slate-500 text-xs">Visión unificada del presupuesto, montos comprometidos, ejecutados y saldos en tiempo real.</p>
        </div>
        <p className="text-xs text-slate-400 italic">Los módulos son fijos. Solo se edita el presupuesto asignado.</p>
      </div>

      {/* 1. Resumen General Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">1. Resumen de Estado Financiero General</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center border">
            <div className="text-sm text-slate-500">Presupuesto Global Asignado</div>
            <div className="text-2xl font-bold text-slate-800">{fmtCLP(totalPresupuesto)}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
            <div className="text-sm text-orange-700">Monto Comprometido</div>
            <div className="text-2xl font-bold text-orange-600">{fmtCLP(totalComprometido)}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <div className="text-sm text-red-700">Monto Ejecutado (Gastado)</div>
            <div className="text-2xl font-bold text-red-600">{fmtCLP(totalEjecutado)}</div>
          </div>
          <div className={`rounded-lg p-4 text-center border ${saldoDisponible < 0 ? "bg-red-50 border-red-300" : "bg-green-50 border-green-200"}`}>
            <div className={`text-sm ${saldoDisponible < 0 ? "text-red-700" : "text-green-700"}`}>Saldo Disponible (Asignado − Ejecutado − Comprometido)</div>
            <div className={`text-2xl font-bold ${saldoDisponible < 0 ? "text-red-600" : "text-green-600"}`}>{fmtCLP(saldoDisponible)}</div>
            {saldoDisponible < 0 && <div className="text-xs text-red-600 font-semibold mt-1">⚠ Presupuesto excedido</div>}
          </div>
        </div>

        {/* Barra de progreso: ejecutado + comprometido vs presupuesto */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Uso del presupuesto (Ejecutado + Comprometido vs Asignado):</span>
            <span className="font-semibold">{pctTotal}% comprometido/utilizado</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
            {totalPresupuesto > 0 && (
              <>
                <div
                  className="h-4 bg-red-500 transition-all"
                  style={{ width: `${Math.min((totalEjecutado / totalPresupuesto) * 100, 100)}%` }}
                  title="Ejecutado"
                />
                <div
                  className="h-4 bg-orange-400 transition-all"
                  style={{ width: `${Math.min((totalComprometido / totalPresupuesto) * 100, Math.max(0, 100 - (totalEjecutado / totalPresupuesto) * 100))}%` }}
                  title="Comprometido"
                />
              </>
            )}
          </div>
          <div className="flex gap-4 mt-1 text-xs text-slate-500">
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>Ejecutado</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"></span>Comprometido</span>
          </div>
        </div>
      </div>

      {/* 2. Tabla por área / módulo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">2. Presupuesto por Área / Módulo</h3>
          <div className="w-64">
            <input
              type="text"
              placeholder="Filtrar por área..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3 text-right">Presupuesto Asignado</th>
                <th className="px-4 py-3 text-right">Monto Comprometido</th>
                <th className="px-4 py-3 text-right">Monto Ejecutado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-right">% Uso</th>
                <th className="px-4 py-3">Observaciones</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredBreakdown.map((row, idx) => {
                const usePct = row.presupuesto > 0 ? Math.round(((row.ejecutado + row.comprometido) / row.presupuesto) * 100) : 0;
                return (
                  <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.area}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCLP(row.presupuesto)}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">{fmtCLP(row.comprometido)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{fmtCLP(row.ejecutado)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${row.saldo < 0 ? "text-red-600" : "text-green-600"}`}>{fmtCLP(row.saldo)}{row.saldo < 0 && " ⚠"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${usePct > 90 ? "text-red-600" : usePct > 75 ? "text-orange-500" : "text-green-600"}`}>
                        {usePct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={row.observaciones}>
                      {row.observaciones}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          const originalItem = data.presupuesto.find((p: any) => p.id === row.id);
                          openEdit("presupuesto", originalItem || { concepto: row.area, presupuestoTotal: row.presupuesto, observaciones: row.observaciones });
                        }}
                        className="text-blue-600 hover:underline text-xs font-semibold"
                      >
                        Editar presupuesto
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Detalle de submontos asociados */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">3. Detalle de Submontos y Registros Asociados</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OCs list */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">Detalle de Órdenes de Compra (OCs)</h4>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Calculado</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {data.ocs.length === 0 ? (
                <p className="text-xs text-slate-400">No hay OCs registradas.</p>
              ) : (
                data.ocs.map((o: any) => (
                  <div key={o.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-700 truncate max-w-[200px]">{o.numeroOC || "S/N"} - {o.cursoAsociado}</div>
                      <div className="text-slate-400">Estado: {o.estadoOC}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{fmtCLP(o.monto)}</div>
                      <span className={`px-1 rounded text-[10px] ${["Emitida", "Enviada proveedor", "Cerrada"].includes(o.estadoOC) ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {["Emitida", "Enviada proveedor", "Cerrada"].includes(o.estadoOC) ? "Ejecutado" : "Comprometido"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Practicantes list */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">Detalle de Practicantes</h4>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Calculado</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {data.practicantes.length === 0 ? (
                <p className="text-xs text-slate-400">No hay practicantes registrados.</p>
              ) : (
                data.practicantes.map((p: any) => {
                  const m = durMesesEntre(p.fechaInicio, p.fechaTermino);
                  const total = (p.costoMensual || 0) * m;
                  return (
                    <div key={p.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-700">{p.nombre}</div>
                        <div className="text-slate-400">Duración: {m} meses ({p.estado})</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{fmtCLP(total)}</div>
                        <span className={`px-1 rounded text-[10px] ${p.estado === "Finalizado" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {p.estado === "Finalizado" ? "Ejecutado" : "Comprometido"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Evaluaciones list */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">Detalle Evaluaciones Psicolaborales</h4>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Calculado</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {data.evaluacionesPsicolaborales.length === 0 ? (
                <p className="text-xs text-slate-400">No hay evaluaciones registradas.</p>
              ) : (
                data.evaluacionesPsicolaborales.map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-700 truncate max-w-[200px]">{e.candidato} - {e.cargo}</div>
                      <div className="text-slate-400">Estado: {e.estado}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{fmtCLP(e.costo)}</div>
                      <span className={`px-1 rounded text-[10px] ${e.estado === "Cerrada" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {e.estado === "Cerrada" ? "Ejecutado" : "Comprometido"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuloProcesos({ data, search, setSearch, openNew, openEdit, deleteItem, getResponsableName, tableLoading }: any) {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const filtered = data.procesos.filter((p: Proceso) => {
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (filtroPrioridad && p.prioridad !== filtroPrioridad) return false;
    if (search && !p.proceso.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "proceso", label: "Proceso" }, { key: "tipo", label: "Tipo", render: (r: Proceso) => <Badge label={r.tipo} colorClass="bg-slate-200 text-slate-700" /> }, { key: "estadoActual", label: "Estado" }, { key: "queFalta", label: "Qué falta" }, { key: "prioridad", label: "Prioridad", render: (r: Proceso) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "riesgo", label: "Riesgo", render: (r: Proceso) => r.riesgo ? <span className="text-red-600 text-xs">{r.riesgo}</span> : "-" }, { key: "semaforo", label: "Semáforo", render: (r: Proceso) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaLimite} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: Proceso) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: Proceso) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="⏳"
        title="Procesos Pendientes"
        subtitle="Seguimiento de procesos transversales, riesgos y bloqueos."
        actions={<button onClick={() => openNew("procesos")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo proceso</button>}
      />
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar proceso..." filters={<><Select value={filtroTipo} onChange={setFiltroTipo} options={TIPOS_PROCESO} placeholder="Tipo" /><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></>} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("procesos", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("procesos", id) : undefined}
        emptyMessage="Aún no hay procesos pendientes"
        emptyHint="Crea el primero con «+ Nuevo proceso» para llevar un seguimiento formal."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "proceso" : "procesos"}</p>
    </div>
  );
}

function ModuloDiplomas({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName, tableLoading }: any) {
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroBUK, setFiltroBUK] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const filtered = data.diplomas.filter((d: Diploma) => {
    if (filtroEtapa && d.etapa !== filtroEtapa) return false;
    if (filtroBUK && d.estadoBUK !== filtroBUK) return false;
    if (filtroPrioridad && d.prioridad !== filtroPrioridad) return false;
    if (search && !d.cursoAsociado.toLowerCase().includes(search.toLowerCase()) && !d.participante.toLowerCase().includes(search.toLowerCase()) && !d.otec.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "cursoAsociado", label: "Curso asociado" }, { key: "participante", label: "Participante" }, { key: "tipoDocumento", label: "Tipo", render: (r: Diploma) => <Badge label={r.tipoDocumento} colorClass="bg-slate-200 text-slate-700" /> }, { key: "otec", label: "OTEC" }, { key: "etapa", label: "Etapa", render: (r: Diploma) => <Badge label={r.etapa} colorClass={estadoColor[r.etapa] || ""} /> }, { key: "estadoBUK", label: "BUK", render: (r: Diploma) => <Badge label={r.estadoBUK} colorClass={estadoColor[r.estadoBUK] || ""} /> }, { key: "prioridad", label: "Prioridad", render: (r: Diploma) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "semaforo", label: "Semáforo", render: (r: Diploma) => <SemaforoBadge fecha={r.fechaProximaAccion} /> }, { key: "responsable", label: "Resp.", render: (r: Diploma) => getResponsableName(data, r.responsableId) }];

  const bukPendientes = data.diplomas.filter((d: Diploma) => d.estadoBUK === "Pendiente subir").length;
  return (
    <div className="space-y-5">
      <PageHeader
        icon="📜"
        title="Diplomas / Certificados / Licencias"
        subtitle="Seguimiento de documentos por etapa: OTEC → Participante → BUK."
        actions={<button onClick={() => openNew("diplomas")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo documento</button>}
      />
      {bukPendientes > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <span className="text-sm font-semibold text-red-800">Atención BUK:</span>
            <span className="text-sm text-red-700 ml-1"><strong>{bukPendientes}</strong> {bukPendientes === 1 ? "documento pendiente" : "documentos pendientes"} de subir a BUK</span>
          </div>
        </div>
      )}
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar curso, participante u OTEC..." filters={<><Select value={filtroEtapa} onChange={setFiltroEtapa} options={ESTADOS_DIPLOMA} placeholder="Etapa" /><Select value={filtroBUK} onChange={setFiltroBUK} options={ESTADOS_BUK} placeholder="Estado BUK" /><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></>} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("diplomas", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("diplomas", id) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("diplomas", id, "Subido") : undefined}
        closedState="Subido"
        emptyMessage="Aún no hay documentos registrados"
        emptyHint="Crea el primero con «+ Nuevo documento» para hacer seguimiento de diplomas, certificados y licencias."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "documento" : "documentos"}</p>
    </div>
  );
}

function ModuloEvaluaciones({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, markClosed: _markClosed, getResponsableName, tableLoading }: any) {
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroResultado, setFiltroResultado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");

  const filtered = data.evaluacionesPsicolaborales.filter((e: Evaluacion) => {
    if (filtroMes && e.mes !== filtroMes) return false;
    if (filtroAno && e.ano !== parseInt(filtroAno)) return false;
    if (filtroEstado && e.estado !== filtroEstado) return false;
    if (filtroResultado && e.resultado !== filtroResultado) return false;
    if (filtroPrioridad && e.prioridad !== filtroPrioridad) return false;
    if (search && !e.cargo.toLowerCase().includes(search.toLowerCase()) && !e.candidato.toLowerCase().includes(search.toLowerCase()) && !e.proveedor.toLowerCase().includes(search.toLowerCase()) && !e.area.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { key: "mes", label: "Mes" },
    { key: "ano", label: "Año" },
    { key: "cargo", label: "Cargo" },
    { key: "area", label: "Área" },
    { key: "candidato", label: "Candidato" },
    { key: "tipoEvaluacion", label: "Tipo", render: (r: Evaluacion) => <Badge label={r.tipoEvaluacion} colorClass="bg-slate-200 text-slate-700" /> },
    { key: "estado", label: "Estado", render: (r: Evaluacion) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> },
    { key: "resultado", label: "Resultado", render: (r: Evaluacion) => <Badge label={r.resultado} colorClass={estadoColor[r.resultado] || ""} /> },
    { key: "prioridad", label: "Prioridad", render: (r: Evaluacion) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> },
    { key: "fechaEntregaInforme", label: "Entrega informe", render: (r: Evaluacion) => toDDMMYYYY(r.fechaEntregaInforme) },
    { key: "semaforo", label: "Semáforo", render: (r: Evaluacion) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaEntregaInforme} /> },
    { key: "bloqueadoPor", label: "Bloqueo", render: (r: Evaluacion) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" },
    { key: "costo", label: "Costo", render: (r: Evaluacion) => fmtCLP(r.costo) },
    { key: "responsable", label: "Resp.", render: (r: Evaluacion) => getResponsableName(data, r.responsableId) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="🧠"
        title="Evaluaciones Psicolaborales"
        subtitle="Control de evaluaciones por candidato, cargo, estado y resultado."
        actions={<button onClick={() => openNew("evaluaciones")} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm">+ Nueva evaluación</button>}
      />
      <FilterBar
        search={search}
        setSearch={setSearch}
        searchPlaceholder="Buscar cargo, candidato, proveedor o área..."
        filters={
          <>
            <Select value={filtroMes} onChange={setFiltroMes} options={MESES} placeholder="Mes" />
            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors"><option value="">Año</option><option value="2026">2026</option><option value="2025">2025</option></select>
            <Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_EVALUACION} placeholder="Estado" />
            <Select value={filtroResultado} onChange={setFiltroResultado} options={RESULTADOS_EVALUACION} placeholder="Resultado" />
            <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
          </>
        }
      />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("evaluaciones", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("evaluacionesPsicolaborales", id) : undefined}
        onDuplicate={duplicateItem ? (r: any) => duplicateItem("evaluacionesPsicolaborales", r) : undefined}
        emptyMessage="Aún no hay evaluaciones registradas"
        emptyHint="Crea la primera con «+ Nueva evaluación» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} {filtered.length === 1 ? "evaluación" : "evaluaciones"}</p>
    </div>
  );
}

function ModuloCargaSemanal({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, tableLoading }: any) {
  const filtered = data.cargaSemanal.filter((c: CargaSemanal) => { if (search && !c.semana.toLowerCase().includes(search.toLowerCase()) && !c.comentario.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const columns = [{ key: "semana", label: "Semana" }, { key: "cursosPlanificados", label: "Planificados" }, { key: "cursosUrgentesNuevos", label: "Urgentes nuevos" }, { key: "cursosNoPlanificados", label: "No planificados" }, { key: "ocsNuevas", label: "OCs nuevas" }, { key: "diplomasPendientes", label: "Diplomas pend." }, { key: "procesosBloqueados", label: "Proc. bloqueados" }, { key: "comentario", label: "Comentario" }];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="📅"
        title="Carga Semanal"
        subtitle="Registro de carga operativa real vs planificada por semana."
        actions={<button onClick={() => openNew("cargaSemanal")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nueva semana</button>}
      />
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar semana..." filters={null} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("cargaSemanal", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("cargaSemanal", id) : undefined}
        onDuplicate={duplicateItem ? (r: any) => duplicateItem("cargaSemanal", r) : undefined}
        emptyMessage="Aún no hay semanas registradas"
        emptyHint="Registra la primera semana para llevar estadísticas de carga operativa."
      />
      <p className="text-xs text-slate-400">{filtered.length} {filtered.length === 1 ? "semana registrada" : "semanas registradas"}</p>
    </div>
  );
}

function ModuloContactos({ data, search, setSearch, openNew, openEdit, deleteItem, tableLoading }: any) {
  const [filtroRelacion, setFiltroRelacion] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");
  const filtered = data.contactos.filter((c: Contacto) => {
    if (filtroRelacion && c.relacion !== filtroRelacion) return false;
    if (filtroActivo && c.activo !== filtroActivo) return false;
    if (search && !c.nombre.toLowerCase().includes(search.toLowerCase()) && !c.rol.toLowerCase().includes(search.toLowerCase()) && !c.areaEmpresa.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "nombre", label: "Nombre", render: (r: Contacto) => <span className="font-semibold">{r.nombre}</span> }, { key: "rol", label: "Rol" }, { key: "areaEmpresa", label: "Área / Empresa" }, { key: "correo", label: "Correo" }, { key: "telefono", label: "Teléfono" }, { key: "relacion", label: "Relación", render: (r: Contacto) => <Badge label={r.relacion} colorClass="bg-slate-200 text-slate-700" /> }, { key: "activo", label: "Activo", render: (r: Contacto) => <Badge label={r.activo} colorClass={r.activo === "Sí" ? "bg-green-500 text-white" : "bg-gray-400 text-white"} /> }];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="📇"
        title="Contactos / Responsables"
        subtitle="Base de personas: internos, OTEC, jefaturas, psicólogos y proveedores."
        actions={<button onClick={() => openNew("contactos")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo contacto</button>}
      />
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">ℹ️</span>
        <p className="text-sm text-blue-800">Todos los responsables de los módulos se asignan desde aquí. <strong>Crea el contacto antes de asignarlo</strong> en cualquier registro.</p>
      </div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar contacto..." filters={<><Select value={filtroRelacion} onChange={setFiltroRelacion} options={RELACIONES} placeholder="Relación" /><select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors"><option value="">Activo</option><option value="Sí">Sí</option><option value="No">No</option></select></>} />
      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("contactos", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("contactos", id) : undefined}
        emptyMessage="Aún no hay contactos registrados"
        emptyHint="Crea el primero con «+ Nuevo contacto». Los responsables de todos los módulos se asignan desde aquí."
      />
      <p className="text-xs text-slate-400">{filtered.length} {filtered.length === 1 ? "contacto" : "contactos"}</p>
    </div>
  );
}

function XlsxImportPreview({ parseResult, onConfirmReplace, onConfirmMerge, onCancel, loading }: {
  parseResult: XlsxParseResult;
  onConfirmReplace: () => void;
  onConfirmMerge: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const totalRegistros = parseResult.hojas.reduce((s, h) => s + h.total, 0);
  const totalErrores = parseResult.hojas.reduce((s, h) => s + h.errores, 0);
  const totalAdv = parseResult.hojas.reduce((s, h) => s + h.advertencias, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">📋 Previsualización de importación XLSX</h2>
            <p className="text-xs text-slate-500 mt-0.5">Revisa los datos antes de confirmar la importación.</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-xl">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Paso visual: stepper */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div><span className="font-medium text-emerald-700">Plantilla descargada</span></div>
            <div className="flex-1 h-px bg-emerald-200" />
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div><span className="font-medium text-emerald-700">Archivo cargado</span></div>
            <div className="flex-1 h-px bg-emerald-200" />
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</div><span className="font-medium text-blue-700">Revisar y confirmar</span></div>
          </div>

          {/* KPIs resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
              <div className="text-2xl font-bold text-slate-800">{totalRegistros}</div>
              <div className="text-xs text-slate-500 mt-1">Registros detectados</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${totalErrores > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
              <div className={`text-2xl font-bold ${totalErrores > 0 ? "text-red-600" : "text-emerald-600"}`}>{totalErrores}</div>
              <div className="text-xs text-slate-500 mt-1">Errores críticos</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${totalAdv > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
              <div className={`text-2xl font-bold ${totalAdv > 0 ? "text-amber-600" : "text-slate-400"}`}>{totalAdv}</div>
              <div className="text-xs text-slate-500 mt-1">Advertencias</div>
            </div>
          </div>

          {parseResult.tieneErroresCriticos && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-red-500 shrink-0">⚠️</span>
              <div className="text-sm text-red-700">
                <span className="font-semibold">Hay errores críticos.</span> Solo se importarán los registros válidos. Los registros con errores serán omitidos.
              </div>
            </div>
          )}

          {/* Tabla por hoja */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Hoja / Módulo","Total","Válidos","Advertencias","Errores"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parseResult.hojas.map((h, i) => (
                  <tr key={i} className={`border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{h.nombre}</td>
                    <td className="px-4 py-2.5 text-slate-600">{h.total}</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-medium">{h.validos}</td>
                    <td className="px-4 py-2.5">{h.advertencias > 0 ? <span className="text-amber-600 font-medium">{h.advertencias}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-2.5">{h.errores > 0 ? <span className="text-red-600 font-medium">{h.errores}</span> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalle de errores/advertencias */}
          {parseResult.hojas.some(h => h.erroresList.length > 0 || h.advertenciasList.length > 0) && (
            <div className="space-y-2">
              {parseResult.hojas.filter(h => h.erroresList.length > 0).map((h, i) => (
                <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-red-700 mb-2">❌ {h.nombre} — Errores ({h.erroresList.length})</div>
                  <ul className="space-y-0.5">{h.erroresList.slice(0, 10).map((e, j) => <li key={j} className="text-xs text-red-600">· {e}</li>)}</ul>
                  {h.erroresList.length > 10 && <p className="text-xs text-red-400 mt-1">… y {h.erroresList.length - 10} más</p>}
                </div>
              ))}
              {parseResult.hojas.filter(h => h.advertenciasList.length > 0).map((h, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-700 mb-2">⚠️ {h.nombre} — Advertencias ({h.advertenciasList.length})</div>
                  <ul className="space-y-0.5">{h.advertenciasList.slice(0, 5).map((e, j) => <li key={j} className="text-xs text-amber-700">· {e}</li>)}</ul>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-blue-700">
            <span className="shrink-0">🔒</span>
            <span>Se creará un respaldo automático antes de importar. Las hojas no presentes en el XLSX mantendrán sus datos actuales intactos.</span>
          </div>
        </div>

        {/* Footer con modos */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3 justify-end flex-wrap">
            <button onClick={onCancel} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button
              onClick={onConfirmMerge}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? "⏳ Procesando importación..." : "🔀 Fusionar con base actual"}
            </button>
            <button
              onClick={onConfirmReplace}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? "⏳ Procesando importación..." : "♻️ Reemplazar base actual"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">
            <strong>Fusionar:</strong> actualiza existentes, agrega nuevos. <strong>Reemplazar:</strong> borra módulos del XLSX y recarga.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuloConfiguracion({
  data, exportJSON, exportJSONSummary, exportJSONAnonymized, importJSON, exportXLSX, exportXLSXAnonymized, exportLimpia,
  restaurarEjemplos, limpiarTodo, showInstructions,
  backups, setBackups, lastJSONExport, lastXLSXExport, runBackupAndToast, setData, toastShow,
  downloadXlsxTemplate, parseXlsxFile, canExportFull, canExportSummary, canExportAnonymized,
  encryptionEnabled, openEncryptionSetup, disableEncryption, exporting
}: any) {
  const counts: Record<string, number> = {
    cursos: data.cursos.length,
    ocs: data.ocs.length,
    practicantes: data.practicantes.length,
    presupuesto: data.presupuesto.length,
    procesos: data.procesos.length,
    diplomas: data.diplomas.length,
    evaluacionesPsicolaborales: data.evaluacionesPsicolaborales.length,
    cargaSemanal: data.cargaSemanal.length,
    contactos: data.contactos.length
  };

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [xlsxParseResult, setXlsxParseResult] = useState<XlsxParseResult | null>(null);
  const [xlsxImporting, setXlsxImporting] = useState(false);
  const [xlsxApplying, setXlsxApplying] = useState(false);
  const xlsxFileInputRef = React.useRef<HTMLInputElement>(null);
  const exportingXlsx = exporting === "xlsx" || exporting === "xlsxAnon";
  const exportingJson = exporting === "json" || exporting === "jsonSummary" || exporting === "jsonAnon";
  const exportingTemplate = exporting === "template";
  const exportingCleanTemplate = exporting === "cleanTemplate";

  const handleXlsxFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlsxImporting(true);
    try {
      const result = await parseXlsxFile(file);
      setXlsxParseResult(result);
    } catch {
      toastShow("Error al leer el archivo XLSX", {
        type: "error",
        message: "Verifica que el archivo sea válido.",
      });
    } finally {
      setXlsxImporting(false);
      if (xlsxFileInputRef.current) xlsxFileInputRef.current.value = "";
    }
  };

  const applyXlsxImport = (mode: "merge" | "replace") => {
    if (!xlsxParseResult) return;
    setXlsxApplying(true);
    try {
      logAudit("data:import", { detail: `Importación XLSX modo ${mode}` });
      runBackupAndToast("importar-xlsx");
      const parsed = xlsxParseResult.parsedData;
      const newData = { ...data };
      const modules: (keyof AppData)[] = ["contactos","cursos","ocs","practicantes","presupuesto","procesos","diplomas","evaluacionesPsicolaborales","cargaSemanal","valesGas","valesGasOrganizacion","reclutamiento"];
      modules.forEach(mod => {
        if (!(mod in parsed)) return;
        const incoming = (parsed as any)[mod] as any[];
        if (mode === "replace") {
          (newData as any)[mod] = incoming;
        } else {
          const existing = (newData as any)[mod] as any[];
          const merged = [...existing];
          incoming.forEach((item: any) => {
            const idx = merged.findIndex((e: any) => e.id === item.id);
            if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
            else merged.push(item);
          });
          (newData as any)[mod] = merged;
        }
      });
      if (mode === "merge" && xlsxParseResult.contactosNuevos.length > 0) {
        const existingIds = new Set(newData.contactos.map((c: any) => c.id));
        xlsxParseResult.contactosNuevos.forEach((c: any) => {
          if (!existingIds.has(c.id)) newData.contactos.push(c);
        });
      }
      newData.meta = { ...newData.meta, actualizado: new Date().toISOString() };
      setData(newData);
      setXlsxParseResult(null);
      const hojas = xlsxParseResult.hojas.length;
      const total = xlsxParseResult.hojas.reduce((s, h) => s + h.validos, 0);
      toastShow("XLSX importado correctamente", {
        type: "success",
        message: `${total} registros en ${hojas} módulos (modo: ${mode === "merge" ? "fusión" : "reemplazo"}).`,
      });
    } finally {
      setXlsxApplying(false);
    }
  };

  const confirmXlsxImport = (mode: "merge" | "replace") => {
    const label = mode === "merge" ? "Fusionar" : "Reemplazar";
    setConfirm({
      title: `Confirmar importación XLSX (${label})`,
      message: mode === "merge"
        ? "Se fusionarán registros existentes y se crearán nuevos. Se generará un respaldo antes de importar."
        : "Se reemplazarán los módulos presentes en el XLSX. Se generará un respaldo antes de importar.",
      variant: "warning",
      confirmLabel: "Importar",
      onConfirm: () => {
        applyXlsxImport(mode);
        setConfirm(null);
      },
    });
  };

  const handleRestaurarBackup = (backup: BackupItem) => {
    setConfirm({
      title: "Restaurar respaldo",
      message: `¿Restaurar respaldo del ${new Date(backup.fecha).toLocaleString("es-CL")}? Se creará un respaldo de seguridad antes de restaurar.`,
      variant: "warning",
      confirmLabel: "Restaurar",
      onConfirm: () => {
        runBackupAndToast("antes de restaurar");
        if (backup.data && typeof backup.data === "object") {
          setData(backup.data);
          toastShow("Respaldo restaurado exitosamente", { type: "success" });
        } else {
          toastShow("Respaldo corrupto o inválido", { type: "error" });
        }
        setConfirm(null);
      },
    });
  };

  const handleDescargarBackup = (backup: BackupItem) => {
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `respaldo_local_kata_${new Date(backup.fecha).toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastShow("JSON de respaldo descargado", { type: "success" });
  };

  const handleEliminarBackup = (id: string) => {
    setConfirm({
      title: "Eliminar respaldo",
      message: "¿Seguro que deseas eliminar este respaldo local de forma permanente?",
      variant: "danger",
      confirmLabel: "Eliminar",
      onConfirm: () => {
        const updated = backups.filter((b: BackupItem) => b.id !== id);
        saveLocalBackups(updated);
        setBackups(updated);
        toastShow("Respaldo eliminado", { type: "success" });
        setConfirm(null);
      },
    });
  };

  const handleCrearBackupManual = () => {
    runBackupAndToast("manual");
    toastShow("Respaldo manual creado correctamente", { type: "success" });
  };

  const lastLocalBackupDate = backups[0]?.fecha;

  return (
    <div className="space-y-6">
      <PageHeader
        icon="⚙️"
        title="Configuración y Respaldos"
        subtitle="Gestión de datos, exportación, importación y respaldos del sistema."
      />

      {/* Alerta semanal */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">📢</span>
        <div>
          <p className="text-sm font-semibold text-blue-900">Recomendación semanal</p>
          <p className="text-sm text-blue-700 mt-0.5">Descarga un respaldo JSON al menos 1 vez por semana y guárdalo de manera segura en tu carpeta de backups.</p>
        </div>
      </div>

      {/* Flujo XLSX — destacado */}
      <SectionCard title="📊 Importación / Exportación XLSX" subtitle="Conecta el sistema con Excel. Descarga la plantilla, complétala e importa." headerRight={
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Recomendado</span>
      }>
        <input ref={xlsxFileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleXlsxFileSelect} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-lg">1️⃣</div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Descargar plantilla</p>
              <p className="text-xs text-slate-500 mt-0.5">Plantilla oficial con todos los módulos y ejemplos incluidos.</p>
            </div>
            <button
              onClick={downloadXlsxTemplate}
              disabled={exportingTemplate}
              className="w-full bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {exportingTemplate ? "⏳ Generando plantilla..." : "📋 Descargar plantilla XLSX"}
            </button>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">2️⃣</div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Importar base XLSX</p>
              <p className="text-xs text-slate-500 mt-0.5">Sube tu archivo, previsualiza los datos y elige modo: fusionar o reemplazar.</p>
            </div>
            <button
              onClick={() => xlsxFileInputRef.current?.click()}
              disabled={xlsxImporting}
              className="w-full bg-teal-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-teal-700 transition disabled:opacity-50"
            >
              {xlsxImporting ? "⏳ Procesando..." : "📤 Subir e importar XLSX"}
            </button>
            {xlsxImporting && (
              <div className="flex justify-center">
                <LoadingSpinner size="sm" label="Procesando archivo XLSX..." />
              </div>
            )}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-lg">3️⃣</div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Exportar datos</p>
              <p className="text-xs text-slate-500 mt-0.5">Descarga el XLSX completo o una versión anonimizada para compartir.</p>
            </div>
            <div className="space-y-2">
              {canExportFull && (
                <button
                  onClick={exportXLSX}
                  disabled={exportingXlsx}
                  className="w-full bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  {exporting === "xlsx" ? "⏳ Generando XLSX..." : "📥 Exportar XLSX completo"}
                </button>
              )}
              {canExportAnonymized && (
                <button
                  onClick={exportXLSXAnonymized}
                  disabled={exportingXlsx}
                  className="w-full bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-600 transition disabled:opacity-60"
                >
                  {exporting === "xlsxAnon" ? "⏳ Generando XLSX anon..." : "🫥 Exportar XLSX anon."}
                </button>
              )}
              {!canExportFull && !canExportAnonymized && (
                <p className="text-[11px] text-slate-400">Sin permisos de exportación</p>
              )}
            </div>
            {exportingXlsx && (
              <div className="flex justify-center">
                <LoadingSpinner size="sm" label="Generando XLSX..." />
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Modos al importar: <strong>Fusionar</strong> agrega/actualiza sin borrar · <strong>Reemplazar</strong> sobreescribe los módulos presentes en el archivo.</p>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado respaldos */}
        <SectionCard title="💾 Estado de respaldos">
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100"><span>Último respaldo local</span><span className="font-semibold text-slate-800">{lastLocalBackupDate ? new Date(lastLocalBackupDate).toLocaleString("es-CL") : "Ninguno"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100"><span>Última descarga JSON</span><span className="font-semibold text-slate-800">{lastJSONExport ? new Date(lastJSONExport).toLocaleString("es-CL") : "Nunca"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100"><span>Última descarga XLSX</span><span className="font-semibold text-slate-800">{lastXLSXExport ? new Date(lastXLSXExport).toLocaleString("es-CL") : "Nunca"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100"><span>Última actualización</span><span className="font-semibold text-slate-800">{new Date(data.meta.actualizado).toLocaleString("es-CL")}</span></div>
            <div className="flex justify-between py-1"><span>Versión</span><span className="font-semibold text-slate-800">v{data.meta.version}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 mt-3">
            {canExportFull && (
              <button
                onClick={exportJSON}
                disabled={exportingJson}
                className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {exporting === "json" ? "⏳ Generando JSON..." : "📥 Exportar JSON completo"}
              </button>
            )}
            {canExportSummary && (
              <button
                onClick={exportJSONSummary}
                disabled={exportingJson}
                className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-600 transition disabled:opacity-60"
              >
                {exporting === "jsonSummary" ? "⏳ Generando resumen..." : "📥 Exportar resumen"}
              </button>
            )}
            {canExportAnonymized && (
              <button
                onClick={exportJSONAnonymized}
                disabled={exportingJson}
                className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-600 transition disabled:opacity-60"
              >
                {exporting === "jsonAnon" ? "⏳ Generando JSON anon..." : "🫥 Exportar JSON anon."}
              </button>
            )}
            <button onClick={importJSON} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition">📤 Importar JSON</button>
            <button
              onClick={exportLimpia}
              disabled={exportingCleanTemplate}
              className="bg-slate-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-600 transition disabled:opacity-60"
            >
              {exportingCleanTemplate ? "⏳ Generando plantilla..." : "📋 Plantilla limpia"}
            </button>
          </div>
          {exportingJson && (
            <div className="mt-3 flex justify-center">
              <LoadingSpinner size="sm" label="Generando exportación..." />
            </div>
          )}
        </SectionCard>

        <SectionCard title="🔐 Cifrado local">
          <p className="text-sm text-slate-600 mb-3">Protege datos sensibles en este navegador con una clave local.</p>
          <div className="flex justify-between items-center text-xs text-slate-600 mb-4">
            <span>Estado</span>
            <span className={`font-semibold ${encryptionEnabled ? "text-emerald-600" : "text-slate-500"}`}>
              {encryptionEnabled ? "Activo" : "Desactivado"}
            </span>
          </div>
          {!encryptionEnabled && (
            <button onClick={openEncryptionSetup} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition">
              Activar cifrado
            </button>
          )}
          {encryptionEnabled && (
            <button onClick={disableEncryption} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-600 transition">
              Desactivar cifrado
            </button>
          )}
          <p className="text-[11px] text-slate-400 mt-3">La clave se solicita al iniciar y no se guarda en localStorage.</p>
        </SectionCard>

        {/* Contador */}
        <SectionCard title="📊 Registros por módulo">
          <div className="space-y-1.5">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-sm py-1 border-b border-slate-50">
                <span className="text-slate-600 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${v > 0 ? "bg-blue-50 text-blue-700" : "text-slate-400"}`}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2">
              <span className="text-slate-700">Total</span>
              <span className="text-slate-800">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
        </SectionCard>

        {/* Instrucciones */}
        <SectionCard title="📖 Guía de uso">
          <p className="text-sm text-slate-600 mb-4">Consulta las instrucciones completas de uso del sistema, rutina semanal y buenas prácticas.</p>
          <button onClick={showInstructions} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm">
            Ver instrucciones de uso
          </button>
        </SectionCard>

        {/* Acciones de datos */}
        <div className="space-y-3">
          <SectionCard title="🔄 Datos de ejemplo">
            <p className="text-sm text-slate-600 mb-3">Restaura datos de ejemplo para previsualizar el sistema.</p>
            <button onClick={restaurarEjemplos} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors">
              Restaurar datos de ejemplo
            </button>
          </SectionCard>
          <SectionCard title="⚠️ Zona de peligro">
            <p className="text-sm text-slate-600 mb-3">Elimina <strong>todos</strong> los datos permanentemente. Requiere doble confirmación.</p>
            <button onClick={limpiarTodo} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
              Limpiar todos los datos
            </button>
          </SectionCard>
        </div>
      </div>

      {/* Respaldos Locales Tabla */}
      <div className="bg-white rounded-2xl border border-[#D9E2EC] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">💾 Respaldos Locales (localStorage)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Se guardan automáticamente antes de cada acción importante (hasta 10 registros).</p>
          </div>
          <button
            onClick={handleCrearBackupManual}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition animate-pulse"
          >
            ⚡ Crear respaldo local ahora
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Aún no hay respaldos locales
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#D9E2EC]">
            <table className="w-full text-sm text-left table-stripe">
              <thead>
                <tr className="bg-[#F1F5F9] text-slate-500 text-xs font-medium tracking-wide">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Motivo / Acción</th>
                  <th className="px-4 py-3">Tamaño</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup: BackupItem) => (
                  <tr key={backup.id} className="border-t border-[#F1F5F9] hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {new Date(backup.fecha).toLocaleString("es-CL")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        backup.motivo === "manual" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        backup.motivo === "importar" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                        backup.motivo === "eliminar" ? "bg-red-50 text-red-700 border border-red-200" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {backup.motivo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{backup.tamaño}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => handleRestaurarBackup(backup)}
                          className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => handleDescargarBackup(backup)}
                          className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          Descargar
                        </button>
                        <button
                          onClick={() => handleEliminarBackup(backup.id)}
                          className="px-3 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

        {xlsxParseResult && (
          <XlsxImportPreview
            parseResult={xlsxParseResult}
            onConfirmMerge={() => confirmXlsxImport("merge")}
            onConfirmReplace={() => confirmXlsxImport("replace")}
            onCancel={() => setXlsxParseResult(null)}
            loading={xlsxApplying}
          />
        )}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title || "Confirmar acción"}
        message={confirm?.message}
        variant={confirm?.variant || "default"}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel={confirm?.cancelLabel}
        onConfirm={() => { const cb = confirm?.onConfirm; if (cb) cb(); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

// ── REPORTE MENSUAL EJECUTIVO COMPONENT ─────────────────────────

function ModuloReporteMensual({ data, toastShow }: { data: AppData; toastShow: (msg: string, opts?: any) => void }) {
  const currentMonth = MESES[new Date().getMonth()] || "Enero";
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ISO "YYYY-MM-DD" → 0-indexed month (-1 if invalid)
  const parseMonthOfDate = (dateStr: string): number => {
    if (!dateStr) return -1;
    const parts = dateStr.split("-");
    if (parts.length < 2) return -1;
    return parseInt(parts[1], 10) - 1;
  };

  // ISO "YYYY-MM-DD" → year (-1 if invalid)
  const parseYearOfDate = (dateStr: string): number => {
    if (!dateStr) return -1;
    const parts = dateStr.split("-");
    if (parts.length < 2) return -1; // necesita al menos YYYY-MM
    const year = parseInt(parts[0], 10);
    return isNaN(year) ? -1 : year;
  };

  const monthIndex = MESES.indexOf(selectedMonth);

  // Returns true if any of the provided date strings fall within the selected month/year
  const isInMonth = (...dates: string[]): boolean =>
    dates.some(d => parseMonthOfDate(d) === monthIndex && parseYearOfDate(d) === selectedYear);

  // Filter datasets based on selected month and year
  const monthCursos = data.cursos.filter(c =>
    isInMonth(c.fechaSolicitud, c.fechaRequerida, c.ultimaActualizacion)
  );

  const cursosEjecutados = monthCursos.filter(c => ["Ejecutado", "Cerrado"].includes(c.estado)).length;
  const cursosAbiertos = monthCursos.filter(c => c.estado !== "Cerrado").length;
  const cursosUrgentes = monthCursos.filter(c => c.origen === "Urgente no planificado").length;
  const cursosNoPlanificados = monthCursos.filter(c => c.origen === "No planificado necesario").length;
  const cursosP1 = monthCursos.filter(c => c.prioridad === "P1 Crítico").length;
  const cursosDetenidos = monthCursos.filter(c => c.estado === "Detenido").length;

  const monthOCs = data.ocs.filter(o =>
    isInMonth(o.fechaSolicitud, o.fechaLimite, o.ultimaActualizacion)
  );

  const ocsCreadas = monthOCs.filter(o => o.estadoOC !== "Pendiente crear").length;
  const ocsPendientes = monthOCs.filter(o => ["Pendiente crear", "Solicitada", "En aprobación"].includes(o.estadoOC)).length;
  const ocsCerradas = monthOCs.filter(o => o.estadoOC === "Cerrada").length;
  const ocsBloqueadas = monthOCs.filter(o => o.bloqueadoPor && o.bloqueadoPor !== "Sin bloqueo").length;

  const monthDiplomas = data.diplomas.filter(d =>
    isInMonth(d.fechaSolicitudOTEC, d.fechaRecepcionDoc, d.fechaEnvioParticipante, d.fechaSubidaBUK, d.ultimaActualizacion)
  );

  const dipPedididos = monthDiplomas.filter(d => d.etapa === "Pedir a la OTEC").length;
  const dipParticipante = monthDiplomas.filter(d => d.etapa === "Enviar o pedir al participante").length;
  const dipBUK = monthDiplomas.filter(d => d.etapa === "Subir a BUK").length;
  const dipCompletados = monthDiplomas.filter(d => d.etapa === "Completado").length;

  const monthEvaluaciones = data.evaluacionesPsicolaborales.filter(e => {
    return e.mes === selectedMonth && e.ano === selectedYear;
  });

  const evSolicitadas = monthEvaluaciones.filter(e => e.estado === "Solicitada").length;
  const evRealizadas = monthEvaluaciones.filter(e => e.estado === "Realizada").length;
  const evInformes = monthEvaluaciones.filter(e => e.estado === "Informe recibido").length;
  const evCerradas = monthEvaluaciones.filter(e => e.estado === "Cerrada").length;
  const evBloqueadas = monthEvaluaciones.filter(e => e.bloqueadoPor && e.bloqueadoPor !== "Sin bloqueo").length;
  const evRecomendados = monthEvaluaciones.filter(e => e.resultado === "Recomendado").length;
  const evNoRecomendados = monthEvaluaciones.filter(e => e.resultado === "No recomendado").length;

  const monthProcesos = data.procesos.filter(p =>
    isInMonth(p.fechaLimite, p.fechaProximaAccion, p.ultimaActualizacion)
  );
  const procAbiertos = monthProcesos.filter(p => p.estadoActual !== "Cerrado").length;
  const procCerrados = monthProcesos.filter(p => p.estadoActual === "Cerrado").length;
  const procBloqueados = monthProcesos.filter(p => p.bloqueadoPor && p.bloqueadoPor !== "Sin bloqueo").length;
  const procCriticos = monthProcesos.filter(p => p.riesgo === "Alto" || p.prioridad === "P1 Crítico").length;

  // Include practicantes active during the month: started on or before the last day of the month
  // AND (no end date OR ended on or after the first day of the month)
  const monthPracticantes = data.practicantes.filter(p => {
    if (!p.fechaInicio) return false;
    const monthStart = new Date(selectedYear, monthIndex, 1);
    const monthEnd = new Date(selectedYear, monthIndex + 1, 0);
    const inicio = new Date(p.fechaInicio);
    const termino = p.fechaTermino ? new Date(p.fechaTermino) : null;
    return inicio <= monthEnd && (!termino || termino >= monthStart);
  });

  const pracActivos = monthPracticantes.filter(p => p.estado === "Activo").length;
  const pracIngresos = monthPracticantes.filter(p => parseMonthOfDate(p.fechaInicio) === monthIndex && parseYearOfDate(p.fechaInicio) === selectedYear).length;
  const pracTerminos = monthPracticantes.filter(p => parseMonthOfDate(p.fechaTermino) === monthIndex && parseYearOfDate(p.fechaTermino) === selectedYear).length;
  const pracPorBuscar = monthPracticantes.filter(p => p.estado === "Por buscar").length;

  const budgetTotal = data.presupuesto.reduce((s, p) => s + p.presupuestoTotal, 0);
  const budgetGastado = data.presupuesto.reduce((s, p) => s + p.gastado, 0);
  const budgetDisponible = budgetTotal - budgetGastado;
  const budgetPct = budgetTotal > 0 ? Math.round((budgetGastado / budgetTotal) * 100) : 0;

  // Reclutamiento del mes
  const monthReclutamiento = (data.reclutamiento || []).filter((r: ProcesoReclutamiento) => r.mesIngreso === selectedMonth);
  const reclTotal = monthReclutamiento.length;
  const reclAbiertos = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Abierto").length;
  const reclCerrados = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Cerrado").length;
  const reclPausados = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Pausado").length;
  const reclDesistidos = monthReclutamiento.filter((r: ProcesoReclutamiento) => r.proceso === "Desistido").length;
  const reclBloqueados = monthReclutamiento.filter((r: ProcesoReclutamiento) => !["Cerrado","Desistido"].includes(r.proceso) && r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo").length;
  const reclAvanceProm = reclTotal === 0 ? 0 : Math.round(monthReclutamiento.reduce((s: number, r: ProcesoReclutamiento) => s + calcPctRecl(r), 0) / reclTotal);

  const vgAll = data.valesGas || [];
  const vgActivos = vgAll.filter((v: ValeGas) => v.estado !== "Cerrado" && v.estado !== "Detenido").length;
  const vgEnDescuento = vgAll.filter((v: ValeGas) => v.estado === "En descuento").length;
  const vgCerrados = vgAll.filter((v: ValeGas) => v.estado === "Cerrado").length;
  const vgAsignadosTotal = vgAll.reduce((s: number, v: ValeGas) => s + (v.totalValesAsignados || 0), 0);
  const vgUsadosTotal = vgAll.reduce((s: number, v: ValeGas) => s + (v.valesUsados || 0), 0);
  const vgSaldoTotal = vgAll.reduce((s: number, v: ValeGas) => s + (v.saldoVales || 0), 0);
  const vgTotalDescontado = vgAll.reduce((s: number, v: ValeGas) => s + (v.totalDescontado || 0), 0);
  const vgOrgAll: ValeGasOrg[] = data.valesGasOrganizacion || [];
  const vgOrgMes = vgOrgAll.filter((v: ValeGasOrg) => parseMonthOfDate(v.fechaRegistro) === monthIndex && (v as any).fechaRegistro && v.periodo?.includes(String(selectedYear)));
  const vgOrgIngresosMes = vgOrgMes.filter((v: ValeGasOrg) => v.tipoMovimiento === "Ingreso de vales").reduce((s: number, v: ValeGasOrg) => s + (v.cantidadVales || 0), 0);
  const vgOrgAjustesNegMes = vgOrgMes.filter((v: ValeGasOrg) => v.tipoMovimiento === "Ajuste negativo").reduce((s: number, v: ValeGasOrg) => s + (v.cantidadVales || 0), 0);
  const vgOrgStockMes = vgOrgMes.reduce((s: number, v: ValeGasOrg) => v.tipoMovimiento === "Ajuste negativo" ? s - (v.cantidadVales || 0) : s + (v.cantidadVales || 0), 0);

  // Bloqueos frequencies
  const blockCounts: Record<string, number> = {
    "Falta aprobación": 0,
    "Falta OC": 0,
    "Falta OTEC": 0,
    "Falta participante": 0,
    "Falta informe": 0,
    "Falta presupuesto": 0,
    "Otros": 0
  };

  const countBlocks = (item: any) => {
    const b = item.bloqueadoPor;
    if (b && b !== "Sin bloqueo") {
      if (blockCounts[b] !== undefined) {
        blockCounts[b]++;
      } else {
        blockCounts["Otros"]++;
      }
    }
  };

  monthCursos.forEach(countBlocks);
  monthOCs.forEach(countBlocks);
  monthPracticantes.forEach(countBlocks);
  monthDiplomas.forEach(countBlocks);
  monthEvaluaciones.forEach(countBlocks);
  monthProcesos.forEach(countBlocks);

  const topBlockeoName = Object.entries(blockCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Ninguno";
  const topBlockeoValue = blockCounts[topBlockeoName] || 0;
  const topBlockeoText = topBlockeoValue > 0 ? `${topBlockeoName} (${topBlockeoValue} veces)` : "Ninguno";

  // Planning vs actual metrics
  const cursosPlanificados = monthCursos.filter(c => ["DNC", "Carta Gantt"].includes(c.origen)).length;
  const cursosUrgentesNuevos = monthCursos.filter(c => c.origen === "Urgente no planificado").length;
  const cursosNoPlanificadosNecesarios = monthCursos.filter(c => c.origen === "No planificado necesario" || c.origen === "Emergente por operación").length;
  const totalCursosReal = monthCursos.length;
  const diffPlanificadoReal = totalCursosReal - cursosPlanificados;

  // Exports
  const exportReportXLSX = async () => {
    const XLSX = await getXlsx();
    const wb = XLSX.utils.book_new();
    const reportData = [
      ["REPORTE MENSUAL EJECUTIVO", `${selectedMonth} ${selectedYear}`],
      ["Fecha de Generación", new Date().toLocaleDateString("es-CL")],
      [],
      ["1. RESUMEN DE CURSOS", ""],
      ["Cursos Ejecutados", cursosEjecutados],
      ["Cursos Abiertos", cursosAbiertos],
      ["Cursos Urgentes No Planificados", cursosUrgentes],
      ["Cursos No Planificados Necesarios", cursosNoPlanificados],
      ["Cursos P1 Críticos", cursosP1],
      ["Cursos Detenidos", cursosDetenidos],
      [],
      ["2. RESUMEN DE ORDENES DE COMPRA (OCs)", ""],
      ["OCs Creadas", ocsCreadas],
      ["OCs Pendientes", ocsPendientes],
      ["OCs Cerradas", ocsCerradas],
      ["OCs Bloqueadas", ocsBloqueadas],
      [],
      ["3. RESUMEN DE DIPLOMAS / CERTIFICADOS", ""],
      ["Documentos Pedidos a OTEC", dipPedididos],
      ["Pendientes de Participante", dipParticipante],
      ["Pendientes de Subir a BUK", dipBUK],
      ["Completados", dipCompletados],
      [],
      ["4. RESUMEN DE EVALUACIONES PSICOLABORALES", ""],
      ["Evaluaciones Solicitadas", evSolicitadas],
      ["Evaluaciones Realizadas", evRealizadas],
      ["Informes Recibidos", evInformes],
      ["Evaluaciones Cerradas", evCerradas],
      ["Evaluaciones Bloqueadas", evBloqueadas],
      ["Recomendados", evRecomendados],
      ["No Recomendados", evNoRecomendados],
      [],
      ["5. RESUMEN DE PRACTICANTES", ""],
      ["Practicantes Activos", pracActivos],
      ["Ingresos del Mes", pracIngresos],
      ["Términos del Mes", pracTerminos],
      ["Por Buscar", pracPorBuscar],
      [],
      ["6. RESUMEN DE PROCESOS PENDIENTES", ""],
      ["Procesos Abiertos", procAbiertos],
      ["Procesos Cerrados", procCerrados],
      ["Procesos Bloqueados", procBloqueados],
      ["Procesos Críticos / Riesgo Alto", procCriticos],
      [],
      ["7. RESUMEN DE PRESUPUESTO", ""],
      ["Presupuesto Asignado", budgetTotal],
      ["Presupuesto Ejecutado", budgetGastado],
      ["Saldo Disponible", budgetDisponible],
      ["Porcentaje Utilizado (%)", `${budgetPct}%`],
      [],
      ["8. FRECUENCIA DE BLOQUEOS", ""],
      ["Falta Aprobación", blockCounts["Falta aprobación"]],
      ["Falta OC", blockCounts["Falta OC"]],
      ["Falta OTEC", blockCounts["Falta OTEC"]],
      ["Falta Participante", blockCounts["Falta participante"]],
      ["Falta Informe", blockCounts["Falta informe"]],
      ["Falta Presupuesto", blockCounts["Falta presupuesto"]],
      ["Otros Bloqueos", blockCounts["Otros"]],
      [],
      ["9. CARGA REAL VS PLANIFICACIÓN", ""],
      ["Cursos Planificados", cursosPlanificados],
      ["Cursos Urgentes Nuevos", cursosUrgentesNuevos],
      ["Cursos No Planificados Necesarios", cursosNoPlanificadosNecesarios],
      ["Carga Real Total (Cursos)", totalCursosReal],
      ["Diferencia (Real - Planificado)", diffPlanificadoReal],
      [],
      ["10. VALES DE GAS", ""],
      ["Stock registrado en el mes", vgOrgStockMes],

      ["Ingresos del mes (Ingreso de vales)", vgOrgIngresosMes],
      ["Ajustes negativos del mes", vgOrgAjustesNegMes],
      ["Registros Activos", vgActivos],
      ["En Descuento", vgEnDescuento],
      ["Cerrados", vgCerrados],
      ["Total Vales Asignados a Colaboradores", vgAsignadosTotal],
      ["Total Vales Usados", vgUsadosTotal],
      ["Saldo Pendiente Colaboradores", vgSaldoTotal],
      ["Total Descontado", vgTotalDescontado],
      [],
      ["11. RECLUTAMIENTO", ""],
      ["Total procesos del mes", reclTotal],
      ["Abiertos", reclAbiertos],
      ["Cerrados", reclCerrados],
      ["Pausados", reclPausados],
      ["Desistidos", reclDesistidos],
      ["Bloqueados", reclBloqueados],
      ["Avance promedio (%)", `${reclAvanceProm}%`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Mensual");
    XLSX.writeFile(wb, `reporte_mensual_kata_v5_${selectedMonth}_${selectedYear}.xlsx`);
    toastShow("Reporte mensual XLSX descargado", { type: "success" });
  };

  const exportReportJSON = () => {
    const jsonReport = {
      periodo: `${selectedMonth} ${selectedYear}`,
      cursos: { cursosEjecutados, cursosAbiertos, cursosUrgentes, cursosNoPlanificados, cursosP1, cursosDetenidos },
      ocs: { ocsCreadas, ocsPendientes, ocsCerradas, ocsBloqueadas },
      diplomas: { dipPedididos, dipParticipante, dipBUK, dipCompletados },
      evaluaciones: { evSolicitadas, evRealizadas, evInformes, evCerradas, evBloqueadas, evRecomendados, evNoRecomendados },
      practicantes: { pracActivos, pracIngresos, pracTerminos, pracPorBuscar },
      procesos: { procAbiertos, procCerrados, procBloqueados, procCriticos },
      presupuesto: { budgetTotal, budgetGastado, budgetDisponible, budgetPct },
      bloqueos: blockCounts,
      cargaVsPlanificacion: { cursosPlanificados, cursosUrgentesNuevos, cursosNoPlanificadosNecesarios, totalCursosReal, diffPlanificadoReal }
    };

    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `reporte_mensual_${selectedMonth}_${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastShow("Reporte mensual JSON descargado", { type: "success" });
  };

  const copyExecutiveSummary = () => {
    const summaryText = `
REPORTE MENSUAL EJECUTIVO - ${selectedMonth} ${selectedYear}
=================================
Fecha de Generación: ${new Date().toLocaleDateString("es-CL")}

1. PRINCIPALES CIFRAS:
- Cursos Registrados: ${totalCursosReal} (Abiertos: ${cursosAbiertos}, Ejecutados: ${cursosEjecutados})
- Cursos Urgentes No Planificados: ${cursosUrgentes}
- OCs Creadas / Pendientes: ${ocsCreadas} / ${ocsPendientes}
- Evaluaciones Realizadas: ${evRealizadas} (Cerradas: ${evCerradas})
- Practicantes Activos: ${pracActivos}

2. SITUACIÓN DE BLOQUEOS:
- Bloqueo más frecuente: ${topBlockeoText}
- Procesos Bloqueados Totales: ${evBloqueadas + ocsBloqueadas + cursosDetenidos}

3. PRESUPUESTO DEL MES:
- Presupuesto Total: ${fmtCLP(budgetTotal)}
- Presupuesto Ejecutado: ${fmtCLP(budgetGastado)}
- % Utilizado: ${budgetPct}%
- Saldo Disponible: ${fmtCLP(budgetDisponible)}

4. CARGA REAL VS PLANIFICACIÓN:
- Cursos Planificados (DNC/Gantt): ${cursosPlanificados}
- Cursos Emergentes/Urgentes: ${cursosUrgentesNuevos + cursosNoPlanificadosNecesarios}
- Carga de Trabajo Adicional: ${diffPlanificadoReal} cursos más que la planificación original.

5. RECOMENDACIÓN OPERATIVA:
${diffPlanificadoReal > 0 
  ? "Se observa una carga real significativamente superior a la planificación inicial por la aparición de cursos urgentes/no planificados. Se sugiere reevaluar los márgenes operativos para evitar sobrecarga y gestionar los bloqueos pendientes."
  : "La carga operativa del mes se mantiene alineada con la planificación formal. Se recomienda mantener el ritmo operativo de cierres."}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    toastShow("Resumen ejecutivo copiado al portapapeles", { type: "success" });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D9E2EC] p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">📄 Reporte Mensual Ejecutivo</h2>
          <p className="text-xs text-slate-500">Resumen y análisis de la actividad operativa mensual para reportes a jefatura.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onChange={setSelectedMonth} options={MESES} />
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border border-[#D9E2EC] rounded-xl px-4 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] transition-colors"
          >
            {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Narrative Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-slate-700 space-y-2">
        <h4 className="font-semibold text-blue-800 text-sm">💡 Interpretación automática del mes:</h4>
        <p className="text-sm leading-relaxed">
          Durante <span className="font-semibold">{selectedMonth}</span> de <span className="font-semibold">{selectedYear}</span> se registraron <span className="font-semibold">{totalCursosReal}</span> cursos, de los cuales <span className="font-semibold">{cursosUrgentes}</span> fueron urgentes no planificados y <span className="font-semibold">{cursosNoPlanificados}</span> fueron no planificados pero necesarios.
          Además, se contabilizaron <span className="font-semibold">{evSolicitadas}</span> evaluaciones psicolaborales y se gestionaron <span className="font-semibold">{ocsCreadas}</span> órdenes de compra.
          Actualmente, el bloqueo más frecuente es <span className="font-semibold text-red-600">"{topBlockeoName}"</span>, ocurriendo <span className="font-semibold">{topBlockeoValue}</span> veces. Esto indica una carga operativa <span className="font-semibold">{totalCursosReal > 5 ? "alta y superior a la planificación original" : "estable y controlada"}</span>.
        </p>
      </div>

      {/* Main breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Cursos */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>📚 Cursos / Capacitaciones</span>
            <span className="text-xs text-slate-400">Total: {totalCursosReal}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Cursos ejecutados:</span> <span className="font-semibold text-slate-800">{cursosEjecutados}</span></li>
            <li className="flex justify-between"><span>Cursos abiertos:</span> <span className="font-semibold text-slate-800">{cursosAbiertos}</span></li>
            <li className="flex justify-between"><span>Urgentes no planificados:</span> <span className="font-semibold text-slate-800">{cursosUrgentes}</span></li>
            <li className="flex justify-between"><span>No planificados necesarios:</span> <span className="font-semibold text-slate-800">{cursosNoPlanificados}</span></li>
            <li className="flex justify-between"><span>Cursos P1 críticos:</span> <span className="font-semibold text-red-600">{cursosP1}</span></li>
            <li className="flex justify-between"><span>Cursos detenidos:</span> <span className="font-semibold text-slate-800">{cursosDetenidos}</span></li>
          </ul>
        </div>

        {/* OCs */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>🧾 Órdenes de Compra (OCs)</span>
            <span className="text-xs text-slate-400">Total: {monthOCs.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>OCs creadas:</span> <span className="font-semibold text-slate-800">{ocsCreadas}</span></li>
            <li className="flex justify-between"><span>OCs pendientes:</span> <span className="font-semibold text-slate-800">{ocsPendientes}</span></li>
            <li className="flex justify-between"><span>OCs cerradas:</span> <span className="font-semibold text-slate-800">{ocsCerradas}</span></li>
            <li className="flex justify-between"><span>OCs bloqueadas:</span> <span className="font-semibold text-red-600">{ocsBloqueadas}</span></li>
          </ul>
        </div>

        {/* Diplomas */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>📜 Diplomas y Licencias</span>
            <span className="text-xs text-slate-400">Total: {monthDiplomas.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Pedidos a OTEC:</span> <span className="font-semibold text-slate-800">{dipPedididos}</span></li>
            <li className="flex justify-between"><span>Pendientes de participante:</span> <span className="font-semibold text-slate-800">{dipParticipante}</span></li>
            <li className="flex justify-between"><span>Pendientes subir a BUK:</span> <span className="font-semibold text-red-600">{dipBUK}</span></li>
            <li className="flex justify-between"><span>Completados:</span> <span className="font-semibold text-slate-800">{dipCompletados}</span></li>
          </ul>
        </div>

        {/* Evaluaciones */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>🧠 Evaluaciones Psicolaborales</span>
            <span className="text-xs text-slate-400">Total: {monthEvaluaciones.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Evaluaciones solicitadas:</span> <span className="font-semibold text-slate-800">{evSolicitadas}</span></li>
            <li className="flex justify-between"><span>Evaluaciones realizadas:</span> <span className="font-semibold text-slate-800">{evRealizadas}</span></li>
            <li className="flex justify-between"><span>Informes recibidos:</span> <span className="font-semibold text-slate-800">{evInformes}</span></li>
            <li className="flex justify-between"><span>Evaluaciones cerradas:</span> <span className="font-semibold text-slate-800">{evCerradas}</span></li>
            <li className="flex justify-between"><span>Bloqueadas:</span> <span className="font-semibold text-red-600">{evBloqueadas}</span></li>
            <li className="flex justify-between"><span>Recomendados / No recomendados:</span> <span className="font-semibold text-slate-800">{evRecomendados} / {evNoRecomendados}</span></li>
          </ul>
        </div>

        {/* Practicantes */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>👤 Practicantes</span>
            <span className="text-xs text-slate-400">Total: {monthPracticantes.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Activos:</span> <span className="font-semibold text-slate-800">{pracActivos}</span></li>
            <li className="flex justify-between"><span>Ingresos del mes:</span> <span className="font-semibold text-slate-800">{pracIngresos}</span></li>
            <li className="flex justify-between"><span>Términos del mes:</span> <span className="font-semibold text-slate-800">{pracTerminos}</span></li>
            <li className="flex justify-between"><span>Por buscar:</span> <span className="font-semibold text-slate-800">{pracPorBuscar}</span></li>
          </ul>
        </div>

        {/* Procesos */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>⚙️ Procesos Pendientes</span>
            <span className="text-xs text-slate-400">Total: {monthProcesos.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Procesos abiertos:</span> <span className="font-semibold text-slate-800">{procAbiertos}</span></li>
            <li className="flex justify-between"><span>Procesos cerrados:</span> <span className="font-semibold text-slate-800">{procCerrados}</span></li>
            <li className="flex justify-between"><span>Bloqueados:</span> <span className="font-semibold text-red-600">{procBloqueados}</span></li>
            <li className="flex justify-between"><span>Críticos / Riesgo alto:</span> <span className="font-semibold text-red-600">{procCriticos}</span></li>
          </ul>
        </div>

        {/* Presupuesto */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>💰 Presupuesto Global</span>
            <span className="text-xs text-slate-400">{budgetPct}% usado</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Asignado:</span> <span className="font-semibold text-slate-800">{fmtCLP(budgetTotal)}</span></li>
            <li className="flex justify-between"><span>Ejecutado:</span> <span className="font-semibold text-red-600">{fmtCLP(budgetGastado)}</span></li>
            <li className="flex justify-between"><span>Disponible:</span> <span className="font-semibold text-green-600">{fmtCLP(budgetDisponible)}</span></li>
          </ul>
        </div>

        {/* Vales de Gas */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>⛽ Vales de Gas</span>
            <span className="text-xs text-slate-400">Total: {vgAll.length}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Stock registrado en el mes:</span> <span className="font-semibold text-slate-800">{vgOrgStockMes}</span></li>
            <li className="flex justify-between"><span>Ingresos del mes:</span> <span className="font-semibold text-slate-800">{vgOrgIngresosMes}</span></li>
            <li className="flex justify-between"><span>Ajustes negativos del mes:</span> <span className="font-semibold text-red-600">{vgOrgAjustesNegMes}</span></li>
            <li className="flex justify-between"><span>Registros activos:</span> <span className="font-semibold text-slate-800">{vgActivos}</span></li>
            <li className="flex justify-between"><span>En descuento:</span> <span className="font-semibold text-orange-600">{vgEnDescuento}</span></li>
            <li className="flex justify-between"><span>Cerrados:</span> <span className="font-semibold text-slate-800">{vgCerrados}</span></li>
            <li className="flex justify-between"><span>Vales asignados colabs.:</span> <span className="font-semibold text-slate-800">{vgAsignadosTotal}</span></li>
            <li className="flex justify-between"><span>Total descontado:</span> <span className="font-semibold text-slate-800">{vgTotalDescontado}</span></li>
            <li className="flex justify-between"><span>Saldo pendiente colabs.:</span> <span className="font-semibold text-emerald-600">{vgSaldoTotal}</span></li>
          </ul>
        </div>

        {/* Reclutamiento */}
        <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/20">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-1.5 flex items-center justify-between">
            <span>👥 Reclutamiento</span>
            <span className="text-xs text-slate-400">Total mes: {reclTotal}</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex justify-between"><span>Abiertos:</span> <span className="font-semibold text-green-700">{reclAbiertos}</span></li>
            <li className="flex justify-between"><span>Cerrados:</span> <span className="font-semibold text-slate-800">{reclCerrados}</span></li>
            <li className="flex justify-between"><span>Pausados:</span> <span className="font-semibold text-yellow-700">{reclPausados}</span></li>
            <li className="flex justify-between"><span>Desistidos:</span> <span className="font-semibold text-red-600">{reclDesistidos}</span></li>
            <li className="flex justify-between"><span>Bloqueados:</span> <span className="font-semibold text-red-600">{reclBloqueados}</span></li>
            <li className="flex justify-between"><span>Avance promedio:</span> <span className="font-semibold text-blue-700">{reclAvanceProm}%</span></li>
          </ul>
        </div>

      </div>

      {/* Lower section: Bloqueos & Carga Real vs Planificación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Bloqueos */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-2 flex items-center justify-between">
            <span>🚫 Frecuencia de Bloqueos en el Período</span>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Alerta</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(blockCounts).map(([block, count]) => {
              const maxCount = Math.max(...Object.values(blockCounts), 1);
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={block} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{block}</span>
                    <span className="font-semibold text-slate-800">{count} veces</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carga Real vs Planificación */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm border-b pb-2 flex items-center justify-between">
            <span>📅 Carga Real vs Planificación Formal</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Carga real</span>
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-lg border">
                <div className="text-[10px] text-slate-500 uppercase">Planificados</div>
                <div className="text-lg font-bold text-slate-700">{cursosPlanificados}</div>
              </div>
              <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                <div className="text-[10px] text-red-500 uppercase">Urgentes nuevos</div>
                <div className="text-lg font-bold text-red-700">{cursosUrgentesNuevos}</div>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                <div className="text-[10px] text-amber-500 uppercase">No planificados</div>
                <div className="text-lg font-bold text-amber-700">{cursosNoPlanificadosNecesarios}</div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-lg border text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Carga de Trabajo Total (Real):</span>
                <span className="font-bold text-slate-800">{totalCursosReal} cursos</span>
              </div>
              <div className="flex justify-between">
                <span>Diferencia con Planificación Formal:</span>
                <span className={`font-bold ${diffPlanificadoReal > 0 ? "text-red-600" : "text-slate-800"}`}>
                  {diffPlanificadoReal > 0 ? `+${diffPlanificadoReal}` : diffPlanificadoReal} cursos
                </span>
              </div>
            </div>

            {diffPlanificadoReal > 0 && (
              <div className="text-xs text-red-700 bg-red-50/50 border border-red-100 rounded-lg p-3">
                ⚠️ <span className="font-semibold">Carga de trabajo excedida:</span> La aparición de cursos no planificados y requerimientos urgentes ha incrementado la carga operativa en un <span className="font-bold">{(diffPlanificadoReal / (cursosPlanificados || 1) * 100).toFixed(0)}%</span> por sobre la planificación inicial.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Export & Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end border-t border-slate-100 pt-4">
        <button
          onClick={copyExecutiveSummary}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          📋 Copiar Resumen Ejecutivo
        </button>
        <button
          onClick={exportReportJSON}
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition-colors"
        >
          📥 Descargar Reporte JSON
        </button>
        <button
          onClick={exportReportXLSX}
          className="px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          📥 Descargar Reporte XLSX
        </button>
      </div>
    </div>
  );
}

// ── MÓDULO VALES DE GAS ─────────────────────────

function ModuloValesGas({ data, search, setSearch, openNew, openEdit, deleteItem, getResponsableName, tableLoading }: any) {
  const [filterEstado, setFilterEstado] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterPeriodo, setFilterPeriodo] = useState("");
  const [filterOrgTipo, setFilterOrgTipo] = useState("");
  const [filterOrgPeriodo, setFilterOrgPeriodo] = useState("");

  const valesGas: ValeGas[] = data.valesGas || [];
  const valesGasOrg: ValeGasOrg[] = data.valesGasOrganizacion || [];

  // ── Bloque 1: KPIs generales ──
  const stockOrg = valesGasOrg.reduce((s, v) => {
    if (v.tipoMovimiento === "Ajuste negativo") return s - (v.cantidadVales || 0);
    return s + (v.cantidadVales || 0);
  }, 0);
  const valesAsignadosColabs = valesGas.reduce((s, v) => s + (v.totalValesAsignados || 0), 0);
  const valesUtilizados = valesGas.reduce((s, v) => s + (v.valesUsados || 0), 0);
  const saldoDisponibleOrg = stockOrg - valesAsignadosColabs;
  const saldoPendienteColabs = valesGas.reduce((s, v) => s + (v.saldoVales || 0), 0);
  const totalDescontadoColabs = valesGas.reduce((s, v) => s + (v.totalDescontado || 0), 0);
  const registrosEnDescuento = valesGas.filter(v => v.estado === "En descuento").length;

  // ── Bloque 2: Filtros org ──
  const orgPeriodos = Array.from(new Set(valesGasOrg.map(v => v.periodo).filter(Boolean)));
  const filteredOrg = valesGasOrg.filter(v => {
    const matchTipo = !filterOrgTipo || v.tipoMovimiento === filterOrgTipo;
    const matchPeriodo = !filterOrgPeriodo || v.periodo === filterOrgPeriodo;
    return matchTipo && matchPeriodo;
  });

  // ── Bloque 3: Filtros colaboradores ──
  const areas = Array.from(new Set(valesGas.map((v: ValeGas) => v.area).filter(Boolean)));
  const periodos = Array.from(new Set(valesGas.map((v: ValeGas) => v.periodo).filter(Boolean)));
  const filtered = valesGas.filter((v: ValeGas) => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.colaborador.toLowerCase().includes(q) || v.area.toLowerCase().includes(q) || v.periodo.toLowerCase().includes(q);
    const matchEstado = !filterEstado || v.estado === filterEstado;
    const matchArea = !filterArea || v.area === filterArea;
    const matchPeriodo = !filterPeriodo || v.periodo === filterPeriodo;
    return matchSearch && matchEstado && matchArea && matchPeriodo;
  });

  const columnsColabs = [
    { key: "colaborador", label: "Colaborador" },
    { key: "area", label: "Área" },
    { key: "periodo", label: "Período" },
    { key: "fechaEntrega", label: "Fecha entrega", render: (v: ValeGas) => toDDMMYYYY(v.fechaEntrega) },
    { key: "totalValesAsignados", label: "Vales asignados" },
    { key: "valesUsados", label: "Vales utilizados" },
    { key: "saldoVales", label: "Saldo colaborador" },
    { key: "descuentoDiario", label: "Desc/día" },
    { key: "diasDescuento", label: "Días desc." },
    { key: "totalDescontado", label: "Total desc." },
    { key: "estado", label: "Estado", render: (v: ValeGas) => <Badge label={v.estado} colorClass={estadoColor[v.estado] || ""} /> },
    { key: "responsable", label: "Responsable", render: (v: ValeGas) => getResponsableName(data, v.responsableId) },
    { key: "fechaProximaRevision", label: "Próx. revisión", render: (v: ValeGas) => v.fechaProximaRevision ? <SemaforoBadge fecha={v.fechaProximaRevision} /> : <span className="text-slate-400 text-xs">Sin fecha</span> },
    { key: "observaciones", label: "Observaciones" },
  ];

  const columnsOrg = [
    { key: "fechaRegistro", label: "Fecha registro", render: (v: ValeGasOrg) => toDDMMYYYY(v.fechaRegistro) },
    { key: "periodo", label: "Período" },
    { key: "tipoMovimiento", label: "Tipo movimiento" },
    { key: "cantidadVales", label: "Cantidad" },
    { key: "motivo", label: "Motivo" },
    { key: "responsable", label: "Responsable", render: (v: ValeGasOrg) => getResponsableName(data, v.responsableId) },
    { key: "observaciones", label: "Observaciones" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="⛽"
        title="Vales de Gas"
        subtitle="Control integral de stock organizacional y distribución a colaboradores."
      />

      {/* ── BLOQUE 1: RESUMEN GENERAL ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Resumen general (calculado)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stockOrg}</div>
            <div className="text-xs text-slate-500 mt-0.5">Stock organización</div>
          </div>
          <div className={`border rounded-xl p-3 text-center ${saldoDisponibleOrg < 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
            <div className={`text-2xl font-bold ${saldoDisponibleOrg < 0 ? "text-red-600" : "text-emerald-600"}`}>{saldoDisponibleOrg}</div>
            <div className="text-xs text-slate-500 mt-0.5">Saldo disponible org.</div>
            {saldoDisponibleOrg < 0 && <div className="text-xs text-red-600 mt-1 font-semibold">⚠ Más asignados que stock registrado</div>}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-indigo-700">{valesAsignadosColabs}</div>
            <div className="text-xs text-slate-500 mt-0.5">Vales asignados</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{valesUtilizados}</div>
            <div className="text-xs text-slate-500 mt-0.5">Vales utilizados</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{saldoPendienteColabs}</div>
            <div className="text-xs text-slate-500 mt-0.5">Saldo pendiente colabs.</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-slate-700">{totalDescontadoColabs}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total descontado</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-700">{registrosEnDescuento}</div>
            <div className="text-xs text-slate-500 mt-0.5">En descuento</div>
          </div>
        </div>
      </div>

      {/* ── BLOQUE 2: MOVIMIENTOS ORGANIZACIÓN ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Movimientos de vales — Organización</h2>
          <button onClick={() => openNew("valesGasOrganizacion")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">+ Registrar vales organización</button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select aria-label="Filtrar por tipo" value={filterOrgTipo} onChange={e => setFilterOrgTipo(e.target.value)} className={INPUT_BASE}>
            <option value="">Todos los tipos</option>
            {TIPOS_MOVIMIENTO_VALES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select aria-label="Filtrar por período" value={filterOrgPeriodo} onChange={e => setFilterOrgPeriodo(e.target.value)} className={INPUT_BASE}>
            <option value="">Todos los períodos</option>
            {orgPeriodos.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
          </select>
          {(filterOrgTipo || filterOrgPeriodo) && (
            <button onClick={() => { setFilterOrgTipo(""); setFilterOrgPeriodo(""); }} className="text-xs text-slate-500 hover:text-red-600 transition-colors">✕ Limpiar</button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table
            columns={columnsOrg}
            rows={filteredOrg}
            loading={tableLoading}
            onEdit={(r: ValeGasOrg) => openEdit("valesGasOrganizacion", r)}
            onDelete={deleteItem ? (id: string) => deleteItem("valesGasOrganizacion", id) : undefined}
          />
        </div>
      </div>

      {/* ── BLOQUE 3: ENTREGAS A COLABORADORES ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Registros por colaborador</h2>
          <button onClick={() => openNew("valesGas")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo registro colaborador</button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por colaborador, área o período..."
            aria-label="Buscar vales de colaborador"
            className={cn(INPUT_BASE, "w-64")}
          />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} aria-label="Filtrar por estado" className={INPUT_BASE}>
            <option value="">Todos los estados</option>
            {ESTADOS_VALE_GAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)} aria-label="Filtrar por área" className={INPUT_BASE}>
            <option value="">Todas las áreas</option>
            {areas.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
          </select>
          <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)} aria-label="Filtrar por período" className={INPUT_BASE}>
            <option value="">Todos los períodos</option>
            {periodos.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
          </select>
          {(filterEstado || filterArea || filterPeriodo || search) && (
            <button onClick={() => { setFilterEstado(""); setFilterArea(""); setFilterPeriodo(""); setSearch(""); }} className="text-xs text-slate-500 hover:text-red-600 transition-colors">✕ Limpiar filtros</button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table
            columns={columnsColabs}
            rows={filtered}
            loading={tableLoading}
            onEdit={(r: ValeGas) => openEdit("valesGas", r)}
            onDelete={deleteItem ? (id: string) => deleteItem("valesGas", id) : undefined}
          />
        </div>
      </div>
    </div>
  );
}

// ── MÓDULO RECLUTAMIENTO ─────────────────────────

function ModuloReclutamiento({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, markClosed, tableLoading }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPlanta, setFiltroPlanta] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroReclutador, setFiltroReclutador] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");

  // suppress lint: setFiltroReclutador available for future filter UI
  void setFiltroReclutador;

  const reclutamientos: ProcesoReclutamiento[] = data.reclutamiento || [];

  const total = reclutamientos.length;
  const abiertos = reclutamientos.filter(r => r.proceso === "Abierto").length;
  const cerrados = reclutamientos.filter(r => r.proceso === "Cerrado").length;
  const pausados = reclutamientos.filter(r => r.proceso === "Pausado").length;
  const desistidos = reclutamientos.filter(r => r.proceso === "Desistido").length;
  const bloqueados = reclutamientos.filter(r => !["Cerrado","Desistido"].includes(r.proceso) && r.bloqueadoPor && r.bloqueadoPor !== "Sin bloqueo").length;

  const filtered = reclutamientos.filter(r => {
    if (filtroEstado && r.proceso !== filtroEstado) return false;
    if (filtroPlanta && r.plantaCentro !== filtroPlanta) return false;
    if (filtroTipo && r.tipoVacante !== filtroTipo) return false;
    if (filtroMes && r.mesIngreso !== filtroMes) return false;
    if (filtroReclutador && r.reclutador !== filtroReclutador) return false;
    if (filtroPrioridad && r.prioridad !== filtroPrioridad) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!r.reclutamiento?.toLowerCase().includes(s) &&
          !r.plantaCentro?.toLowerCase().includes(s) &&
          !r.tipoVacante?.toLowerCase().includes(s) &&
          !r.mesIngreso?.toLowerCase().includes(s) &&
          !r.reclutador?.toLowerCase().includes(s) &&
          !r.proceso?.toLowerCase().includes(s) &&
          !r.observaciones?.toLowerCase().includes(s) &&
          !r.proximaAccion?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const columns = [
    { key: "reclutamiento", label: "Tipo recl." },
    { key: "plantaCentro", label: "Planta / Centro" },
    { key: "tipoVacante", label: "Tipo vacante" },
    { key: "mesIngreso", label: "Mes ingreso" },
    { key: "reclutador", label: "Reclutador" },
    { key: "proceso", label: "Proceso", render: (r: ProcesoReclutamiento) => <Badge label={r.proceso} colorClass={r.proceso === "Abierto" ? "bg-green-100 text-green-700" : r.proceso === "Cerrado" ? "bg-slate-200 text-slate-600" : r.proceso === "Pausado" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"} /> },
    { key: "avance", label: "Avance", render: (r: ProcesoReclutamiento) => { const { pct } = calcReclutamientoAvance(r); return <div className="flex items-center gap-2"><div className="w-16 bg-slate-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{width:`${pct}%`}}/></div><span className="text-xs text-slate-600">{pct}%</span></div>; } },
    { key: "etapaActual", label: "Etapa actual", render: (r: ProcesoReclutamiento) => { const { etapaActual } = calcReclutamientoAvance(r); return <span className="text-xs text-slate-600 max-w-[120px] truncate block">{etapaActual}</span>; } },
    { key: "prioridad", label: "Prioridad", render: (r: ProcesoReclutamiento) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> },
    { key: "bloqueadoPor", label: "Bloqueo", render: (r: ProcesoReclutamiento) => r.bloqueadoPor !== "Sin bloqueo" && r.bloqueadoPor ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" },
    { key: "proximaAccion", label: "Próxima acción", render: (r: ProcesoReclutamiento) => <span className="text-xs text-slate-600 max-w-[140px] truncate block">{r.proximaAccion || "-"}</span> },
    { key: "semaforo", label: "Semáforo", render: (r: ProcesoReclutamiento) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaIngreso} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon="👥"
        title="Reclutamiento"
        subtitle="Control de procesos de reclutamiento y selección de personal."
        actions={<button onClick={() => openNew("reclutamiento")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nuevo proceso</button>}
      />

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total", val: total, variant: "default" as const },
          { label: "Abiertos", val: abiertos, variant: "success" as const },
          { label: "Cerrados", val: cerrados, variant: "default" as const },
          { label: "Pausados", val: pausados, variant: "warning" as const },
          { label: "Desistidos", val: desistidos, variant: "danger" as const },
          { label: "Bloqueados", val: bloqueados, variant: bloqueados > 0 ? "danger" as const : "default" as const },
        ].map(k => (
          <KpiCardUI key={k.label} label={k.label} value={k.val} variant={k.variant} />
        ))}
      </div>

      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar por planta, tipo, reclutador..." filters={<>
        <Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_PROCESO_RECLUTAMIENTO} placeholder="Proceso" />
        <Select value={filtroPlanta} onChange={setFiltroPlanta} options={PLANTAS_CENTROS} placeholder="Planta / Centro" />
        <Select value={filtroTipo} onChange={setFiltroTipo} options={TIPOS_VACANTE} placeholder="Tipo vacante" />
        <Select value={filtroMes} onChange={setFiltroMes} options={MESES} placeholder="Mes ingreso" />
        <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
      </>} />

      <Table
        columns={columns}
        rows={filtered}
        loading={tableLoading}
        onEdit={(r: any) => openEdit("reclutamiento", r)}
        onDelete={deleteItem ? (id: string) => deleteItem("reclutamiento", id) : undefined}
        onDuplicate={duplicateItem ? (r: any) => duplicateItem("reclutamiento", r) : undefined}
        onMarkClosed={markClosed ? (id: string) => markClosed("reclutamiento", id, "Cerrado") : undefined}
        closedState="Cerrado"
        emptyMessage="Aún no hay procesos de reclutamiento"
        emptyHint="Crea el primero con «+ Nuevo proceso» o importa desde la plantilla XLSX."
      />
      <p className="text-xs text-slate-400">Mostrando {filtered.length} de {total} procesos</p>
    </div>
  );
}
