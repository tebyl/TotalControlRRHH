import React, { useState, useEffect, useMemo } from "react";

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

type DateInputProps = {
  value: string;
  onChange: (isoValue: string) => void;
  placeholder?: string;
};

function DateInput({ value, onChange, placeholder = "dd/mm/yyyy" }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(formatDateCL(value));

  useEffect(() => {
    setDisplayValue(formatDateCL(value));
  }, [value]);

  return (
    <input
      type="text"
      value={displayValue}
      placeholder={placeholder}
      className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full font-sans text-slate-800"
      inputMode="numeric"
      maxLength={10}
      onChange={(e) => {
        let v = e.target.value.replace(/[^\d]/g, "");

        if (v.length >= 5) {
          v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
        } else if (v.length >= 3) {
          v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
        }

        setDisplayValue(v);

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
          onChange(parseDateCL(v));
        } else if (v === "") {
          onChange("");
        }
      }}
      onBlur={() => {
        if (displayValue && !/^\d{2}\/\d{2}\/\d{4}$/.test(displayValue)) {
          alert("Formato de fecha inválido. Use dd/mm/yyyy");
        }
      }}
    />
  );
}
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────

const PRIORIDADES = ["P1 Crítico", "P2 Alto", "P3 Medio", "P4 Bajo"];
const ESTADOS_CURSO = ["Pendiente revisar", "En cotización", "En aprobación", "Programado", "Ejecutado", "Cerrado", "Detenido"];
const ESTADOS_OC = ["Pendiente crear", "Solicitada", "En aprobación", "Emitida", "Enviada proveedor", "Cerrada", "Detenida"];
const ESTADOS_PRACTICANTE = ["Por buscar", "En reclutamiento", "Seleccionado", "Activo", "Finalizado", "Detenido"];
const ESTADOS_DIPLOMA = ["Pedir a la OTEC", "Enviar o pedir al participante", "Subir a BUK", "Completado", "Detenido"];
const ESTADOS_BUK = ["Pendiente subir", "Subido", "Rechazado", "No aplica"];
const ESTADOS_EVALUACION = ["Pendiente solicitar", "Solicitada", "Agendada", "Realizada", "Informe recibido", "En revisión", "Cerrada", "Detenida"];
const RESULTADOS_EVALUACION = ["Recomendado", "Recomendado con observaciones", "No recomendado", "Pendiente", "No aplica"];
const TIPOS_EVALUACION = ["Psicolaboral", "Referencias laborales", "Evaluación técnica", "Evaluación mixta", "Otro"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ORIGENES_CURSO = ["DNC", "Carta Gantt", "Urgente no planificado", "No planificado necesario", "Emergente por operación", "Requerimiento legal", "Solicitud jefatura", "Reprogramado", "Otro"];
const BLOQUEOS = ["Sin bloqueo", "Falta aprobación", "Falta OC", "Falta cotización", "Falta OTEC", "Falta participante", "Falta jefatura", "Falta presupuesto", "Falta subir a BUK", "Falta candidato", "Falta proveedor", "Falta informe", "Otro"];
const RELACIONES = ["Interno", "OTEC", "Participante", "Jefatura", "Compras", "Finanzas", "RRHH", "BUK", "Psicólogo / Proveedor evaluación", "Otro"];
const TIPOS_PROCESO = ["Curso", "OC", "Presupuesto", "Practicante", "Reclutamiento", "Diploma / certificado / licencia", "BUK", "Otro"];
const TIPOS_DOCUMENTO = ["Diploma", "Certificado", "Licencia", "Otro"];

// ──────────────────────────────────────────────
// FORM COMPONENTS (Global)
// ──────────────────────────────────────────────

const Field = ({ label, children, error, required }: { label: string; children: React.ReactNode; error?: string; required?: boolean }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    <div className={error ? "[&>input]:border-red-300 [&>select]:border-red-300 [&>textarea]:border-red-300" : ""}>{children}</div>
    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
  </div>
);

// ── VALIDATION HELPERS ──────────────────────────
type VError = Record<string, string>;

function validateGeneral(form: any, mainFieldKey: string, mainFieldLabel: string): { errors: VError; warnings: string[] } {
  const errors: VError = {};
  const warnings: string[] = [];
  const today = hoy();

  // 1. Campo principal obligatorio
  if (!form[mainFieldKey]?.toString().trim()) {
    errors[mainFieldKey] = `${mainFieldLabel} es obligatorio.`;
  }

  // 2. P1 Crítico exige responsable, próxima acción y fecha
  if (form.prioridad === "P1 Crítico") {
    if (!form.responsableId) errors.responsableId = "Prioridad P1 requiere un responsable.";
    if (form.proximaAccion !== undefined && !form.proximaAccion?.trim()) errors.proximaAccion = "Prioridad P1 requiere definir la próxima acción.";
    if (form.fechaProximaAccion !== undefined && !form.fechaProximaAccion) errors.fechaProximaAccion = "Prioridad P1 requiere una fecha para la próxima acción.";
  }

  // 3. Detenido/a exige bloqueo y observación
  const estado = form.estado || form.estadoOC || form.estadoActual || "";
  if (estado === "Detenido" || estado === "Detenida") {
    if (!form.bloqueadoPor || form.bloqueadoPor === "Sin bloqueo") errors.bloqueadoPor = "Un registro detenido debe indicar qué lo bloquea.";
    if (!form.observaciones?.trim()) errors.observaciones = "Agrega una observación breve explicando por qué está detenido.";
  }

  // 4. Requiere OC = Sí
  if (form.requiereOC === "Sí" && !form.numeroOC?.trim()) {
    warnings.push("Requiere OC pero no tiene N° OC asociada. Recuerda gestionarla.");
  }

  // 5. Fecha vencida
  if (form.fechaProximaAccion && form.fechaProximaAccion < today) {
    warnings.push("La fecha próxima acción ya está vencida. Quedará marcada como vencida.");
  }

  // 6. Cerrado con bloqueo activo
  const closedStates = ["Cerrado", "Cerrada", "Completado", "Finalizado"];
  if (closedStates.includes(estado) && form.bloqueadoPor && form.bloqueadoPor !== "Sin bloqueo") {
    warnings.push("Este registro está cerrado. Se recomienda dejar \"Bloqueado por\" como \"Sin bloqueo\".");
  }

  return { errors, warnings };
}

function FormMessages({ errors, warnings }: { errors: VError; warnings: string[] }) {
  const errList = Object.values(errors);
  if (errList.length === 0 && warnings.length === 0) return null;
  return (
    <div className="md:col-span-2 space-y-2">
      {errList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <p className="font-medium mb-1">No se puede guardar — revisa estos campos:</p>
          <ul className="list-disc list-inside space-y-0.5">{errList.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
        </div>
      )}
    </div>
  );
}
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors" />;
const Select = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => <select value={value} onChange={e => onChange(e.target.value)} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors"><option value="">{placeholder}</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors" rows={3} />;

// ──────────────────────────────────────────────
// GLOBAL COMPONENTS (need data passed as prop)
// ──────────────────────────────────────────────

function SelectContact({ value, onChange, data }: { value: string; onChange: (v: string) => void; data: AppData }) {
  const activeContacts = data.contactos.filter(c => c.activo === "Sí");
  return <select value={value} onChange={e => onChange(e.target.value)} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors"><option value="">Sin responsable</option>{activeContacts.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>;
}

function Table({ columns, rows, onEdit, onDelete, onDuplicate, onMarkClosed, closedState }: { columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[]; rows: any[]; onEdit: (row: any) => void; onDelete: (id: string) => void; onDuplicate?: (row: any) => void; onMarkClosed?: (id: string) => void; closedState?: string; }) {
  if (rows.length === 0) return (
    <div className="text-center py-12 bg-white rounded-2xl border border-[#D9E2EC]">
      <p className="text-slate-400 text-sm mb-3">Aún no hay registros en este módulo</p>
      <p className="text-slate-400 text-xs">Usa el botón "Agregar nuevo" para crear el primero</p>
    </div>
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D9E2EC]">
      <table className="w-full text-sm text-left table-stripe">
        <thead><tr className="bg-[#F1F5F9] text-slate-500 text-xs font-medium tracking-wide">{columns.map(c => <th key={c.key} className="px-4 py-3 whitespace-nowrap">{c.label}</th>)}<th className="px-4 py-3 w-[180px]">Acciones</th></tr></thead>
        <tbody>{rows.map((row: any, i: number) => (<tr key={row.id || i} className="border-t border-[#F1F5F9] hover:bg-blue-50/40 transition-colors">{columns.map(c => (<td key={c.key} className="px-4 py-3 whitespace-nowrap">{c.render ? c.render(row) : (row as any)[c.key]}</td>))}<td className="px-4 py-3 whitespace-nowrap"><div className="flex gap-1.5"><button onClick={() => onEdit(row)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">Editar</button>{onMarkClosed && closedState && row.estado !== "Cerrado" && row.estado !== "Cerrada" && row.estado !== "Completado" && row.estado !== "Finalizado" && <button onClick={() => onMarkClosed(row.id)} className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">Cerrar</button>}{onDuplicate && <button onClick={() => onDuplicate(row)} className="px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-lg border border-violet-100 hover:bg-violet-100 transition-colors">Duplicar</button>}<button onClick={() => onDelete(row.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Eliminar</button></div></td></tr>))}</tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface Curso { id: string; curso: string; origen: string; area: string; solicitante: string; fechaSolicitud: string; fechaRequerida: string; estado: string; prioridad: string; nivelCritico: string; requiereOC: string; numeroOC: string; proveedor: string; montoEstimado: number; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface OC { id: string; numeroOC: string; cursoAsociado: string; proveedor: string; monto: number; fechaSolicitud: string; fechaLimite: string; estadoOC: string; prioridad: string; accionPendiente: string; responsableId: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface Practicante { id: string; nombre: string; area: string; especialidad: string; fechaInicio: string; fechaTermino: string; costoMensual: number; estado: string; responsableId: string; proximoPaso: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface PresupuestoItem { id: string; concepto: string; presupuestoTotal: number; gastado: number; responsableId: string; ultimaActualizacion: string; observaciones: string; }
interface Proceso { id: string; proceso: string; tipo: string; estadoActual: string; queFalta: string; responsableId: string; fechaLimite: string; riesgo: string; prioridad: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface Diploma { id: string; cursoAsociado: string; participante: string; tipoDocumento: string; otec: string; etapa: string; fechaSolicitudOTEC: string; fechaRecepcionDoc: string; fechaEnvioParticipante: string; fechaSubidaBUK: string; estadoBUK: string; prioridad: string; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface CargaSemanal { id: string; semana: string; cursosPlanificados: number; cursosUrgentesNuevos: number; cursosNoPlanificados: number; ocsNuevas: number; diplomasPendientes: number; procesosBloqueados: number; comentario: string; }
interface Contacto { id: string; nombre: string; rol: string; areaEmpresa: string; correo: string; telefono: string; relacion: string; activo: string; observaciones: string; }
interface Evaluacion { id: string; mes: string; ano: number; cargo: string; area: string; candidato: string; rut: string; tipoEvaluacion: string; proveedor: string; fechaSolicitud: string; fechaEvaluacion: string; fechaEntregaInforme: string; estado: string; resultado: string; prioridad: string; responsableId: string; costo: number; requiereOC: string; numeroOC: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }

interface AppData { cursos: Curso[]; ocs: OC[]; practicantes: Practicante[]; presupuesto: PresupuestoItem[]; procesos: Proceso[]; diplomas: Diploma[]; cargaSemanal: CargaSemanal[]; contactos: Contacto[]; evaluacionesPsicolaborales: Evaluacion[]; meta: { version: string; ultimaExportacion: string; actualizado: string }; }

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

const genId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
const hoy = () => new Date().toISOString().slice(0, 10);
const ahora = () => new Date().toISOString();
const toDDMMYYYY = (iso: string) => formatDateCL(iso);
const fmtCLP = (n: number) => n != null ? "$" + n.toLocaleString("es-CL") : "-";

function semaforo(fechaLimite: string): { label: string; color: string; order: number } {
  if (!fechaLimite) return { label: "Sin fecha", color: "#9CA3AF", order: 10 };
  const hoyDate = new Date(hoy());
  const f = new Date(fechaLimite.slice(0, 10));
  const diff = Math.ceil((f.getTime() - hoyDate.getTime()) / 86400000);
  if (diff < 0) return { label: "Vencido", color: "#DC2626", order: 1 };
  if (diff === 0) return { label: "Vence hoy", color: "#EA580C", order: 2 };
  if (diff <= 3) return { label: "1-3 días", color: "#F59E0B", order: 3 };
  if (diff <= 7) return { label: "4-7 días", color: "#FBBF24", order: 4 };
  return { label: "Sin urgencia", color: "#16A34A", order: 5 };
}

function getResponsableName(data: AppData, id: string): string {
  if (!id) return "Sin responsable";
  const c = data.contactos.find(x => x.id === id);
  return c ? c.nombre : "Sin responsable";
}

interface WeekInfo {
  number: number;
  label: string;
  startDateStr: string;
  endDateStr: string;
  rangeLabel: string;
  monthLabel: string;
}

function getWeeksFor2026(): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const firstMonday = new Date(2025, 11, 29); // Monday Dec 29, 2025
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  for (let w = 1; w <= 53; w++) {
    const monday = new Date(firstMonday.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
    const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const fmtISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const wednesday = new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000);
    const monthLabel = monthNames[wednesday.getMonth()];
    weeks.push({
      number: w,
      label: `Semana ${w}`,
      startDateStr: fmtISO(monday),
      endDateStr: fmtISO(sunday),
      rangeLabel: `${fmt(monday)} - ${fmt(sunday)}`,
      monthLabel
    });
  }
  return weeks;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// ──────────────────────────────────────────────
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
      { id: genId(), curso: "Liderazgo y Gestión de Equipos", origen: "DNC", area: "Operaciones", solicitante: "María Silva", fechaSolicitud: d(-30), fechaRequerida: d(-5), estado: "Pendiente revisar", prioridad: "P1 Crítico", nivelCritico: "Crítico", requiereOC: "Sí", numeroOC: "OC-0045", proveedor: "OTEC ProCaps", montoEstimado: 1200000, responsableId: anaId, proximaAccion: "Revisar cotización pendiente", fechaProximaAccion: d(-2), bloqueadoPor: "Falta cotización", ultimaActualizacion: d(-15), observaciones: "Curso DNC planificado Q1" },
      { id: genId(), curso: "Manejo de Extintores", origen: "Requerimiento legal", area: "Prevención", solicitante: "Juan Pérez", fechaSolicitud: d(-7), fechaRequerida: d(5), estado: "En cotización", prioridad: "P1 Crítico", nivelCritico: "Alto", requiereOC: "Sí", numeroOC: "", proveedor: "", montoEstimado: 800000, responsableId: anaId, proximaAccion: "Esperar cotización OTEC", fechaProximaAccion: d(2), bloqueadoPor: "Falta cotización", ultimaActualizacion: d(-3), observaciones: "Requerimiento legal urgente" },
      { id: genId(), curso: "Excel Avanzado", origen: "Urgente no planificado", area: "Administración", solicitante: "Carla Rojas", fechaSolicitud: d(-1), fechaRequerida: d(10), estado: "En aprobación", prioridad: "P2 Alto", nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "OTEC Digital", montoEstimado: 450000, responsableId: anaId, proximaAccion: "Confirmar participantes", fechaProximaAccion: d(7), bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-1), observaciones: "Urgente, jefatura solicitó" },
    ],
    ocs: [
      { id: genId(), numeroOC: "OC-0045", cursoAsociado: "Liderazgo y Gestión de Equipos", proveedor: "OTEC ProCaps", monto: 1200000, fechaSolicitud: d(-25), fechaLimite: d(-5), estadoOC: "En aprobación", prioridad: "P1 Crítico", accionPendiente: "Seguir con compras", responsableId: anaId, bloqueadoPor: "Falta aprobación", ultimaActualizacion: d(-10), observaciones: "Urgente aprobar" },
      { id: genId(), numeroOC: "OC-0052", cursoAsociado: "Norma ISO 9001:2025", proveedor: "OTEC CalidadPlus", monto: 2500000, fechaSolicitud: d(-15), fechaLimite: d(10), estadoOC: "Solicitada", prioridad: "P3 Medio", accionPendiente: "Esperar emisión", responsableId: anaId, bloqueadoPor: "Sin bloqueo", ultimaActualizacion: d(-2), observaciones: "En proceso normal" },
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
    meta: { version: "1.1", ultimaExportacion: "", actualizado: ahora() },
  };
}

// ──────────────────────────────────────────────
// LOCAL STORAGE & MIGRATION
// ──────────────────────────────────────────────

const STORAGE_KEY = "control_operativo_kata_v5";

function migrateData(data: any): AppData {
  const oldData: any = data || crearDatosEjemplo();

  // Initialize final contacts with a copy of old ones, or an empty array
  const finalContactos: Contacto[] = [...(oldData.contactos || [])];

  // Map of normalized name to contact ID
  const nameToIdMap = new Map<string, string>();

  // Populate map with existing contacts
  finalContactos.forEach(c => {
    // If contact is missing active state, ensure it is set to "Sí"
    if (!c.activo) {
      c.activo = "Sí";
    }
    const norm = normalizeName(c.nombre);
    if (norm) {
      nameToIdMap.set(norm, c.id);
    }
  });

  // Helper function to resolve or create a contact from raw name
  const addContactFromName = (name: string): string => {
    if (!name || name === "Sin responsable" || name === "") return "";
    const norm = normalizeName(name);
    
    // Check if it already exists
    if (nameToIdMap.has(norm)) {
      return nameToIdMap.get(norm)!;
    }

    // Otherwise, create a new contact
    const id = genId();
    finalContactos.push({
      id,
      nombre: name,
      rol: "Responsable",
      areaEmpresa: "",
      correo: "",
      telefono: "",
      relacion: "Interno",
      activo: "Sí",
      observaciones: "Migrado de responsable antiguo"
    });
    nameToIdMap.set(norm, id);
    return id;
  };

  // Helper to migrate a single item's responsableId safely
  const migrateResponsableId = (item: any): string => {
    return item.responsableId || (item.responsable ? addContactFromName(item.responsable) : "");
  };

  // Migrate modules safely preserving existing responsableId
  const cursos: Curso[] = (oldData.cursos || []).map((c: any) => ({
    ...c,
    id: c.id || genId(),
    responsableId: migrateResponsableId(c)
  }) as Curso);

  const ocs: OC[] = (oldData.ocs || []).map((o: any) => ({
    ...o,
    id: o.id || genId(),
    responsableId: migrateResponsableId(o)
  }) as OC);

  const practicantes: Practicante[] = (oldData.practicantes || []).map((p: any) => ({
    ...p,
    id: p.id || genId(),
    responsableId: migrateResponsableId(p)
  }) as Practicante);

  const presupuesto: PresupuestoItem[] = (oldData.presupuesto || []).map((p: any) => ({
    ...p,
    id: p.id || genId(),
    responsableId: migrateResponsableId(p)
  }) as PresupuestoItem);

  const procesos: Proceso[] = (oldData.procesos || []).map((p: any) => ({
    ...p,
    id: p.id || genId(),
    responsableId: migrateResponsableId(p)
  }) as Proceso);

  const diplomas: Diploma[] = (oldData.diplomas || []).map((d: any) => ({
    ...d,
    id: d.id || genId(),
    responsableId: migrateResponsableId(d)
  }) as Diploma);

  const evaluacionesPsicolaborales: Evaluacion[] = (oldData.evaluacionesPsicolaborales || []).map((e: any) => ({
    ...e,
    id: e.id || genId(),
    responsableId: migrateResponsableId(e)
  }) as Evaluacion);

  return {
    cursos,
    ocs,
    practicantes,
    presupuesto,
    procesos,
    diplomas,
    cargaSemanal: oldData.cargaSemanal || [],
    contactos: finalContactos,
    evaluacionesPsicolaborales,
    meta: {
      version: "1.1",
      ultimaExportacion: oldData.meta?.ultimaExportacion || "",
      actualizado: ahora()
    },
  };
}

function cargarDatos(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateData(JSON.parse(raw));
  } catch { /* ignore */ }
  return crearDatosEjemplo();
}

function guardarDatos(data: AppData) {
  data.meta.actualizado = ahora();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function limpiarDatos() { localStorage.removeItem(STORAGE_KEY); }

// ──────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────

const prioridadColor: Record<string, string> = { "P1 Crítico": "bg-red-100 text-red-800 border border-red-200", "P2 Alto": "bg-orange-100 text-orange-800 border border-orange-200", "P3 Medio": "bg-amber-50 text-amber-800 border border-amber-200", "P4 Bajo": "bg-green-100 text-green-800 border border-green-200" };
const estadoColor: Record<string, string> = { "Pendiente revisar": "bg-slate-100 text-slate-700 border border-slate-200", "En cotización": "bg-sky-50 text-sky-700 border border-sky-200", "En aprobación": "bg-indigo-50 text-indigo-700 border border-indigo-200", Programado: "bg-blue-50 text-blue-700 border border-blue-200", Ejecutado: "bg-teal-50 text-teal-700 border border-teal-200", Cerrado: "bg-emerald-50 text-emerald-700 border border-emerald-200", Detenido: "bg-stone-100 text-stone-700 border border-stone-200", "Pendiente crear": "bg-slate-100 text-slate-700 border border-slate-200", Solicitada: "bg-sky-50 text-sky-700 border border-sky-200", Emitida: "bg-teal-50 text-teal-700 border border-teal-200", "Enviada proveedor": "bg-indigo-50 text-indigo-700 border border-indigo-200", Cerrada: "bg-emerald-50 text-emerald-700 border border-emerald-200", "Por buscar": "bg-slate-100 text-slate-700 border border-slate-200", "En reclutamiento": "bg-sky-50 text-sky-700 border border-sky-200", Seleccionado: "bg-indigo-50 text-indigo-700 border border-indigo-200", Activo: "bg-teal-50 text-teal-700 border border-teal-200", Finalizado: "bg-emerald-50 text-emerald-700 border border-emerald-200", "Pedir a la OTEC": "bg-amber-50 text-amber-800 border border-amber-200", "Enviar o pedir al participante": "bg-orange-50 text-orange-700 border border-orange-200", "Subir a BUK": "bg-red-100 text-red-800 border border-red-200", Completado: "bg-emerald-50 text-emerald-700 border border-emerald-200", "Pendiente subir": "bg-red-100 text-red-800 border border-red-200", Subido: "bg-emerald-50 text-emerald-700 border border-emerald-200", Rechazado: "bg-red-50 text-red-700 border border-red-200", "No aplica": "bg-slate-100 text-slate-600 border border-slate-200", "Pendiente solicitar": "bg-slate-100 text-slate-700 border border-slate-200", Agendada: "bg-sky-50 text-sky-700 border border-sky-200", Realizada: "bg-indigo-50 text-indigo-700 border border-indigo-200", "Informe recibido": "bg-teal-50 text-teal-700 border border-teal-200", "En revisión": "bg-orange-50 text-orange-700 border border-orange-200", "Recomendado": "bg-emerald-50 text-emerald-700 border border-emerald-200", "Recomendado con observaciones": "bg-amber-50 text-amber-800 border border-amber-200", "No recomendado": "bg-red-50 text-red-700 border border-red-200" };

function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide ${colorClass || "bg-slate-100 text-slate-700 border border-slate-200"}`}>{label}</span>;
}

function SemaforoBadge({ fecha }: { fecha: string }) {
  const s = semaforo(fecha);
  const softBg: Record<string, string> = {
    "#DC2626": "bg-red-100 text-red-800 border-red-200",
    "#EA580C": "bg-orange-100 text-orange-800 border-orange-200",
    "#F59E0B": "bg-amber-50 text-amber-800 border-amber-200",
    "#FBBF24": "bg-yellow-50 text-yellow-800 border-yellow-200",
    "#16A34A": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "#9CA3AF": "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide border ${softBg[s.color] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 max-h-[88vh] overflow-y-auto w-full ${wide ? "max-w-4xl" : "max-w-2xl"}`} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-[#F1F5F9] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, message, onConfirm, onCancel }: { open: boolean; message: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <p className="text-slate-800 mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────

function Login({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === "KataS" && pass === "Tota95") {
      sessionStorage.setItem("kata_auth", "true");
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
            <input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="KataS" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clave</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm">{showPass ? "Ocultar" : "Mostrar"}</button>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">Ingresar</button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">Acceso local básico. Para seguridad real se requiere backend.</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────

type Modulo = "inicio" | "midia" | "dashboard" | "cursos" | "ocs" | "practicantes" | "presupuesto" | "procesos" | "diplomas" | "evaluaciones" | "cargaSemanal" | "contactos" | "configuracion";

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
    { key: "contactos", label: "Contactos", icon: "📇" },
  ]},
  { group: "Documentos", items: [
    { key: "diplomas", label: "Diplomas/Cert/Lic", icon: "📜" },
  ]},
  { group: "Finanzas", items: [
    { key: "presupuesto", label: "Presupuesto", icon: "💰" },
    { key: "cargaSemanal", label: "Carga Semanal", icon: "📅" },
  ]},
  { group: "Sistema", items: [
    { key: "configuracion", label: "Configuración", icon: "⚙️" },
  ]},
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<AppData>(cargarDatos);
  const [activeModulo, setActiveModulo] = useState<Modulo>("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem("kata_focus_mode") === "true");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{ msg: string; cb: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modalModulo, setModalModulo] = useState<string>("");
  const [editItem, setEditItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [lastCapturedModulo, setLastCapturedModulo] = useState<Modulo | null>(null);

  const toggleFocusMode = () => { const v = !focusMode; setFocusMode(v); localStorage.setItem("kata_focus_mode", String(v)); };

  useEffect(() => {
    if (sessionStorage.getItem("kata_auth") === "true") setAuthenticated(true);
  }, []);

  useEffect(() => { guardarDatos(data); }, [data]);

  const toastShow = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── EXPORT / IMPORT ────────────────────────

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `control_operativo_kata_v5_${hoy()}.json`; a.click();
    setData(d => ({ ...d, meta: { ...d.meta, ultimaExportacion: ahora() } }));
    toastShow("JSON exportado correctamente");
  };

  const importJSON = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = migrateData(JSON.parse(ev.target?.result as string));
          setData(imported); toastShow("Datos importados exitosamente");
        } catch { toastShow("Error al leer el archivo JSON"); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const sheets: [string, any[]][] = [
      ["Cursos", data.cursos.map(c => ({ ...c, responsable: getResponsableName(data, c.responsableId) }))],
      ["OCs", data.ocs.map(o => ({ ...o, responsable: getResponsableName(data, o.responsableId) }))],
      ["Practicantes", data.practicantes.map(p => ({ ...p, responsable: getResponsableName(data, p.responsableId) }))],
      ["Presupuesto", data.presupuesto.map(p => ({ ...p, disponible: p.presupuestoTotal - p.gastado, porcentajeUtilizado: Math.round((p.gastado / p.presupuestoTotal) * 100), responsable: getResponsableName(data, p.responsableId) }))],
      ["Procesos", data.procesos.map(p => ({ ...p, responsable: getResponsableName(data, p.responsableId) }))],
      ["Diplomas", data.diplomas.map(d => ({ ...d, responsable: getResponsableName(data, d.responsableId) }))],
      ["Evaluaciones Psicolaborales", data.evaluacionesPsicolaborales.map(e => ({ ...e, responsable: getResponsableName(data, e.responsableId) }))],
      ["Carga Semanal", data.cargaSemanal],
      ["Contactos", data.contactos],
    ];
    sheets.forEach(([name, rows]) => { const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, name); });
    XLSX.writeFile(wb, `control_operativo_kata_v5_${hoy()}.xlsx`);
    setData(d => ({ ...d, meta: { ...d.meta, ultimaExportacion: ahora() } }));
    toastShow("XLSX exportado correctamente");
  };

  const exportLimpia = () => {
    const wb = XLSX.utils.book_new();
    const headers: Record<string, string[]> = {
      Cursos: ["id","curso","origen","area","solicitante","fechaSolicitud","fechaRequerida","estado","prioridad","nivelCritico","requiereOC","numeroOC","proveedor","montoEstimado","responsable","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
      OCs: ["id","numeroOC","cursoAsociado","proveedor","monto","fechaSolicitud","fechaLimite","estadoOC","prioridad","accionPendiente","responsable","bloqueadoPor","ultimaActualizacion","observaciones"],
      Practicantes: ["id","nombre","area","especialidad","fechaInicio","fechaTermino","costoMensual","estado","responsable","proximoPaso","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
      Presupuesto: ["id","concepto","presupuestoTotal","gastado","responsable","ultimaActualizacion","observaciones"],
      Procesos: ["id","proceso","tipo","estadoActual","queFalta","responsable","fechaLimite","riesgo","prioridad","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
      Diplomas: ["id","cursoAsociado","participante","tipoDocumento","otec","etapa","fechaSolicitudOTEC","fechaRecepcionDoc","fechaEnvioParticipante","fechaSubidaBUK","estadoBUK","prioridad","responsable","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
      "Evaluaciones Psicolaborales": ["id","mes","ano","cargo","area","candidato","rut","tipoEvaluacion","proveedor","fechaSolicitud","fechaEvaluacion","fechaEntregaInforme","estado","resultado","prioridad","responsable","costo","requiereOC","numeroOC","proximaAccion","fechaProximaAccion","bloqueadoPor","ultimaActualizacion","observaciones"],
      "Carga Semanal": ["id","semana","cursosPlanificados","cursosUrgentesNuevos","cursosNoPlanificados","ocsNuevas","diplomasPendientes","procesosBloqueados","comentario"],
      Contactos: ["id","nombre","rol","areaEmpresa","correo","telefono","relacion","activo","observaciones"],
    };
    Object.entries(headers).forEach(([name, cols]) => { const ws = XLSX.utils.aoa_to_sheet([cols]); XLSX.utils.book_append_sheet(wb, ws, name); });
    XLSX.writeFile(wb, `plantilla_limpia_kata_v5.xlsx`);
    toastShow("Plantilla limpia descargada");
  };

  const restaurarEjemplos = () => {
    setConfirm({ msg: "¿Restaurar datos de ejemplo? Se perderán los datos actuales.", cb: () => { limpiarDatos(); setData(crearDatosEjemplo()); toastShow("Datos de ejemplo restaurados"); setConfirm(null); } });
  };

  const limpiarTodo = () => {
    setConfirm({ msg: "⚠️ ¿Eliminar TODOS los datos? Esta acción no se puede deshacer.", cb: () => {
      setConfirm({ msg: "🚨 ÚLTIMA CONFIRMACIÓN: Se borrará todo definitivamente. ¿Continuar?", cb: () => { limpiarDatos(); setData({ ...crearDatosEjemplo(), cursos: [], ocs: [], practicantes: [], presupuesto: [], procesos: [], diplomas: [], cargaSemanal: [], contactos: [], evaluacionesPsicolaborales: [] }); toastShow("Todos los datos eliminados"); setConfirm(null); } });
    }});
  };

  const logout = () => { sessionStorage.removeItem("kata_auth"); setAuthenticated(false); toastShow("Sesión cerrada"); };

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
          msg: `Este contacto está asignado como responsable en: ${usedIn.join(", ")}. ¿Reasignar a "Sin responsable" y eliminar?`,
          cb: () => {
            setData(d => {
              const nd = { ...d };
              allModules.forEach(m => {
                (nd as any)[m] = (nd as any)[m].map((x: any) => x.responsableId === id ? { ...x, responsableId: "" } : x);
              });
              nd.contactos = nd.contactos.filter(c => c.id !== id);
              return nd;
            });
            toastShow("Contacto eliminado y registros reasignados."); setConfirm(null);
          }
        });
        return;
      }
    }
    setConfirm({ msg: "¿Eliminar este registro? Esta acción no se puede deshacer.", cb: () => {
      setData(d => { const nd = { ...d }; (nd as any)[modulo] = (nd as any)[modulo].filter((x: any) => x.id !== id); return nd; });
      toastShow("Registro eliminado."); setConfirm(null);
    }});
  };

  const duplicateItem = (modulo: string, item: any) => {
    setData(d => {
      const nd = { ...d };
      const arr = [...(nd as any)[modulo]];
      const newItem = { ...item, id: genId(), ultimaActualizacion: hoy(), curso: item.curso ? `${item.curso} (copia)` : "", nombre: item.nombre ? `${item.nombre} (copia)` : "", proceso: item.proceso ? `${item.proceso} (copia)` : "", cargo: item.cargo ? `${item.cargo} (copia)` : "", semana: item.semana ? `${item.semana} (copia)` : "", contacto: item.contacto ? `${item.contacto} (copia)` : "" };
      arr.push(newItem);
      (nd as any)[modulo] = arr;
      return nd;
    });
    toastShow("Registro duplicado");
  };

  const saveItem = (modulo: string, item: any) => {
    setData(d => {
      const nd = { ...d };
      const arr = [...(nd as any)[modulo]];
      if (editItem) {
        const idx = arr.findIndex((x: any) => x.id === editItem.id);
        if (idx >= 0) arr[idx] = { ...item, ultimaActualizacion: hoy() };
      } else {
        arr.push({ ...item, id: genId(), ultimaActualizacion: hoy() });
      }
      (nd as any)[modulo] = arr;
      return nd;
    });
    closeModal();
    toastShow(editItem ? "Registro actualizado" : "Registro creado");
  };

  // ── CAPTURA RÁPIDA ─────────────────────────
  // Saves a minimal record across any of the 6 main modules with a single form.
  const saveCaptura = (capture: { tipo: string; nombre: string; prioridad: string; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; observaciones: string; }) => {
    const today = hoy();
    const baseId = genId();
    const baseFields = {
      id: baseId,
      prioridad: capture.prioridad,
      responsableId: capture.responsableId,
      proximaAccion: capture.proximaAccion,
      fechaProximaAccion: capture.fechaProximaAccion,
      bloqueadoPor: capture.bloqueadoPor || "Sin bloqueo",
      observaciones: capture.observaciones,
      ultimaActualizacion: today,
    };

    let targetModulo: Modulo = "cursos";
    let newItem: any = {};

    switch (capture.tipo) {
      case "Curso":
        targetModulo = "cursos";
        newItem = {
          ...baseFields, curso: capture.nombre, origen: "Urgente no planificado", area: "", solicitante: "",
          fechaSolicitud: today, fechaRequerida: capture.fechaProximaAccion || "", estado: "Pendiente revisar",
          nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "", montoEstimado: 0,
        };
        break;
      case "OC":
        targetModulo = "ocs";
        newItem = {
          ...baseFields, numeroOC: capture.nombre, cursoAsociado: "", proveedor: "", monto: 0,
          fechaSolicitud: today, fechaLimite: capture.fechaProximaAccion || "", estadoOC: "Pendiente crear",
          accionPendiente: capture.proximaAccion,
        };
        break;
      case "Practicante":
        targetModulo = "practicantes";
        newItem = {
          ...baseFields, nombre: capture.nombre, area: "", especialidad: "",
          fechaInicio: "", fechaTermino: "", costoMensual: 0, estado: "Por buscar",
          proximoPaso: capture.proximaAccion,
        };
        break;
      case "Diploma / Certificado / Licencia":
        targetModulo = "diplomas";
        newItem = {
          ...baseFields, cursoAsociado: capture.nombre, participante: "", tipoDocumento: "Diploma",
          otec: "", etapa: "Pedir a la OTEC", fechaSolicitudOTEC: "", fechaRecepcionDoc: "",
          fechaEnvioParticipante: "", fechaSubidaBUK: "", estadoBUK: "Pendiente subir",
        };
        break;
      case "Evaluación Psicolaboral":
        targetModulo = "evaluaciones";
        newItem = {
          ...baseFields, mes: MESES[new Date().getMonth()], ano: new Date().getFullYear(),
          cargo: capture.nombre, area: "", candidato: "", rut: "", tipoEvaluacion: "Psicolaboral",
          proveedor: "", fechaSolicitud: today, fechaEvaluacion: "", fechaEntregaInforme: "",
          estado: "Pendiente solicitar", resultado: "Pendiente", costo: 0, requiereOC: "No", numeroOC: "",
        };
        break;
      case "Proceso Pendiente":
        targetModulo = "procesos";
        newItem = {
          ...baseFields, proceso: capture.nombre, tipo: "Otro", estadoActual: "Pendiente revisar",
          queFalta: capture.proximaAccion, fechaLimite: capture.fechaProximaAccion || "", riesgo: "",
        };
        break;
      default:
        return;
    }

    const targetKey = targetModulo === "evaluaciones" ? "evaluacionesPsicolaborales" : targetModulo;
    setData(d => {
      const nd = { ...d };
      (nd as any)[targetKey] = [...(nd as any)[targetKey], newItem];
      return nd;
    });
    setLastCapturedModulo(targetModulo);
    setCaptureOpen(false);
    toastShow("Captura guardada correctamente.");
  };

  const markClosed = (modulo: string, id: string, closedState: string) => {
    setData(d => {
      const nd = { ...d };
      const arr = [...(nd as any)[modulo]];
      const idx = arr.findIndex((x: any) => x.id === id);
      if (idx >= 0) {
        if (modulo === "diplomas" && closedState === "Subido") {
          arr[idx] = {
            ...arr[idx],
            etapa: "Completado",
            estadoBUK: "Subido",
            fechaSubidaBUK: hoy(),
            bloqueadoPor: "Sin bloqueo",
            ultimaActualizacion: hoy()
          };
        } else {
          arr[idx] = {
            ...arr[idx],
            estado: closedState,
            ultimaActualizacion: hoy()
          };
        }
      }
      (nd as any)[modulo] = arr;
      return nd;
    });
    toastShow("Estado actualizado");
  };

  // ── DASHBOARD DATA ─────────────────────────

  const dashboardData = useMemo(() => {
    const hoyStr = hoy();
    const hace7 = new Date(hoyStr); hace7.setDate(hace7.getDate() - 7); const hace7Str = hace7.toISOString().slice(0, 10);

    const cursosAbiertos = data.cursos.filter(c => c.estado !== "Cerrado").length;
    const cursosP1 = data.cursos.filter(c => c.prioridad === "P1 Crítico" && c.estado !== "Cerrado").length;
    const ocsPendientes = data.ocs.filter(o => !["Cerrada", "Emitida", "Enviada proveedor"].includes(o.estadoOC)).length;
    const diplomasBUK = data.diplomas.filter(d => d.estadoBUK === "Pendiente subir").length;
    const evaluacionesAbiertas = data.evaluacionesPsicolaborales.filter(e => !["Cerrada", "Detenida"].includes(e.estado)).length;
    const evaluacionesInformePendiente = data.evaluacionesPsicolaborales.filter(e => e.estado === "Realizada" && e.resultado === "Pendiente").length;
    const presupuestoUsado = data.presupuesto.reduce((s, p) => s + p.gastado, 0);
    const presupuestoTotal = data.presupuesto.reduce((s, p) => s + p.presupuestoTotal, 0);
    const procesosBloqueados = data.procesos.filter(p => p.bloqueadoPor !== "Sin bloqueo" && p.estadoActual !== "Cerrado").length;
    const sinActualizar = [...data.cursos, ...data.procesos, ...data.diplomas, ...data.evaluacionesPsicolaborales].filter((x: any) => x.ultimaActualizacion && x.ultimaActualizacion < hace7Str && !["Cerrado", "Cerrada", "Completado", "Finalizado"].includes(x.estado)).length;

    // Bandeja priorizada
    interface ItemBandeja { order: number; tipo: string; nombre: string; prioridad: string; estado: string; bloqueadoPor: string; proximaAccion: string; fechaProximaAccion: string; responsableId: string; modulo: string; }
    const bandeja: ItemBandeja[] = [];

    data.cursos.filter(c => c.estado !== "Cerrado").forEach(c => {
      const s = semaforo(c.fechaProximaAccion || c.fechaRequerida);
      let order = 0;
      if (s.label === "Vencido") order = 1;
      else if (c.prioridad === "P1 Crítico") order = 2;
      else if (c.bloqueadoPor !== "Sin bloqueo") order = 3;
      else if (s.label === "Vence hoy") order = 4;
      else if (s.label === "1-3 días") order = 5;
      else if (c.ultimaActualizacion && c.ultimaActualizacion < hace7Str) order = 8;
      else if (c.prioridad === "P2 Alto") order = 9;
      else if (c.prioridad === "P3 Medio") order = 10;
      else order = 11;
      bandeja.push({ order, tipo: "Curso", nombre: c.curso, prioridad: c.prioridad, estado: c.estado, bloqueadoPor: c.bloqueadoPor, proximaAccion: c.proximaAccion, fechaProximaAccion: c.fechaProximaAccion, responsableId: c.responsableId, modulo: "cursos" });
    });

    data.ocs.filter(o => o.estadoOC !== "Cerrada").forEach(o => {
      const s = semaforo(o.fechaLimite);
      let order = 0;
      if (s.label === "Vencido") order = 1;
      else if (o.prioridad === "P1 Crítico") order = 2;
      else if (o.bloqueadoPor !== "Sin bloqueo") order = 3;
      else if (s.label === "Vence hoy") order = 4;
      else if (s.label === "1-3 días") order = 5;
      else if (o.ultimaActualizacion && o.ultimaActualizacion < hace7Str) order = 8;
      else order = 10;
      bandeja.push({ order, tipo: "OC", nombre: `${o.numeroOC} - ${o.cursoAsociado}`, prioridad: o.prioridad, estado: o.estadoOC, bloqueadoPor: o.bloqueadoPor, proximaAccion: o.accionPendiente, fechaProximaAccion: o.fechaLimite, responsableId: o.responsableId, modulo: "ocs" });
    });

    data.diplomas.forEach(d => {
      const s = semaforo(d.fechaProximaAccion);
      let order = 0;
      if (d.etapa === "Subir a BUK" && d.estadoBUK === "Pendiente subir") order = 6;
      else if (s.label === "Vencido") order = 1;
      else if (d.prioridad === "P1 Crítico") order = 2;
      else if (d.bloqueadoPor !== "Sin bloqueo") order = 3;
      else if (s.label === "Vence hoy") order = 4;
      else if (s.label === "1-3 días") order = 5;
      else order = 10;
      bandeja.push({ order, tipo: "Diploma/Cert/Lic", nombre: `${d.tipoDocumento} - ${d.participante}`, prioridad: d.prioridad, estado: d.etapa, bloqueadoPor: d.bloqueadoPor, proximaAccion: d.proximaAccion, fechaProximaAccion: d.fechaProximaAccion, responsableId: d.responsableId, modulo: "diplomas" });
    });

    data.evaluacionesPsicolaborales.forEach(e => {
      const s = semaforo(e.fechaProximaAccion || e.fechaEntregaInforme);
      let order = 0;
      if (s.label === "Vencido") order = 1;
      else if (e.prioridad === "P1 Crítico") order = 2;
      else if (e.bloqueadoPor !== "Sin bloqueo") order = 3;
      else if (e.estado === "Realizada" && e.resultado === "Pendiente") order = 7;
      else if (s.label === "Vence hoy") order = 4;
      else if (s.label === "1-3 días") order = 5;
      else order = 10;
      bandeja.push({ order, tipo: "Evaluación Psico", nombre: `${e.cargo} - ${e.candidato}`, prioridad: e.prioridad, estado: e.estado, bloqueadoPor: e.bloqueadoPor, proximaAccion: e.proximaAccion, fechaProximaAccion: e.fechaProximaAccion, responsableId: e.responsableId, modulo: "evaluaciones" });
    });

    data.procesos.forEach(p => {
      const s = semaforo(p.fechaProximaAccion || p.fechaLimite);
      let order = 0;
      if (s.label === "Vencido") order = 1;
      else if (p.prioridad === "P1 Crítico") order = 2;
      else if (p.bloqueadoPor !== "Sin bloqueo") order = 3;
      else if (s.label === "Vence hoy") order = 4;
      else order = 10;
      bandeja.push({ order, tipo: "Proceso", nombre: p.proceso, prioridad: p.prioridad, estado: p.estadoActual, bloqueadoPor: p.bloqueadoPor, proximaAccion: p.proximaAccion, fechaProximaAccion: p.fechaProximaAccion, responsableId: p.responsableId, modulo: "procesos" });
    });

    bandeja.sort((a, b) => a.order - b.order);

    const semaforoCounts = { vencido: 0, venceHoy: 0, unoATres: 0, cuatroASiete: 0, sinUrgencia: 0, sinFecha: 0 };
    const allItems = [...data.cursos.filter(c => c.estado !== "Cerrado").map(c => c.fechaProximaAccion || c.fechaRequerida), ...data.ocs.filter(o => o.estadoOC !== "Cerrada").map(o => o.fechaLimite), ...data.diplomas.map(d => d.fechaProximaAccion), ...data.procesos.map(p => p.fechaProximaAccion || p.fechaLimite), ...data.evaluacionesPsicolaborales.map(e => e.fechaProximaAccion || e.fechaEntregaInforme)];
    allItems.forEach(f => {
      const s = semaforo(f);
      if (s.label === "Vencido") semaforoCounts.vencido++;
      else if (s.label === "Vence hoy") semaforoCounts.venceHoy++;
      else if (s.label === "1-3 días") semaforoCounts.unoATres++;
      else if (s.label === "4-7 días") semaforoCounts.cuatroASiete++;
      else if (s.label === "Sin urgencia") semaforoCounts.sinUrgencia++;
      else semaforoCounts.sinFecha++;
    });

    return { cursosAbiertos, cursosP1, ocsPendientes, diplomasBUK, evaluacionesAbiertas, evaluacionesInformePendiente, presupuestoUsado, presupuestoTotal, procesosBloqueados, sinActualizar, bandeja, semaforoCounts };
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

  const copyInstructions = () => { navigator.clipboard.writeText(instructionsContent); toastShow("Instrucciones copiadas"); };
  const downloadInstructions = () => { const blob = new Blob([instructionsContent], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "instrucciones_kata_v5.txt"; a.click(); toastShow("Instrucciones descargadas"); };

  // ── MAIN RENDER ────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#1E293B] text-white transition-all duration-300 flex flex-col shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && <span className="font-semibold text-sm leading-tight tracking-wide">Control<br />Operativo<br />Kata V5</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/50 hover:text-white/80 text-base w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">{sidebarOpen ? "◀" : "▶"}</button>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {navGroups.map((grp, gi) => (
            <div key={gi} className={grp.group ? "mt-2" : ""}>
              {grp.group && sidebarOpen && (
                <div className="px-4 pt-3 pb-1 text-[10px] font-medium tracking-widest text-white/30 uppercase">{grp.group}</div>
              )}
              {grp.items.map(m => (
                <button key={m.key} onClick={() => setActiveModulo(m.key)} className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors rounded-lg mx-2 my-0.5 ${activeModulo === m.key ? "bg-blue-600/80 text-white font-medium" : "text-white/70 hover:bg-white/8 hover:text-white"}`}><span className="text-lg">{m.icon}</span>{sidebarOpen && <span>{m.label}</span>}</button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          {sidebarOpen && (
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              <input type="checkbox" checked={focusMode} onChange={toggleFocusMode} className="sr-only peer" />
              <div className="w-8 h-5 bg-white/20 rounded-full peer-checked:bg-blue-500 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-3" />
              <span className="text-xs text-white/60">Modo enfoque</span>
            </label>
          )}
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-rose-300/80 hover:text-rose-200 hover:bg-white/5 rounded-lg transition-colors">🚪 Cerrar sesión</button>
          {sidebarOpen && <div className="text-[10px] text-white/25 pt-1">v{data.meta.version}</div>}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto ${focusMode ? "p-4 max-w-4xl mx-auto" : "p-6"}`}>
        {activeModulo === "inicio" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl p-6">
              <h1 className="text-2xl font-bold mb-2">Control Operativo Kata V5</h1>
              <p className="text-blue-100 text-sm">Registra todo el mismo día · Revisa cada mañana</p>
            </div>
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-sm font-medium">⚠️ Regla de oro: "Si no está registrado aquí, no existe para seguimiento."</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-2">📋 Rutina semanal sugerida</h3><ul className="text-sm text-slate-600 space-y-2"><li><span className="font-semibold text-blue-700">Lunes:</span> Revisar cursos, OCs y presupuesto.</li><li><span className="font-semibold text-blue-700">Miércoles:</span> Revisar diplomas/certificados/licencias, BUK y evaluaciones psicolaborales.</li><li><span className="font-semibold text-blue-700">Viernes:</span> Cerrar pendientes, actualizar estados y preparar semana siguiente.</li></ul></div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-2">🔑 Lógica del sistema</h3><ul className="text-sm text-slate-600 space-y-1"><li>• Registrar todo el mismo día.</li><li>• Actualizar estado, prioridad y bloqueo.</li><li>• Usar P1/P2/P3/P4.</li><li>• Cerrar procesos finalizados.</li><li>• Exportar respaldo semanal (JSON/XLSX).</li></ul></div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-2">⚡ Accesos rápidos</h3><div className="grid grid-cols-2 gap-2"><button onClick={() => { setActiveModulo("cursos"); openNew("cursos"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition">+ Nuevo curso</button><button onClick={() => { setActiveModulo("ocs"); openNew("ocs"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition">+ Nueva OC</button><button onClick={() => { setActiveModulo("practicantes"); openNew("practicantes"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition">+ Nuevo practicante</button><button onClick={() => { setActiveModulo("diplomas"); openNew("diplomas"); }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition">+ Nuevo diploma</button><button onClick={() => { setActiveModulo("evaluaciones"); openNew("evaluaciones"); }} className="text-xs bg-purple-600 text-white rounded-lg px-3 py-2 hover:bg-purple-700 transition">+ Nueva evaluación</button><button onClick={exportJSON} className="text-xs bg-green-600 text-white rounded-lg px-3 py-2 hover:bg-green-700 transition">📥 Exportar JSON</button><button onClick={exportXLSX} className="text-xs bg-green-600 text-white rounded-lg px-3 py-2 hover:bg-green-700 transition">📥 Exportar XLSX</button></div></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">📈 Resumen rápido</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><KpiCard label="Cursos abiertos" value={dashboardData.cursosAbiertos} color="text-blue-700" /><KpiCard label="P1 Críticos" value={dashboardData.cursosP1} color="text-red-600" /><KpiCard label="OCs pendientes" value={dashboardData.ocsPendientes} color="text-orange-600" /><KpiCard label="Pendientes BUK" value={dashboardData.diplomasBUK} color="text-red-600" /><KpiCard label="Evaluaciones abiertas" value={dashboardData.evaluacionesAbiertas} color="text-purple-600" /><KpiCard label="Informe pendiente" value={dashboardData.evaluacionesInformePendiente} color="text-orange-600" /><KpiCard label="Presupuesto usado" value={fmtCLP(dashboardData.presupuestoUsado)} color="text-purple-600" /><KpiCard label="Procesos bloqueados" value={dashboardData.procesosBloqueados} color="text-red-600" /></div></div>
          </div>
        )}

        {activeModulo === "midia" && <ModuloMiDia data={data} setActiveModulo={setActiveModulo} onCapturaRapida={() => setCaptureOpen(true)} />}
        {activeModulo === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-800">¿Qué hago primero hoy?</h1>
              <button onClick={() => setCaptureOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Captura rápida</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Cursos abiertos" value={dashboardData.cursosAbiertos} color="text-blue-700" />
              <KpiCard label="P1 Críticos" value={dashboardData.cursosP1} color="text-red-600" />
              <KpiCard label="OCs pendientes" value={dashboardData.ocsPendientes} color="text-orange-600" />
              <KpiCard label="Pendientes BUK" value={dashboardData.diplomasBUK} color="text-red-600" />
              <KpiCard label="Evaluaciones abiertas" value={dashboardData.evaluacionesAbiertas} color="text-purple-600" />
              <KpiCard label="Informe pendiente" value={dashboardData.evaluacionesInformePendiente} color="text-orange-600" />
              <KpiCard label="Procesos bloqueados" value={dashboardData.procesosBloqueados} color="text-red-600" />
              <KpiCard label="Sin actualizar +7d" value={dashboardData.sinActualizar} color="text-orange-600" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">🚦 Semáforo general</h3><div className="flex flex-wrap gap-4"><SemaforoItem color="#DC2626" label="Vencido" count={dashboardData.semaforoCounts.vencido} /><SemaforoItem color="#EA580C" label="Vence hoy" count={dashboardData.semaforoCounts.venceHoy} /><SemaforoItem color="#F59E0B" label="1-3 días" count={dashboardData.semaforoCounts.unoATres} /><SemaforoItem color="#FBBF24" label="4-7 días" count={dashboardData.semaforoCounts.cuatroASiete} /><SemaforoItem color="#16A34A" label="Sin urgencia" count={dashboardData.semaforoCounts.sinUrgencia} /><SemaforoItem color="#9CA3AF" label="Sin fecha" count={dashboardData.semaforoCounts.sinFecha} /></div></div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">📋 Bandeja de acción priorizada</h3><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="bg-slate-100 text-slate-600 uppercase text-xs"><th className="px-3 py-2">#</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Nombre / Proceso</th><th className="px-3 py-2">Prioridad</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Bloqueado por</th><th className="px-3 py-2">Próxima acción</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Responsable</th><th className="px-3 py-2">Módulo</th></tr></thead><tbody>{dashboardData.bandeja.slice(0, 20).map((item, i) => (<tr key={i} className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => setActiveModulo(item.modulo as Modulo)}><td className="px-3 py-2 text-slate-400">{i + 1}</td><td className="px-3 py-2"><Badge label={item.tipo} colorClass="bg-slate-200 text-slate-700" /></td><td className="px-3 py-2 font-medium text-slate-800">{item.nombre}</td><td className="px-3 py-2"><Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} /></td><td className="px-3 py-2"><Badge label={item.estado} colorClass={estadoColor[item.estado] || ""} /></td><td className="px-3 py-2">{item.bloqueadoPor !== "Sin bloqueo" ? <Badge label={item.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-"}</td><td className="px-3 py-2 text-slate-600">{item.proximaAccion}</td><td className="px-3 py-2">{item.fechaProximaAccion ? <SemaforoBadge fecha={item.fechaProximaAccion} /> : "-"}</td><td className="px-3 py-2">{getResponsableName(data, item.responsableId)}</td><td className="px-3 py-2"><span className="text-xs text-blue-600 underline">{item.modulo}</span></td></tr>))}</tbody></table></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h4 className="font-bold text-slate-800 mb-2 text-sm">Cursos por prioridad</h4><div className="h-48"><Doughnut data={chartCursosPorPrioridad} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }} /></div></div><div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h4 className="font-bold text-slate-800 mb-2 text-sm">Evaluaciones por estado</h4><div className="h-48"><Doughnut data={chartEvaluacionesPorEstado} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }} /></div></div><div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h4 className="font-bold text-slate-800 mb-2 text-sm">Presupuesto: usado vs disponible</h4><div className="h-48"><Bar data={chartPresupuesto} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }, scales: { x: { stacked: true }, y: { stacked: true } } }} /></div></div></div>
          </div>
        )}

        {activeModulo === "cursos" && <ModuloCursos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "ocs" && <ModuloOCs data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "practicantes" && <ModuloPracticantes data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "presupuesto" && <ModuloPresupuesto data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} getResponsableName={getResponsableName} />}
        {activeModulo === "procesos" && <ModuloProcesos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} getResponsableName={getResponsableName} />}
        {activeModulo === "diplomas" && <ModuloDiplomas data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "evaluaciones" && <ModuloEvaluaciones data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} duplicateItem={duplicateItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "cargaSemanal" && <ModuloCargaSemanal data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} />}
        {activeModulo === "contactos" && <ModuloContactos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} />}
        {activeModulo === "configuracion" && <ModuloConfiguracion data={data} exportJSON={exportJSON} importJSON={importJSON} exportXLSX={exportXLSX} exportLimpia={exportLimpia} restaurarEjemplos={restaurarEjemplos} limpiarTodo={limpiarTodo} showInstructions={() => setShowInstructions(true)} />}

        {/* Modals */}
        <Modal open={modalOpen} onClose={closeModal} title={editItem ? "Editar registro" : "Nuevo registro"} wide={modalModulo === "cursos" || modalModulo === "diplomas" || modalModulo === "evaluaciones"}>
          {modalModulo === "cursos" && <FormCursos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "ocs" && <FormOCs data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "practicantes" && <FormPracticantes data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "presupuesto" && <FormPresupuesto data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "procesos" && <FormProcesos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "diplomas" && <FormDiplomas data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "evaluaciones" && <FormEvaluaciones data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "cargaSemanal" && <FormCargaSemanal data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "contactos" && <FormContactos data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
        </Modal>

        <ConfirmModal open={!!confirm} message={confirm?.msg || ""} onConfirm={() => confirm?.cb()} onCancel={() => setConfirm(null)} />

        <Modal open={showInstructions} onClose={() => setShowInstructions(false)} title="📖 Instrucciones de uso" wide>
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
        <Modal open={captureOpen} onClose={() => setCaptureOpen(false)} title="⚡ Captura rápida">
          <FormCapturaRapida data={data} setData={setData} onCancel={() => setCaptureOpen(false)} onSave={saveCaptura} />
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

        {/* Toast con link "Ir al módulo" cuando hay captura reciente */}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg z-[70] text-sm flex items-center gap-3">
            <span>{toast}</span>
            {lastCapturedModulo && toast === "Captura guardada correctamente." && (
              <button
                onClick={() => { setActiveModulo(lastCapturedModulo); setLastCapturedModulo(null); }}
                className="text-blue-300 hover:text-blue-200 underline text-xs"
              >
                Ir al módulo →
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── HELPER COMPONENTS ────────────────────────

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return <div className="bg-white rounded-2xl border border-[#D9E2EC] p-4 text-center"><div className={`text-2xl font-semibold ${color}`}>{value}</div><div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{label}</div></div>;
}

function SemaforoItem({ color, label, count }: { color: string; label: string; count: number }) {
  return <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-[#D9E2EC]"><div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-sm text-slate-600">{label}: <strong className="text-slate-800">{count}</strong></span></div>;
}

function FilterBar({ filters, searchPlaceholder, search, setSearch }: { filters: React.ReactNode; searchPlaceholder: string; search: string; setSearch: (v: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#D9E2EC] p-4 mb-5">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Filtros</div>
      <div className="flex flex-wrap gap-3 items-center">
        {filters}
        <div className="flex-1 min-w-[200px]">
          <input type="text" placeholder={searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors" />
        </div>
        {search && (<button onClick={() => setSearch("")} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Limpiar filtros</button>)}
      </div>
    </div>
  );
}

// ── "MI DÍA" MODULE ──────────────────────────

function ModuloMiDia({ data, setActiveModulo, onCapturaRapida }: { data: AppData; setActiveModulo: (m: Modulo) => void; onCapturaRapida: () => void }) {
  const closedStates = ["Cerrado", "Cerrada", "Completado", "Finalizado", "Subido"];
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

    const closedSet = new Set(closedStates);
    const isClosed = (estado: string) => closedSet.has(estado);

    data.cursos.forEach(c => {
      if (isClosed(c.estado)) return;
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
      if (isClosed(o.estadoOC)) return;
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
      if (isClosed(p.estado)) return;
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
      if (isClosed(d.etapa)) return;
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
      if (isClosed(e.estado)) return;
      const s = semaforo(e.fechaProximaAccion || e.fechaEntregaInforme);
      items.push({
        tipo: "Eval. Psico", nombre: `${e.cargo} - ${e.candidato}`,
        prioridad: e.prioridad, estado: e.estado, responsable: getResponsableName(data, e.responsableId),
        proximaAccion: e.proximaAccion, fecha: e.fechaProximaAccion || e.fechaEntregaInforme,
        bloqueadoPor: e.bloqueadoPor, modulo: "evaluaciones",
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

function ModuloCursos({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName }: any) {
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

  const columns = [{ key: "curso", label: "Curso" }, { key: "origen", label: "Origen", render: (r: Curso) => <Badge label={r.origen} colorClass="bg-slate-200 text-slate-700" /> }, { key: "prioridad", label: "Prioridad", render: (r: Curso) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "estado", label: "Estado", render: (r: Curso) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> }, { key: "fechaRequerida", label: "Fecha req.", render: (r: Curso) => toDDMMYYYY(r.fechaRequerida) }, { key: "semaforo", label: "Semáforo", render: (r: Curso) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaRequerida} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: Curso) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: Curso) => getResponsableName(data, r.responsableId) }, { key: "montoEstimado", label: "Monto", render: (r: Curso) => fmtCLP(r.montoEstimado) }];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-slate-800">📚 Cursos / DNC Real</h1><p className="text-sm text-slate-500 mt-0.5">Control de cursos y capacitaciones</p></div><button onClick={() => openNew("cursos")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Agregar nuevo</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar curso o proveedor..." filters={<><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_CURSO} placeholder="Estado" /><Select value={filtroOrigen} onChange={setFiltroOrigen} options={ORIGENES_CURSO} placeholder="Origen" /><Select value={filtroSemaforo} onChange={setFiltroSemaforo} options={["Vencido", "Vence hoy", "1-3 días", "4-7 días", "Sin urgencia", "Sin fecha"]} placeholder="Semáforo" /></>} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("cursos", r)} onDelete={(id: string) => deleteItem("cursos", id)} onMarkClosed={(id: string) => markClosed("cursos", id, "Cerrado")} closedState="Cerrado" /></div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} cursos</p>
    </div>
  );
}

function ModuloOCs({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const filtered = data.ocs.filter((o: OC) => {
    if (filtroEstado && o.estadoOC !== filtroEstado) return false;
    if (filtroPrioridad && o.prioridad !== filtroPrioridad) return false;
    if (search && !o.numeroOC.toLowerCase().includes(search.toLowerCase()) && !o.cursoAsociado.toLowerCase().includes(search.toLowerCase()) && !o.proveedor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const columns = [{ key: "numeroOC", label: "N° OC", render: (r: OC) => <span className="font-semibold">{r.numeroOC}</span> }, { key: "cursoAsociado", label: "Curso asociado" }, { key: "proveedor", label: "Proveedor" }, { key: "monto", label: "Monto", render: (r: OC) => fmtCLP(r.monto) }, { key: "estadoOC", label: "Estado", render: (r: OC) => <Badge label={r.estadoOC} colorClass={estadoColor[r.estadoOC] || ""} /> }, { key: "prioridad", label: "Prioridad", render: (r: OC) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "fechaLimite", label: "Fecha límite", render: (r: OC) => toDDMMYYYY(r.fechaLimite) }, { key: "semaforo", label: "Semáforo", render: (r: OC) => <SemaforoBadge fecha={r.fechaLimite} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: OC) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: OC) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">🧾 OCs Pendientes</h1><button onClick={() => openNew("ocs")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nueva OC</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar OC, curso o proveedor..." filters={<><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_OC} placeholder="Estado" /><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></>} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("ocs", r)} onDelete={(id: string) => deleteItem("ocs", id)} onMarkClosed={(id: string) => markClosed("ocs", id, "Cerrada")} closedState="Cerrada" /></div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} OCs</p>
    </div>
  );
}

function ModuloPracticantes({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName }: any) {
  const [filtroEstado, setFiltroEstado] = useState("");
  const filtered = data.practicantes.filter((p: Practicante) => {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.area.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const durMeses = (ini: string, fin: string) => { if (!ini || !fin) return "-"; const d1 = new Date(ini); const d2 = new Date(fin); return Math.round((d2.getTime() - d1.getTime()) / (365.25 * 24 * 3600 * 1000) * 12); };
  const columns = [{ key: "nombre", label: "Nombre" }, { key: "area", label: "Área" }, { key: "especialidad", label: "Especialidad" }, { key: "duracion", label: "Duración (meses)", render: (r: Practicante) => durMeses(r.fechaInicio, r.fechaTermino) }, { key: "costoMensual", label: "Costo/mes", render: (r: Practicante) => fmtCLP(r.costoMensual) }, { key: "costoTotal", label: "Costo total", render: (r: Practicante) => r.fechaInicio && r.fechaTermino ? fmtCLP(r.costoMensual * (durMeses(r.fechaInicio, r.fechaTermino) as number)) : "-" }, { key: "estado", label: "Estado", render: (r: Practicante) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> }, { key: "fechaTermino", label: "Fecha término", render: (r: Practicante) => toDDMMYYYY(r.fechaTermino) }, { key: "semaforo", label: "Semáforo", render: (r: Practicante) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaTermino} /> }, { key: "responsable", label: "Resp.", render: (r: Practicante) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">👤 Practicantes</h1><button onClick={() => openNew("practicantes")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nuevo practicante</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar practicante o área..." filters={<Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_PRACTICANTE} placeholder="Estado" />} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("practicantes", r)} onDelete={(id: string) => deleteItem("practicantes", id)} onMarkClosed={(id: string) => markClosed("practicantes", id, "Finalizado")} closedState="Finalizado" /></div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} practicantes</p>
    </div>
  );
}

function ModuloPresupuesto({ data, search, setSearch, openNew, openEdit, deleteItem }: any) {
  // Helper to compute duration in months
  const getDurMeses = (ini: string, fin: string) => {
    if (!ini || !fin) return 0;
    const d1 = new Date(ini);
    const d2 = new Date(fin);
    const m = Math.round((d2.getTime() - d1.getTime()) / (365.25 * 24 * 3600 * 1000) * 12);
    return m > 0 ? m : 1;
  };

  // Calculate dynamic breakdowns
  const budgetBreakdown = useMemo(() => {
    // 1. Cursos
    const cursoBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("curso")) || { id: "", presupuestoTotal: 15000000, gastado: 7500000, observaciones: "" };
    const cursoComprometido = data.cursos.filter((c: any) => !["Cerrado", "Ejecutado", "Detenido"].includes(c.estado)).reduce((sum: number, c: any) => sum + (c.montoEstimado || 0), 0);
    const cursoEjecutado = data.cursos.filter((c: any) => ["Ejecutado", "Cerrado"].includes(c.estado)).reduce((sum: number, c: any) => sum + (c.montoEstimado || 0), 0);

    // 2. OCs
    const ocBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase() === "ocs" || p.concepto.toLowerCase().startsWith("oc")) || { id: "", presupuestoTotal: 5000000, gastado: 0, observaciones: "" };
    const ocComprometido = data.ocs.filter((o: any) => !["Cerrada", "Emitida"].includes(o.estadoOC)).reduce((sum: number, o: any) => sum + (o.monto || 0), 0);
    const ocEjecutado = data.ocs.filter((o: any) => ["Emitida", "Enviada proveedor", "Cerrada"].includes(o.estadoOC)).reduce((sum: number, o: any) => sum + (o.monto || 0), 0);

    // 3. Practicantes
    const pracBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("practicante")) || { id: "", presupuestoTotal: 8000000, gastado: 6400000, observaciones: "" };
    const pracComprometido = data.practicantes.filter((p: any) => p.estado !== "Finalizado" && p.fechaInicio && p.fechaTermino).reduce((sum: number, p: any) => sum + ((p.costoMensual || 0) * getDurMeses(p.fechaInicio, p.fechaTermino)), 0);
    const pracEjecutado = data.practicantes.filter((p: any) => p.estado === "Finalizado" && p.fechaInicio && p.fechaTermino).reduce((sum: number, p: any) => sum + ((p.costoMensual || 0) * getDurMeses(p.fechaInicio, p.fechaTermino)), 0);

    // 4. Evaluaciones Psicolaborales
    const evalBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("evaluaci")) || { id: "", presupuestoTotal: 3000000, gastado: 500000, observaciones: "" };
    const evalComprometido = data.evaluacionesPsicolaborales.filter((e: any) => !["Cerrada", "Detenida"].includes(e.estado)).reduce((sum: number, e: any) => sum + (e.costo || 0), 0);
    const evalEjecutado = data.evaluacionesPsicolaborales.filter((e: any) => ["Cerrada"].includes(e.estado)).reduce((sum: number, e: any) => sum + (e.costo || 0), 0);

    // 5. Diplomas / Certificados / Licencias
    const dipBudgetRow = data.presupuesto.find((p: any) => p.concepto.toLowerCase().includes("diploma") || p.concepto.toLowerCase().includes("certific")) || { id: "", presupuestoTotal: 2000000, gastado: 300000, observaciones: "" };
    const dipComprometido = 0;
    const dipEjecutado = dipBudgetRow.gastado;

    // 6. Other manual entries
    const standardKeys = ["curso", "oc", "practicante", "evaluaci", "diploma", "certific"];
    const otherBudgetItems = data.presupuesto.filter((p: any) => {
      const k = p.concepto.toLowerCase();
      return !standardKeys.some(sk => k.includes(sk));
    });

    const rows = [
      {
        id: cursoBudgetRow.id,
        area: "Cursos / Capacitaciones",
        tipo: "Calculado desde registros",
        presupuesto: cursoBudgetRow.presupuestoTotal,
        comprometido: cursoComprometido,
        ejecutado: cursoEjecutado,
        saldo: cursoBudgetRow.presupuestoTotal - cursoEjecutado,
        observaciones: cursoBudgetRow.observaciones || "Integrado con módulo Cursos"
      },
      {
        id: ocBudgetRow.id,
        area: "Órdenes de Compra (OC)",
        tipo: "Calculado desde registros",
        presupuesto: ocBudgetRow.presupuestoTotal,
        comprometido: ocComprometido,
        ejecutado: ocEjecutado,
        saldo: ocBudgetRow.presupuestoTotal - ocEjecutado,
        observaciones: ocBudgetRow.observaciones || "Integrado con módulo OCs"
      },
      {
        id: pracBudgetRow.id,
        area: "Practicantes",
        tipo: "Calculado desde registros",
        presupuesto: pracBudgetRow.presupuestoTotal,
        comprometido: pracComprometido,
        ejecutado: pracEjecutado,
        saldo: pracBudgetRow.presupuestoTotal - pracEjecutado,
        observaciones: pracBudgetRow.observaciones || "Integrado con módulo Practicantes"
      },
      {
        id: evalBudgetRow.id,
        area: "Evaluaciones Psicolaborales",
        tipo: "Calculado desde registros",
        presupuesto: evalBudgetRow.presupuestoTotal,
        comprometido: evalComprometido,
        ejecutado: evalEjecutado,
        saldo: evalBudgetRow.presupuestoTotal - evalEjecutado,
        observaciones: evalBudgetRow.observaciones || "Integrado con módulo Evaluaciones"
      },
      {
        id: dipBudgetRow.id,
        area: "Diplomas / Certificados",
        tipo: "Manual",
        presupuesto: dipBudgetRow.presupuestoTotal,
        comprometido: dipComprometido,
        ejecutado: dipEjecutado,
        saldo: dipBudgetRow.presupuestoTotal - dipEjecutado,
        observaciones: dipBudgetRow.observaciones || "Actualizado manualmente"
      }
    ];

    otherBudgetItems.forEach((p: any) => {
      rows.push({
        id: p.id,
        area: p.concepto,
        tipo: "Manual",
        presupuesto: p.presupuestoTotal,
        comprometido: 0,
        ejecutado: p.gastado,
        saldo: p.presupuestoTotal - p.gastado,
        observaciones: p.observaciones || "Registro manual"
      });
    });

    return rows;
  }, [data]);

  // Compute overall global totals across all defined budget categories
  const totalPresupuesto = budgetBreakdown.reduce((s, r) => s + r.presupuesto, 0);
  const totalComprometido = budgetBreakdown.reduce((s, r) => s + r.comprometido, 0);
  const totalEjecutado = budgetBreakdown.reduce((s, r) => s + r.ejecutado, 0);
  const saldoDisponible = totalPresupuesto - totalEjecutado;
  const pctTotal = totalPresupuesto > 0 ? Math.round((totalEjecutado / totalPresupuesto) * 100) : 0;

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
        <button onClick={() => openNew("presupuesto")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-semibold">
          + Nuevo concepto manual
        </button>
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
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="text-sm text-green-700">Saldo Disponible (Asignado - Ejecutado)</div>
            <div className="text-2xl font-bold text-green-600">{fmtCLP(saldoDisponible)}</div>
          </div>
        </div>

        {/* Total comprometido + ejecutado progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Progreso del Gasto Ejecutado vs Presupuesto Asignado:</span>
            <span className="font-semibold">{pctTotal}% utilizado</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all ${pctTotal > 90 ? "bg-red-600" : pctTotal > 75 ? "bg-orange-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(pctTotal, 100)}%` }}
            />
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
                <th className="px-4 py-3">Área / Módulo</th>
                <th className="px-4 py-3">Origen de datos</th>
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
                const usePct = row.presupuesto > 0 ? Math.round((row.ejecutado / row.presupuesto) * 100) : 0;
                return (
                  <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.area}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${row.tipo === "Manual" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"}`}>
                        {row.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCLP(row.presupuesto)}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">{fmtCLP(row.comprometido)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{fmtCLP(row.ejecutado)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{fmtCLP(row.saldo)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${usePct > 90 ? "text-red-600" : usePct > 75 ? "text-orange-500" : "text-green-600"}`}>
                        {usePct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={row.observaciones}>
                      {row.observaciones}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.id && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              const originalItem = data.presupuesto.find((p: any) => p.id === row.id);
                              if (originalItem) openEdit("presupuesto", originalItem);
                            }}
                            className="text-blue-600 hover:underline text-xs font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteItem("presupuesto", row.id)}
                            className="text-red-600 hover:underline text-xs font-semibold"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
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
          {/* Cursos list */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-800 text-sm">Detalle Cursos / Capacitaciones</h4>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Calculado</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {data.cursos.length === 0 ? (
                <p className="text-xs text-slate-400">No hay cursos registrados.</p>
              ) : (
                data.cursos.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-700 truncate max-w-[200px]">{c.curso}</div>
                      <div className="text-slate-400">Estado: {c.estado}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{fmtCLP(c.montoEstimado)}</div>
                      <span className={`px-1 rounded text-[10px] ${["Ejecutado", "Cerrado"].includes(c.estado) ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {["Ejecutado", "Cerrado"].includes(c.estado) ? "Ejecutado" : "Comprometido"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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
                  const m = getDurMeses(p.fechaInicio, p.fechaTermino);
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

function ModuloProcesos({ data, search, setSearch, openNew, openEdit, deleteItem, getResponsableName }: any) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">⏳ Procesos Pendientes</h1><button onClick={() => openNew("procesos")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nuevo proceso</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar proceso..." filters={<><Select value={filtroTipo} onChange={setFiltroTipo} options={TIPOS_PROCESO} placeholder="Tipo" /><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></>} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("procesos", r)} onDelete={(id: string) => deleteItem("procesos", id)} /></div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} procesos</p>
    </div>
  );
}

function ModuloDiplomas({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName }: any) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">📜 Diplomas / Certificados / Licencias</h1><button onClick={() => openNew("diplomas")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nuevo documento</button></div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">⚠️ Documentos pendientes de subir a BUK: <strong>{data.diplomas.filter((d: Diploma) => d.estadoBUK === "Pendiente subir").length}</strong></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar curso, participante u OTEC..." filters={<><Select value={filtroEtapa} onChange={setFiltroEtapa} options={ESTADOS_DIPLOMA} placeholder="Etapa" /><Select value={filtroBUK} onChange={setFiltroBUK} options={ESTADOS_BUK} placeholder="Estado BUK" /><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></>} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("diplomas", r)} onDelete={(id: string) => deleteItem("diplomas", id)} onMarkClosed={(id: string) => markClosed("diplomas", id, "Subido")} closedState="Subido" /></div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} documentos</p>
    </div>
  );
}

function ModuloEvaluaciones({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, markClosed, getResponsableName }: any) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">🧠 Evaluaciones Psicolaborales</h1>
        <button onClick={() => openNew("evaluaciones")} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition">+ Nueva evaluación</button>
      </div>

      <FilterBar
        search={search}
        setSearch={setSearch}
        searchPlaceholder="Buscar cargo, candidato, proveedor o área..."
        filters={
          <>
            <Select value={filtroMes} onChange={setFiltroMes} options={MESES} placeholder="Mes" />
            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"><option value="">Año</option><option value="2026">2026</option><option value="2025">2025</option></select>
            <Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_EVALUACION} placeholder="Estado" />
            <Select value={filtroResultado} onChange={setFiltroResultado} options={RESULTADOS_EVALUACION} placeholder="Resultado" />
            <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
          </>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-slate-100 text-slate-600 uppercase text-xs">{columns.map(c => <th key={c.key} className="px-3 py-2 whitespace-nowrap">{c.label}</th>)}<th className="px-3 py-2">Acciones</th></tr></thead>
            <tbody>{filtered.map((row, i) => (<tr key={row.id || i} className="border-t border-slate-100 hover:bg-purple-50/50 transition-colors">{columns.map(c => (<td key={c.key} className="px-3 py-2 whitespace-nowrap">{c.render ? c.render(row) : (row as any)[c.key]}</td>))}<td className="px-3 py-2 whitespace-nowrap"><div className="flex gap-1"><button onClick={() => openEdit("evaluaciones", row)} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition">Editar</button><button onClick={() => duplicateItem("evaluaciones", row)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Duplicar</button><button onClick={() => deleteItem("evaluaciones", row.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition">Eliminar</button></div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} evaluaciones</p>
    </div>
  );
}

function ModuloCargaSemanal({ data, search, setSearch, openNew, openEdit, deleteItem }: any) {
  const filtered = data.cargaSemanal.filter((c: CargaSemanal) => { if (search && !c.semana.toLowerCase().includes(search.toLowerCase()) && !c.comentario.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const columns = [{ key: "semana", label: "Semana" }, { key: "cursosPlanificados", label: "Planificados" }, { key: "cursosUrgentesNuevos", label: "Urgentes nuevos" }, { key: "cursosNoPlanificados", label: "No planificados" }, { key: "ocsNuevas", label: "OCs nuevas" }, { key: "diplomasPendientes", label: "Diplomas pend." }, { key: "procesosBloqueados", label: "Proc. bloqueados" }, { key: "comentario", label: "Comentario" }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">📅 Carga Semanal</h1><button onClick={() => openNew("cargaSemanal")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nueva semana</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar semana..." filters={null} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("cargaSemanal", r)} onDelete={(id: string) => deleteItem("cargaSemanal", id)} onDuplicate={(r: any) => { /* handled in main */ }} /></div>
      <p className="text-xs text-slate-400">{filtered.length} semanas registradas</p>
    </div>
  );
}

function ModuloContactos({ data, search, setSearch, openNew, openEdit, deleteItem }: any) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">📇 Contactos / Responsables</h1><button onClick={() => openNew("contactos")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nuevo contacto</button></div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">ℹ️ Todos los responsables de los módulos se asignan desde aquí. Crea contactos antes de asignarlos.</div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar contacto..." filters={<><Select value={filtroRelacion} onChange={setFiltroRelacion} options={RELACIONES} placeholder="Relación" /><select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="">Activo</option><option value="Sí">Sí</option><option value="No">No</option></select></>} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("contactos", r)} onDelete={(id: string) => deleteItem("contactos", id)} /></div>
      <p className="text-xs text-slate-400">{filtered.length} contactos</p>
    </div>
  );
}

function ModuloConfiguracion({ data, exportJSON, importJSON, exportXLSX, exportLimpia, restaurarEjemplos, limpiarTodo, showInstructions }: any) {
  const counts: Record<string, number> = { cursos: data.cursos.length, ocs: data.ocs.length, practicantes: data.practicantes.length, presupuesto: data.presupuesto.length, procesos: data.procesos.length, diplomas: data.diplomas.length, evaluacionesPsicolaborales: data.evaluacionesPsicolaborales.length, cargaSemanal: data.cargaSemanal.length, contactos: data.contactos.length };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">⚙️ Configuración y Respaldos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">📊 Contador de registros</h3><div className="space-y-2">{Object.entries(counts).map(([k, v]) => (<div key={k} className="flex justify-between text-sm"><span className="text-slate-600 capitalize">{k.replace(/([A-Z])/g, " $").trim()}</span><span className="font-semibold text-slate-800">{v}</span></div>))}<hr className="my-2" /><div className="flex justify-between text-sm font-bold"><span>Total registros</span><span>{Object.values(counts).reduce((a, b) => a + b, 0)}</span></div></div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">💾 Respaldos</h3><div className="space-y-2"><p className="text-xs text-slate-500">Última exportación: {data.meta.ultimaExportacion ? new Date(data.meta.ultimaExportacion).toLocaleString("es-CL") : "Nunca"}</p><p className="text-xs text-slate-500">Última actualización: {new Date(data.meta.actualizado).toLocaleString("es-CL")}</p><p className="text-xs text-slate-500">Versión: {data.meta.version}</p></div><div className="flex flex-wrap gap-2 mt-4"><button onClick={exportJSON} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">📥 Exportar JSON</button><button onClick={importJSON} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">📤 Importar JSON</button><button onClick={exportXLSX} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">📥 Exportar XLSX</button><button onClick={exportLimpia} className="bg-slate-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition">📋 Plantilla limpia</button></div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">📖 Instrucciones de uso</h3><p className="text-sm text-slate-600 mb-3">Guía completa para usar el sistema correctamente.</p><button onClick={showInstructions} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition">Ver instrucciones de uso</button></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">🔄 Datos de ejemplo</h3><p className="text-sm text-slate-600 mb-3">Restaura los datos de ejemplo para previsualizar el sistema.</p><button onClick={restaurarEjemplos} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition">Restaurar datos de ejemplo</button></div>
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm"><h3 className="font-bold text-red-700 mb-3">⚠️ Zona de peligro</h3><p className="text-sm text-slate-600 mb-3">Elimina todos los datos. Requiere doble confirmación.</p><button onClick={limpiarTodo} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">Limpiar todos los datos</button></div>
      </div>
    </div>
  );
}

// ── FORM COMPONENTS ────────────────────────

function useForm(initial: any, editItem: any) {
  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(editItem || initial); }, [editItem]);
  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  return { form, set };
}

function FormCursos({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ curso: "", origen: "DNC", area: "", solicitante: "", fechaSolicitud: hoy(), fechaRequerida: "", estado: "Pendiente revisar", prioridad: "P3 Medio", nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "", montoEstimado: 0, responsableId: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "curso", "Nombre del curso");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("cursos", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Curso / Capacitación" required error={vErr.curso}><Input value={form.curso} onChange={e => set("curso", e.target.value)} /></Field>
      <Field label="Origen"><Select value={form.origen} onChange={v => set("origen", v)} options={ORIGENES_CURSO} /></Field>
      <Field label="Área"><Input value={form.area} onChange={e => set("area", e.target.value)} /></Field>
      <Field label="Solicitante"><Input value={form.solicitante} onChange={e => set("solicitante", e.target.value)} /></Field>
      <Field label="Fecha solicitud"><DateInput value={form.fechaSolicitud} onChange={v => set("fechaSolicitud", v)} /></Field>
      <Field label="Fecha requerida"><DateInput value={form.fechaRequerida} onChange={v => set("fechaRequerida", v)} /></Field>
      <Field label="Estado"><Select value={form.estado} onChange={v => set("estado", v)} options={ESTADOS_CURSO} /></Field>
      <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
      <Field label="Nivel crítico"><Select value={form.nivelCritico} onChange={v => set("nivelCritico", v)} options={["Bajo", "Medio", "Alto", "Crítico"]} /></Field>
      <Field label="Requiere OC"><Select value={form.requiereOC} onChange={v => set("requiereOC", v)} options={["Sí", "No"]} /></Field>
      <Field label="N° OC asociada"><Input value={form.numeroOC} onChange={e => set("numeroOC", e.target.value)} /></Field>
      <Field label="Proveedor / OTEC"><Input value={form.proveedor} onChange={e => set("proveedor", e.target.value)} /></Field>
      <Field label="Monto estimado (CLP)"><Input type="number" value={form.montoEstimado} onChange={e => set("montoEstimado", Number(e.target.value) || 0)} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Próxima acción" error={vErr.proximaAccion}><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} /></Field>
      <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
      <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
      <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

function FormOCs({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ numeroOC: "", cursoAsociado: "", proveedor: "", monto: 0, fechaSolicitud: hoy(), fechaLimite: "", estadoOC: "Pendiente crear", prioridad: "P3 Medio", accionPendiente: "", responsableId: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "numeroOC", "N° OC o servicio");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("ocs", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="N° OC" required error={vErr.numeroOC}><Input value={form.numeroOC} onChange={e => set("numeroOC", e.target.value)} /></Field>
      <Field label="Curso / Servicio asociado"><Input value={form.cursoAsociado} onChange={e => set("cursoAsociado", e.target.value)} /></Field>
      <Field label="Proveedor"><Input value={form.proveedor} onChange={e => set("proveedor", e.target.value)} /></Field>
      <Field label="Monto (CLP)"><Input type="number" value={form.monto} onChange={e => set("monto", Number(e.target.value) || 0)} /></Field>
      <Field label="Fecha solicitud"><DateInput value={form.fechaSolicitud} onChange={v => set("fechaSolicitud", v)} /></Field>
      <Field label="Fecha límite"><DateInput value={form.fechaLimite} onChange={v => set("fechaLimite", v)} /></Field>
      <Field label="Estado OC"><Select value={form.estadoOC} onChange={v => set("estadoOC", v)} options={ESTADOS_OC} /></Field>
      <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
      <Field label="Acción pendiente"><Input value={form.accionPendiente} onChange={e => set("accionPendiente", e.target.value)} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
      <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

function FormPracticantes({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ nombre: "", area: "", especialidad: "", fechaInicio: "", fechaTermino: "", costoMensual: 0, estado: "Por buscar", responsableId: "", proximoPaso: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "nombre", "Nombre del practicante");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("practicantes", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Nombre" required error={vErr.nombre}><Input value={form.nombre} onChange={e => set("nombre", e.target.value)} /></Field>
      <Field label="Área"><Input value={form.area} onChange={e => set("area", e.target.value)} /></Field>
      <Field label="Especialidad"><Input value={form.especialidad} onChange={e => set("especialidad", e.target.value)} /></Field>
      <Field label="Fecha inicio"><DateInput value={form.fechaInicio} onChange={v => set("fechaInicio", v)} /></Field>
      <Field label="Fecha término"><DateInput value={form.fechaTermino} onChange={v => set("fechaTermino", v)} /></Field>
      <Field label="Costo mensual (CLP)"><Input type="number" value={form.costoMensual} onChange={e => set("costoMensual", Number(e.target.value) || 0)} /></Field>
      <Field label="Estado"><Select value={form.estado} onChange={v => set("estado", v)} options={ESTADOS_PRACTICANTE} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Próximo paso"><Input value={form.proximoPaso} onChange={e => set("proximoPaso", e.target.value)} /></Field>
      <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
      <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
      <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

function FormPresupuesto({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ concepto: "", presupuestoTotal: 0, gastado: 0, responsableId: "", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const errors: VError = {};
    const warnings: string[] = [];
    if (!form.concepto.trim()) errors.concepto = "El concepto o área es obligatorio.";
    const total = Number(form.presupuestoTotal) || 0;
    const gastado = Number(form.gastado) || 0;
    if (total < 0) errors.presupuestoTotal = "El presupuesto no puede ser negativo.";
    if (gastado < 0) errors.gastado = "El monto gastado no puede ser negativo.";
    if (total === 0 && gastado > 0) warnings.push("El presupuesto asignado es $0 pero hay monto ejecutado. ¿Es correcto?");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("presupuesto", { ...form, presupuestoTotal: total, gastado });
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Concepto" required error={vErr.concepto}><Input value={form.concepto} onChange={e => set("concepto", e.target.value)} /></Field>
      <Field label="Presupuesto total (CLP)" error={vErr.presupuestoTotal}><Input type="number" value={form.presupuestoTotal} onChange={e => set("presupuestoTotal", Number(e.target.value) || 0)} /></Field>
      <Field label="Gastado (CLP)" error={vErr.gastado}><Input type="number" value={form.gastado} onChange={e => set("gastado", Number(e.target.value) || 0)} /></Field>
      <Field label="Responsable"><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Observaciones"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

function FormProcesos({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ proceso: "", tipo: "Curso", estadoActual: "Pendiente", queFalta: "", responsableId: "", fechaLimite: "", riesgo: "", prioridad: "P3 Medio", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "proceso", "Nombre del proceso");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("procesos", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Proceso" required error={vErr.proceso}><Input value={form.proceso} onChange={e => set("proceso", e.target.value)} /></Field>
      <Field label="Tipo"><Select value={form.tipo} onChange={v => set("tipo", v)} options={TIPOS_PROCESO} /></Field>
      <Field label="Estado actual"><Input value={form.estadoActual} onChange={e => set("estadoActual", e.target.value)} /></Field>
      <Field label="Qué falta"><Input value={form.queFalta} onChange={e => set("queFalta", e.target.value)} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Fecha límite"><DateInput value={form.fechaLimite} onChange={v => set("fechaLimite", v)} /></Field>
      <Field label="Riesgo si no se hace"><Input value={form.riesgo} onChange={e => set("riesgo", e.target.value)} /></Field>
      <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
      <Field label="Próxima acción" error={vErr.proximaAccion}><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} /></Field>
      <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
      <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
      <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

function FormDiplomas({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ cursoAsociado: "", participante: "", tipoDocumento: "Diploma", otec: "", etapa: "Pedir a la OTEC", fechaSolicitudOTEC: "", fechaRecepcionDoc: "", fechaEnvioParticipante: "", fechaSubidaBUK: "", estadoBUK: "Pendiente subir", prioridad: "P3 Medio", responsableId: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "cursoAsociado", "Curso asociado");
    if (!form.participante?.trim()) errors.participante = "El participante es obligatorio.";
    // Diploma-specific
    if (form.etapa === "Subir a BUK") {
      if (!form.participante?.trim()) errors.participante = "Para subir a BUK se necesita el participante.";
      if (!form.tipoDocumento) errors.tipoDocumento = "Para subir a BUK se necesita el tipo de documento.";
    }
    if (form.estadoBUK === "Subido" && form.etapa !== "Completado") {
      warnings.push("El estado BUK es \"Subido\" — se recomienda cambiar la etapa a \"Completado\".");
    }
    if (form.etapa === "Completado" && !form.fechaSubidaBUK) {
      warnings.push("El documento está completado pero no tiene fecha de subida a BUK.");
    }
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("diplomas", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Curso asociado" required error={vErr.cursoAsociado}><Input value={form.cursoAsociado} onChange={e => set("cursoAsociado", e.target.value)} /></Field>
      <Field label="Participante" required error={vErr.participante}><Input value={form.participante} onChange={e => set("participante", e.target.value)} /></Field>
      <Field label="Tipo documento" error={vErr.tipoDocumento}><Select value={form.tipoDocumento} onChange={v => set("tipoDocumento", v)} options={TIPOS_DOCUMENTO} /></Field>
      <Field label="OTEC / Proveedor"><Input value={form.otec} onChange={e => set("otec", e.target.value)} /></Field>
      <Field label="Etapa"><Select value={form.etapa} onChange={v => set("etapa", v)} options={ESTADOS_DIPLOMA} /></Field>
      <Field label="Fecha solicitud a OTEC"><DateInput value={form.fechaSolicitudOTEC} onChange={v => set("fechaSolicitudOTEC", v)} /></Field>
      <Field label="Fecha recepción documento"><DateInput value={form.fechaRecepcionDoc} onChange={v => set("fechaRecepcionDoc", v)} /></Field>
      <Field label="Fecha envío al participante"><DateInput value={form.fechaEnvioParticipante} onChange={v => set("fechaEnvioParticipante", v)} /></Field>
      <Field label="Fecha subida a BUK"><DateInput value={form.fechaSubidaBUK} onChange={v => set("fechaSubidaBUK", v)} /></Field>
      <Field label="Estado BUK"><Select value={form.estadoBUK} onChange={v => set("estadoBUK", v)} options={ESTADOS_BUK} /></Field>
      <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Próxima acción" error={vErr.proximaAccion}><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} /></Field>
      <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
      <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
      <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

function FormEvaluaciones({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ mes: "Enero", ano: 2026, cargo: "", area: "", candidato: "", rut: "", tipoEvaluacion: "Psicolaboral", proveedor: "", fechaSolicitud: "", fechaEvaluacion: "", fechaEntregaInforme: "", estado: "Pendiente solicitar", resultado: "Pendiente", prioridad: "P3 Medio", responsableId: "", costo: 0, requiereOC: "No", numeroOC: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const { errors, warnings } = validateGeneral(form, "cargo", "Cargo");
    if (!form.candidato?.trim()) errors.candidato = "El nombre del candidato es obligatorio.";
    // Eval-specific
    if (form.estado === "Realizada" && !form.fechaEvaluacion) errors.fechaEvaluacion = "Si la evaluación fue realizada, indica la fecha.";
    if (form.estado === "Informe recibido" && !form.fechaEntregaInforme) errors.fechaEntregaInforme = "Si recibiste el informe, indica la fecha de entrega.";
    if (form.estado === "Cerrada" && form.resultado === "Pendiente") errors.resultado = "No puedes cerrar con resultado Pendiente. Selecciona el resultado.";
    if (form.requiereOC === "Sí" && !form.numeroOC?.trim() && form.bloqueadoPor !== "Falta OC") {
      warnings.push("Requiere OC pero no tiene N° OC ni bloqueo \"Falta OC\". Recuerda gestionarla.");
    }
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("evaluacionesPsicolaborales", { ...form, costo: Number(form.costo) || 0 });
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Mes"><Select value={form.mes} onChange={v => set("mes", v)} options={MESES} /></Field>
      <Field label="Año"><Input type="number" value={form.ano} onChange={e => set("ano", Number(e.target.value))} /></Field>
      <Field label="Cargo" required error={vErr.cargo}><Input value={form.cargo} onChange={e => set("cargo", e.target.value)} /></Field>
      <Field label="Área"><Input value={form.area} onChange={e => set("area", e.target.value)} /></Field>
      <Field label="Candidato" required error={vErr.candidato}><Input value={form.candidato} onChange={e => set("candidato", e.target.value)} /></Field>
      <Field label="RUT"><Input value={form.rut} onChange={e => set("rut", e.target.value)} /></Field>
      <Field label="Tipo evaluación"><Select value={form.tipoEvaluacion} onChange={v => set("tipoEvaluacion", v)} options={TIPOS_EVALUACION} /></Field>
      <Field label="Proveedor / Psicólogo"><Input value={form.proveedor} onChange={e => set("proveedor", e.target.value)} /></Field>
      <Field label="Fecha solicitud"><DateInput value={form.fechaSolicitud} onChange={v => set("fechaSolicitud", v)} /></Field>
      <Field label="Fecha evaluación" error={vErr.fechaEvaluacion}><DateInput value={form.fechaEvaluacion} onChange={v => set("fechaEvaluacion", v)} /></Field>
      <Field label="Fecha entrega informe" error={vErr.fechaEntregaInforme}><DateInput value={form.fechaEntregaInforme} onChange={v => set("fechaEntregaInforme", v)} /></Field>
      <Field label="Estado"><Select value={form.estado} onChange={v => set("estado", v)} options={ESTADOS_EVALUACION} /></Field>
      <Field label="Resultado" error={vErr.resultado}><Select value={form.resultado} onChange={v => set("resultado", v)} options={RESULTADOS_EVALUACION} /></Field>
      <Field label="Prioridad"><Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} /></Field>
      <Field label="Responsable" error={vErr.responsableId}><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Costo (CLP)"><Input type="number" value={form.costo} onChange={e => set("costo", Number(e.target.value) || 0)} /></Field>
      <Field label="Requiere OC"><Select value={form.requiereOC} onChange={v => set("requiereOC", v)} options={["Sí", "No"]} /></Field>
      <Field label="N° OC asociada"><Input value={form.numeroOC} onChange={e => set("numeroOC", e.target.value)} /></Field>
      <Field label="Próxima acción" error={vErr.proximaAccion}><Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} /></Field>
      <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} /></Field>
      <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
      <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

function FormCargaSemanal({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ semana: "", cursosPlanificados: 0, cursosUrgentesNuevos: 0, cursosNoPlanificados: 0, ocsNuevas: 0, diplomasPendientes: 0, procesosBloqueados: 0, comentario: "" }, editItem);
  const save = () => { if (!form.semana.trim()) { alert("El campo Semana es obligatorio"); return; } saveItem("cargaSemanal", form); };
  const weeks2026 = getWeeksFor2026();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Semana (Calendario 2026)">
        <select
          value={form.semana}
          onChange={e => set("semana", e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Seleccionar semana...</option>
          {weeks2026.map(w => (
            <option key={w.number} value={w.label}>
              {w.label} ({w.monthLabel} - {w.rangeLabel})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Cursos planificados"><Input type="number" value={form.cursosPlanificados} onChange={e => set("cursosPlanificados", Number(e.target.value))} /></Field>
      <Field label="Cursos urgentes nuevos"><Input type="number" value={form.cursosUrgentesNuevos} onChange={e => set("cursosUrgentesNuevos", Number(e.target.value))} /></Field>
      <Field label="Cursos no planificados necesarios"><Input type="number" value={form.cursosNoPlanificados} onChange={e => set("cursosNoPlanificados", Number(e.target.value))} /></Field>
      <Field label="OCs nuevas"><Input type="number" value={form.ocsNuevas} onChange={e => set("ocsNuevas", Number(e.target.value))} /></Field>
      <Field label="Diplomas pendientes"><Input type="number" value={form.diplomasPendientes} onChange={e => set("diplomasPendientes", Number(e.target.value))} /></Field>
      <Field label="Procesos bloqueados"><Input type="number" value={form.procesosBloqueados} onChange={e => set("procesosBloqueados", Number(e.target.value))} /></Field>
      <Field label="Comentario"><Textarea value={form.comentario} onChange={e => set("comentario", e.target.value)} /></Field>
      <div className="md:col-span-2 flex gap-3 justify-end pt-4"><button onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">Cancelar</button><button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">Guardar</button></div>
    </div>
  );
}

function FormContactos({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ nombre: "", rol: "", areaEmpresa: "", correo: "", telefono: "", relacion: "Interno", activo: "Sí", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const save = () => {
    const errors: VError = {};
    const warnings: string[] = [];
    if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    // Duplicate check (ignoring self if editing)
    const norm = form.nombre.trim().toLowerCase().replace(/\s+/g, " ");
    const dup = data.contactos.find((c: any) => c.nombre.trim().toLowerCase().replace(/\s+/g, " ") === norm && (!editItem || c.id !== editItem.id));
    if (dup) warnings.push(`Ya existe un contacto llamado "${dup.nombre}". ¿Estás segura de que no es duplicado?`);
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("contactos", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Nombre" required error={vErr.nombre}><Input value={form.nombre} onChange={e => set("nombre", e.target.value)} /></Field>
      <Field label="Rol"><Input value={form.rol} onChange={e => set("rol", e.target.value)} /></Field>
      <Field label="Área / Empresa"><Input value={form.areaEmpresa} onChange={e => set("areaEmpresa", e.target.value)} /></Field>
      <Field label="Correo"><Input type="email" value={form.correo} onChange={e => set("correo", e.target.value)} /></Field>
      <Field label="Teléfono"><Input value={form.telefono} onChange={e => set("telefono", e.target.value)} /></Field>
      <Field label="Relación"><Select value={form.relacion} onChange={v => set("relacion", v)} options={RELACIONES} /></Field>
      <Field label="Activo"><select value={form.activo} onChange={e => set("activo", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="Sí">Sí</option><option value="No">No</option></select></Field>
      <Field label="Observaciones"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
    </div>
  );
}

// ── CAPTURA RÁPIDA FORM ─────────────────────────
const TIPOS_CAPTURA = ["Curso", "OC", "Practicante", "Diploma / Certificado / Licencia", "Evaluación Psicolaboral", "Proceso Pendiente"];

function FormCapturaRapida({ data, onCancel, onSave, setData }: { data: AppData; onCancel: () => void; onSave: (capture: any) => void; setData: React.Dispatch<React.SetStateAction<AppData>>; }) {
  const [form, setForm] = useState({
    tipo: "Curso", nombre: "", prioridad: "P3 Medio", responsableId: "",
    proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // Ensure a "Sin responsable" placeholder contact exists if user leaves empty.
  const ensureSinResponsable = (): string => {
    const existing = data.contactos.find(c => c.nombre.trim().toLowerCase() === "sin responsable");
    if (existing) return existing.id;
    const newId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
    const newContact: Contacto = {
      id: newId, nombre: "Sin responsable", rol: "Auto", areaEmpresa: "",
      correo: "", telefono: "", relacion: "Interno", activo: "Sí",
      observaciones: "Contacto base creado automáticamente para capturas rápidas",
    };
    setData(d => ({ ...d, contactos: [...d.contactos, newContact] }));
    return newId;
  };

  const handleSave = () => {
    setError("");
    if (!form.tipo) return setError("El tipo de registro es obligatorio.");
    if (!form.nombre.trim()) return setError("El nombre o asunto es obligatorio.");
    if (!form.prioridad) return setError("La prioridad es obligatoria.");
    if (!form.proximaAccion.trim()) return setError("La próxima acción es obligatoria.");
    if (form.prioridad === "P1 Crítico" && !form.fechaProximaAccion) return setError("Si la prioridad es P1 Crítico, la fecha próxima acción es obligatoria.");

    let respId = form.responsableId;
    if (!respId) respId = ensureSinResponsable();
    onSave({ ...form, responsableId: respId });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        Registra lo urgente ahora. Después puedes completar el detalle en el módulo correspondiente.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tipo de registro *">
          <Select value={form.tipo} onChange={v => set("tipo", v)} options={TIPOS_CAPTURA} />
        </Field>
        <Field label="Nombre / asunto *">
          <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="¿Qué hay que hacer?" />
        </Field>
        <Field label="Prioridad *">
          <Select value={form.prioridad} onChange={v => set("prioridad", v)} options={PRIORIDADES} />
        </Field>
        <Field label="Responsable *">
          <SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Próxima acción *">
            <Input value={form.proximaAccion} onChange={e => set("proximaAccion", e.target.value)} placeholder="¿Qué tengo que hacer primero?" />
          </Field>
        </div>
        <Field label={form.prioridad === "P1 Crítico" ? "Fecha próxima acción *" : "Fecha próxima acción"}>
          <DateInput value={form.fechaProximaAccion} onChange={v => set("fechaProximaAccion", v)} />
        </Field>
        <Field label="Bloqueado por">
          <Select value={form.bloqueadoPor} onChange={v => set("bloqueadoPor", v)} options={BLOQUEOS} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Observación breve">
            <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Contexto opcional..." />
          </Field>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar captura</button>
      </div>
    </div>
  );
}
