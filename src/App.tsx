import React, { useEffect, useMemo, useState } from "react";
import { Badge, SemaforoBadge, prioridadColor, estadoColor } from "./shared/badges";
import type { ConfirmState, ToastType, ToastItem } from "./shared/formTypes";
import { fmtCLP, resolveResponsable, getResponsableName } from "./shared/dataHelpers";
import { calcPctRecl } from "./shared/reclutamientoHelpers";
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
import { ModuloContactos } from "./modules/ModuloContactos";
import { ModuloCursos } from "./modules/ModuloCursos";
import { ModuloDashboard } from "./modules/ModuloDashboard";
import { ModuloDiplomas } from "./modules/ModuloDiplomas";
import { ModuloEvaluaciones } from "./modules/ModuloEvaluaciones";
import { ModuloMiDia } from "./modules/ModuloMiDia";
import { ModuloOCs } from "./modules/ModuloOCs";
import { ModuloPracticantes } from "./modules/ModuloPracticantes";
import { ModuloProcesos } from "./modules/ModuloProcesos";
import { ModuloReclutamiento } from "./modules/ModuloReclutamiento";
import { ModuloPresupuesto } from "./modules/ModuloPresupuesto";
import { ModuloConfiguracion } from "./modules/ModuloConfiguracion";
import { ModuloValesGas } from "./modules/ModuloValesGas";
import {
  ahora,
  createDataToSave,
  duplicateRecord,
  genId,
  hoy,
  isClosedRecord,
  markRecordClosed,
  normalizeDateFromXlsx,
  normalizeReclutamientoCampo,
  normalizeYesNo,
  parseXlsxMoney,
  parseXlsxNumber,
  semaforo,
} from "./utils/appHelpers";
import type {
  AppData,
  BackupItem,
  CargaSemanal,
  Contacto,
  ModuloKey,
  ProcesoReclutamiento,
  ValeGas,
  ValeGasOrg,
} from "./domain/types";
import {
  MESES,
} from "./domain/options";
import { ensureBudgetRows } from "./domain/budget";
import { createBackup, getLocalBackups } from "./storage/backupStorage";
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
import { Select } from "./components/forms/fields";
import {
  ConfirmDialog,
  ErrorBoundary,
  KpiCard as KpiCardUI,
  Modal,
  ModuleHeader,
  SectionCard,
  SkeletonCard,
  SkeletonTable,
  ToastContainer,
} from "./components/ui";
import { login as authLogin, getSession, logout as authLogout, refreshSession } from "./auth/authService";
import { can } from "./auth/permissions";
import { logAudit } from "./audit/auditService";
import { Sidebar } from "./components/sidebar/Sidebar";
import {
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  Clock,
  FileText,
  Search,
  Settings,
  ShieldOff,
  TrendingUp,
  Zap,
} from "lucide-react";

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

const SIDEBAR_TO_MODULO: Record<string, Modulo> = {
  inicio: "inicio", miDia: "midia", dashboard: "dashboard",
  cursos: "cursos", ocs: "ocs", procesos: "procesos",
  practicantes: "practicantes", evaluaciones: "evaluaciones",
  reclutamiento: "reclutamiento", contactos: "contactos",
  diplomas: "diplomas", presupuesto: "presupuesto",
  valesGas: "valesGas", cargaSemanal: "cargaSemanal",
  configuracion: "configuracion",
};
const MODULO_TO_SIDEBAR: Record<string, string> = Object.fromEntries(
  Object.entries(SIDEBAR_TO_MODULO).map(([k, v]) => [v, k])
);

