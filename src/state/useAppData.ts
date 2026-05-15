import { useCallback, useEffect, useRef, useState } from "react";
import type { AppData, Contacto } from "../domain/types";
import { ensureBudgetRows } from "../domain/budget";
import { ahora, createDataToSave, genId, hoy } from "../utils/appHelpers";
import { readStorageJSON, removeStorageKey, saveAppData, writeStorageJSON, STORAGE_KEY } from "../storage/localStorage";
import { migrateData } from "../storage/migrations";
import { clearCachedPassphrase, decryptAppData, encryptAppData, getCachedPassphrase, isEncryptedPayload, type EncryptedPayload } from "../storage/encryption";
import { loadRemoteData, saveRemoteData, subscribeToRemoteChanges } from "../backend/supabaseSync";
import { supabase, SUPABASE_CONFIGURED } from "../backend/supabaseClient";
import { getUserWorkspace, setCachedWorkspaceId, clearWorkspaceCache, type Workspace } from "../backend/supabaseWorkspace";
let xlsxModule: typeof import("xlsx") | null = null;
export const getXlsx = async () => {
  if (!xlsxModule) {
    xlsxModule = await import("xlsx");
  }
  return xlsxModule;
};
// SAMPLE DATA
// ──────────────────────────────────────────────

export function crearDatosEjemplo(): AppData {
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

export function hydrateData(raw: unknown): AppData {
  const parsed = migrateData(raw, crearDatosEjemplo());
  parsed.presupuesto = ensureBudgetRows(parsed.presupuesto);
  return parsed;
}

export function limpiarDatos(storageKey = STORAGE_KEY) {
  removeStorageKey(storageKey);
  clearCachedPassphrase();
}

export function storageKeyForUser(username: string): string {
  return `control_operativo_v5_${username.toLowerCase()}`;
}

// ──────────────────────────────────────────────
export function useAppData(storageKey = STORAGE_KEY) {
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

  useEffect(() => {
    let active = true;
    const init = async () => {
      const raw = readStorageJSON<unknown>(storageKey);
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
  }, [storageKey]);

  // Workspace state: null = not resolved yet, "" = needs setup, id = ready
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [needsWorkspaceSetup, setNeedsWorkspaceSetup] = useState(false);

  // When Supabase session becomes available: resolve workspace, then sync data
  const dataRef = useRef<AppData | null>(null);
  dataRef.current = data;
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        clearWorkspaceCache();
        setWorkspaceId(null);
        setNeedsWorkspaceSetup(false);
        return;
      }
      getUserWorkspace().then(result => {
        if (!result.ok) { setNeedsWorkspaceSetup(true); return; }
        if (result.data) {
          const wsId = result.data.id;
          setCachedWorkspaceId(wsId);
          setWorkspaceId(wsId);
          setNeedsWorkspaceSetup(false);
          loadRemoteData().then(r => {
            if (r.ok && r.data) {
              const remote = hydrateData(r.data);
              setData(remote);
              saveAppData(storageKey, remote);
            } else if (dataRef.current) {
              saveRemoteData(dataRef.current).catch(() => {});
            }
          }).catch(() => {});
        } else {
          setNeedsWorkspaceSetup(true);
        }
      }).catch(() => {});
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Called from WorkspaceSetup after user creates or joins a workspace
  const onWorkspaceReady = useCallback((ws: Workspace) => {
    setCachedWorkspaceId(ws.id);
    setWorkspaceId(ws.id);
    setNeedsWorkspaceSetup(false);
    loadRemoteData().then(r => {
      if (r.ok && r.data) {
        const remote = hydrateData(r.data);
        setData(remote);
        saveAppData(storageKey, remote);
      } else if (dataRef.current) {
        saveRemoteData(dataRef.current).catch(() => {});
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Subscribe to real-time changes from collaborators in the same workspace
  const setDataRef = useRef(setData);
  setDataRef.current = setData;
  useEffect(() => {
    if (!dataReady || !workspaceId) return;
    return subscribeToRemoteChanges(workspaceId, newData => {
      const hydrated = hydrateData(newData);
      setDataRef.current(hydrated);
      saveAppData(storageKey, hydrated);
    });
  }, [dataReady, workspaceId, storageKey]);

  // Track last data sent to Supabase to avoid redundant saves
  const lastRemoteSave = useRef<string>("");

  useEffect(() => {
    if (!dataReady) return;
    if (!encryptionEnabled) {
      saveAppData(storageKey, data);
      // Debounce + dedup: only push to Supabase after 2s of no changes AND data actually changed
      const timer = setTimeout(() => {
        const serialized = JSON.stringify(data);
        if (serialized === lastRemoteSave.current) return;
        lastRemoteSave.current = serialized;
        saveRemoteData(data).catch(() => {});
      }, 2000);
      return () => clearTimeout(timer);
    }
    const passphrase = getCachedPassphrase();
    if (!passphrase) return;
    const dataToSave = createDataToSave(data);
    void (async () => {
      try {
        const encrypted = await encryptAppData(dataToSave, passphrase);
        writeStorageJSON(storageKey, encrypted);
      } catch (error) {
        console.warn("[storage] No se pudo cifrar datos", error);
      }
    })();
  }, [data, dataReady, encryptionEnabled]);

  return {
    data,
    setData,
    dataReady,
    setDataReady,
    encryptionEnabled,
    setEncryptionEnabled,
    encryptedPayload,
    setEncryptedPayload,
    unlockOpen,
    setUnlockOpen,
    unlockPassphrase,
    setUnlockPassphrase,
    unlockError,
    setUnlockError,
    needsWorkspaceSetup,
    onWorkspaceReady,
  };
}