const MODULE_BREADCRUMB: Record<string, { group: string; label: string }> = {
  inicio:        { group: "",           label: "Inicio" },
  midia:         { group: "Operación",  label: "Mi Día" },
  dashboard:     { group: "Operación",  label: "Dashboard" },
  cursos:        { group: "Operación",  label: "Cursos / DNC" },
  ocs:           { group: "Operación",  label: "OCs Pendientes" },
  procesos:      { group: "Operación",  label: "Procesos Pend." },
  practicantes:  { group: "Personas",   label: "Practicantes" },
  evaluaciones:  { group: "Personas",   label: "Evaluaciones" },
  reclutamiento: { group: "Personas",   label: "Reclutamiento" },
  contactos:     { group: "Personas",   label: "Contactos" },
  diplomas:      { group: "Documentos", label: "Diplomas/Cert/Lic" },
  presupuesto:   { group: "Finanzas",   label: "Presupuesto" },
  valesGas:      { group: "Finanzas",   label: "Vales de Gas" },
  cargaSemanal:  { group: "Finanzas",   label: "Carga Semanal" },
  configuracion: { group: "Sistema",    label: "Configuración" },
};

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
      <Sidebar
        activeId={MODULO_TO_SIDEBAR[activeModulo] ?? activeModulo}
        onSelect={(id) => { const m = SIDEBAR_TO_MODULO[id]; if (m) setActiveModulo(m); }}
        focusMode={focusMode}
        onFocusModeChange={toggleFocusMode}
        onQuickCapture={() => setCaptureOpen(true)}
        onLogout={logout}
        version={data.meta.version}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Global top bar */}
        <div className="h-12 bg-white border-b border-slate-200 flex items-center gap-3 px-5 shrink-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            {MODULE_BREADCRUMB[activeModulo]?.group && (
              <>
                <span className="text-slate-400 truncate">{MODULE_BREADCRUMB[activeModulo].group}</span>
                <span className="text-slate-300">/</span>
              </>
            )}
            <span className="text-slate-700 font-medium truncate">{MODULE_BREADCRUMB[activeModulo]?.label ?? activeModulo}</span>
          </nav>
          {/* Global search (decorativo) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-56 cursor-default select-none">
            <Search size={12} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 flex-1">Buscar en toda la app...</span>
            <kbd className="text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1 py-0.5 font-sans">⌘K</kbd>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" aria-label="Notificaciones">
            <Bell size={15} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" aria-label="Configuración">
            <Settings size={15} />
          </button>
        </div>
        {/* Page content */}
        <div className={`flex-1 overflow-y-auto ${focusMode ? "p-4 max-w-4xl mx-auto" : "p-6"}`}>
      <ErrorBoundary>
        {activeModulo === "inicio" && (
          <div className="space-y-6">
            {/* Saludo */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 leading-tight">PulsoLaboral</h1>
                <p className="text-sm text-slate-500 mt-0.5">Registra todo el mismo día · Revisa cada mañana · Cierra lo que termines</p>
              </div>
              <button
                onClick={() => setCaptureOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shrink-0"
              >
                <Zap size={14} strokeWidth={2} />
                Captura rápida
              </button>
            </div>

            {/* 3 KPIs héroe — los datos críticos al abrir el día */}
            <div className="grid grid-cols-3 gap-4">
              <KpiCardUI
                size="hero"
                label="Vencidos sin cerrar"
                value={dashboardData.semaforoCounts.vencido}
                icon={<AlertTriangle size={22} strokeWidth={2} />}
                variant={dashboardData.semaforoCounts.vencido > 0 ? "danger" : "default"}
                onClick={() => setActiveModulo("dashboard")}
              />
              <KpiCardUI
                size="hero"
                label="P1 Críticos activos"
                value={dashboardData.cursosP1}
                icon={<Zap size={22} strokeWidth={2} />}
                variant={dashboardData.cursosP1 > 0 ? "danger" : "default"}
                onClick={() => setActiveModulo("cursos")}
              />
              <KpiCardUI
                size="hero"
                label="Procesos bloqueados"
                value={dashboardData.procesosBloqueados}
                icon={<ShieldOff size={22} strokeWidth={2} />}
                variant={dashboardData.procesosBloqueados > 0 ? "warning" : "default"}
                onClick={() => setActiveModulo("procesos")}
              />
            </div>

            {/* Lo más urgente — bandeja priorizada compacta */}
            {dashboardData.bandeja.length > 0 && (
              <SectionCard
                title={<span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" />Lo más urgente</span>}
                subtitle={`${Math.min(dashboardData.bandeja.length, 8)} ítems priorizados de todos los módulos activos`}
                noPadding
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left" aria-label="Bandeja urgente">
                    <thead>
                      <tr className="bg-[#f7f8fb] border-b border-slate-100">
                        {["Tipo","Nombre","Prioridad","Estado","Fecha","Módulo"].map(h => (
                          <th key={h} scope="col" className="px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dashboardData.bandeja.slice(0, 8).map((item, i) => (
                        <tr
                          key={`inicio_${item.modulo}_${i}`}
                          className="hover:bg-[#f7f8fb] transition-colors cursor-pointer"
                          onClick={() => setActiveModulo(item.modulo as Modulo)}
                        >
                          <td className="px-4 py-2.5"><Badge label={item.tipo} colorClass="bg-slate-100 text-slate-600 border border-slate-200" /></td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[220px]"><div className="truncate">{item.nombre}</div></td>
                          <td className="px-4 py-2.5"><Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} /></td>
                          <td className="px-4 py-2.5"><Badge label={item.estado} colorClass={estadoColor[item.estado] || ""} /></td>
                          <td className="px-4 py-2.5">{item.fechaProximaAccion ? <SemaforoBadge fecha={item.fechaProximaAccion} /> : <span className="text-slate-300 text-xs">—</span>}</td>
                          <td className="px-4 py-2.5 text-xs text-blue-600">{item.modulo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dashboardData.bandeja.length > 8 && (
                  <div className="px-4 py-3 border-t border-slate-100">
                    <button onClick={() => setActiveModulo("dashboard")} className="text-xs text-blue-600 hover:underline">
                      Ver {dashboardData.bandeja.length - 8} más en Dashboard
                    </button>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Accesos rápidos + stats secundarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Accesos rápidos">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setActiveModulo("cursos"); openNew("cursos"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition font-medium">+ Nuevo curso</button>
                  <button onClick={() => { setActiveModulo("ocs"); openNew("ocs"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition font-medium">+ Nueva OC</button>
                  <button onClick={() => { setActiveModulo("practicantes"); openNew("practicantes"); }} className="text-xs bg-slate-100 text-slate-700 rounded-lg px-3 py-2 hover:bg-slate-200 transition font-medium">+ Practicante</button>
                  <button onClick={() => { setActiveModulo("diplomas"); openNew("diplomas"); }} className="text-xs bg-slate-100 text-slate-700 rounded-lg px-3 py-2 hover:bg-slate-200 transition font-medium">+ Diploma</button>
                  {(canExportFull || canExportAnonymized) && (
                    <button onClick={canExportFull ? exportXLSX : exportXLSXAnonymized} className="text-xs bg-slate-100 text-slate-700 rounded-lg px-3 py-2 hover:bg-slate-200 transition font-medium">Exportar XLSX</button>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title={<span className="flex items-center gap-2"><TrendingUp size={14} className="text-slate-400" />Estado general</span>}
                noPadding
              >
                <div className="divide-y divide-slate-50">
                  <KpiCardUI size="mini" label="Cursos abiertos" value={dashboardData.cursosAbiertos} icon={<BookOpen size={14} />} variant="info" onClick={() => setActiveModulo("cursos")} />
                  <KpiCardUI size="mini" label="OCs pendientes" value={dashboardData.ocsPendientes} icon={<FileText size={14} />} variant={dashboardData.ocsPendientes > 3 ? "warning" : "default"} onClick={() => setActiveModulo("ocs")} />
                  <KpiCardUI size="mini" label="Pendientes BUK" value={dashboardData.diplomasBUK} icon={<Award size={14} />} variant={dashboardData.diplomasBUK > 0 ? "danger" : "default"} onClick={() => setActiveModulo("diplomas")} />
                  <KpiCardUI size="mini" label="Evaluaciones abiertas" value={dashboardData.evaluacionesAbiertas} icon={<ClipboardCheck size={14} />} variant="purple" onClick={() => setActiveModulo("evaluaciones")} />
                  <KpiCardUI size="mini" label="Sin actualizar +7d" value={dashboardData.sinActualizar} icon={<Clock size={14} />} variant={dashboardData.sinActualizar > 0 ? "warning" : "default"} />
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {activeModulo === "midia" && <ModuloMiDia data={data} setActiveModulo={setActiveModulo} onCapturaRapida={() => setCaptureOpen(true)} />}
        {activeModulo === "dashboard" && (
          <ModuloDashboard
            data={data}
            dashboardData={dashboardData}
            chartCursosPorPrioridad={chartCursosPorPrioridad}
            chartEvaluacionesPorEstado={chartEvaluacionesPorEstado}
            chartPresupuesto={chartPresupuesto}
            reporteMensual={<ModuloReporteMensual data={data} toastShow={toastShow} />}
            setActiveModulo={setActiveModulo}
          />
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


        <div aria-live="polite">
          <ToastContainer toasts={toasts.map(({ id, ...rest }) => rest)} onRemove={(index) => {
            const target = toasts[index];
            if (target) removeToast(target.id);
          }} />
        </div>
      </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

// ── HELPER COMPONENTS ────────────────────────
// ── MODULE COMPONENTS ────────────────────────

function ModuloCargaSemanal({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, tableLoading }: any) {
  const filtered = data.cargaSemanal.filter((c: CargaSemanal) => { if (search && !c.semana.toLowerCase().includes(search.toLowerCase()) && !c.comentario.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const columns = [{ key: "semana", label: "Semana" }, { key: "cursosPlanificados", label: "Planificados" }, { key: "cursosUrgentesNuevos", label: "Urgentes nuevos" }, { key: "cursosNoPlanificados", label: "No planificados" }, { key: "ocsNuevas", label: "OCs nuevas" }, { key: "diplomasPendientes", label: "Diplomas pend." }, { key: "procesosBloqueados", label: "Proc. bloqueados" }, { key: "comentario", label: "Comentario" }];

  return (
    <div className="space-y-5">
      <ModuleHeader
        icon={<CalendarRange size={20} className="text-white" />}
        gradient="from-emerald-400 to-teal-500"
        title="Carga Semanal"
        subtitle="Registro de carga operativa real vs planificada por semana."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar semana..."
        actions={<button onClick={() => openNew("cargaSemanal")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Nueva semana</button>}
      />
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
