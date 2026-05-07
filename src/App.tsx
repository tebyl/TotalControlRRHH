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
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setDisplayValue(formatDateCL(value));
    setErrorMsg("");
  }, [value]);

  return (
    <div className="w-full">
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        className={`border ${errorMsg ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-slate-300 focus:ring-blue-500 focus:border-transparent"} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white w-full font-sans text-slate-800`}
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
          setErrorMsg("");

          if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
            onChange(parseDateCL(v));
          } else if (v === "") {
            onChange("");
          }
        }}
        onBlur={() => {
          if (displayValue && !/^\d{2}\/\d{2}\/\d{4}$/.test(displayValue)) {
            setErrorMsg("Formato de fecha inválido. Usa dd/mm/aaaa.");
          } else {
            setErrorMsg("");
          }
        }}
      />
      {errorMsg && <p className="text-[11px] text-red-500 mt-1">{errorMsg}</p>}
    </div>
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
const CATEGORIAS_OC = ["Curso / Capacitación", "Evento", "Actividad de bienestar", "Kit de bienvenida", "Artículos / Insumos", "Evaluación psicolaboral", "Servicio profesional", "Uniformes / EPP", "Tecnología / Software", "Otro"];
const ESTADOS_PRACTICANTE = ["Por buscar", "En reclutamiento", "Seleccionado", "Activo", "Finalizado", "Detenido"];
const ESTADOS_DIPLOMA = ["Pedir a la OTEC", "Enviar o pedir al participante", "Subir a BUK", "Completado", "Detenido"];
const ESTADOS_BUK = ["Pendiente subir", "Subido", "Rechazado", "No aplica"];
const ESTADOS_EVALUACION = ["Pendiente solicitar", "Solicitada", "Agendada", "Realizada", "Informe recibido", "En revisión", "Cerrada", "Detenida"];
const RESULTADOS_EVALUACION = ["Recomendado", "Recomendado con observaciones", "No recomendado", "Pendiente", "No aplica"];
const TIPOS_EVALUACION = ["Psicolaboral", "Referencias laborales", "Evaluación técnica", "Evaluación mixta","Hogan", "Otro"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ORIGENES_CURSO = ["DNC", "Carta Gantt", "Urgente no planificado", "Academia Molineria","No planificado necesario", "Emergente por operación", "Requerimiento legal", "Solicitud jefatura", "Reprogramado", "Otro"];
const BLOQUEOS = ["Sin bloqueo", "Falta aprobación", "Falta OC", "Falta cotización", "Falta OTEC", "Falta participante", "Falta jefatura", "Falta presupuesto", "Falta subir a BUK", "Falta candidato", "Falta proveedor", "Falta informe", "Otro"];
const RELACIONES = ["Interno", "OTEC", "Participante", "Jefatura", "Compras", "Finanzas", "RRHH", "BUK", "Psicólogo / Proveedor evaluación", "Otro"];
const TIPOS_PROCESO = ["Curso", "OC", "Presupuesto", "Practicante", "Reclutamiento", "Diploma / certificado / licencia", "BUK", "Otro"];
const TIPOS_DOCUMENTO = ["Diploma", "Certificado", "Licencia", "Otro"];
const ESTADOS_VALE_GAS = ["Pendiente entregar", "Entregado", "En descuento", "Cerrado", "Detenido"];
const TIPOS_MOVIMIENTO_VALES = ["Ingreso de vales", "Ajuste positivo", "Ajuste negativo", "Corrección inventario", "Otro"];
const TIPOS_RECLUTAMIENTO = ["Interno", "Externo", "Promoción interna", "Reemplazo interno", "Otro", "Por definir"];
const PLANTAS_CENTROS = ["Planta Bio Bio", "Planta Freire", "Planta Perquenco", "Perquenco Carretera", "Planta Lautaro", "Lautaro Copeval", "Planta Rio Bueno", "Planta Victoria", "Casa Matriz", "Otro"];
const TIPOS_VACANTE = ["Cosecha", "Reemplazo", "Fijo", "Temporal", "Práctica", "Proyecto", "Otro", "Por definir"];
const ESTADOS_PROCESO_RECLUTAMIENTO = ["Abierto", "Cerrado", "Pausado", "Desistido"];
const OPTS_SI_NO = ["Sí", "No", "Pendiente", "N/A"];
const OPTS_ENTREVISTA = ["Pendiente", "Agendada", "Realizada", "N/A"];
const OPTS_TEST = ["Pendiente", "Solicitado", "Realizado", "N/A"];
const OPTS_SELECCION_CV = ["Pendiente", "En proceso", "Finalizado", "N/A"];
const OPTS_CARTA_OFERTA = ["Pendiente", "Solicitada", "Emitida", "N/A"];
const OPTS_ENVIO_CARTA = ["Pendiente", "Realizado", "N/A"];
const OPTS_PROCESO_BUK = ["Sí", "No", "Confidencial", "Pendiente", "N/A"];
const OPTS_REVISADO_PPTO = ["Pendiente", "Aceptado", "Rechazado", "N/A"];
const ETAPAS_RECLUTAMIENTO = [
  { key: "revisadoPPTO", label: "Revisado PPTO" },
  { key: "procesoBuk", label: "Proceso en BUK" },
  { key: "publicado", label: "Publicado" },
  { key: "seleccionCV", label: "Selección de CV" },
  { key: "cvSeleccionadoBuk", label: "CV Seleccionado en BUK" },
  { key: "entrevistaJefatura", label: "Entrevista Jefatura" },
  { key: "entrevistaGP", label: "Entrevista GP" },
  { key: "testPsicolaboral", label: "Test Psicolaboral" },
  { key: "testHogan", label: "Test Hogan" },
  { key: "seleccionado", label: "Seleccionado" },
  { key: "cartaOferta", label: "Carta Oferta" },
  { key: "envioCartaOferta", label: "Envío carta oferta" },
  { key: "firmaCartaOferta", label: "Firma Carta Oferta" },
];

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

function isTableRowClosed(row: any, closedState?: string): boolean {
  if (!closedState) return false;
  if (row.estado === closedState || row.estadoOC === closedState || row.estadoBUK === closedState || row.proceso === closedState) return true;
  if (row.etapa === "Completado" || row.estadoBUK === "Subido") return true;
  return ["Cerrado", "Cerrada", "Completado", "Finalizado"].includes(row.estado);
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
        <tbody>{rows.map((row: any, i: number) => (<tr key={row.id || i} className="border-t border-[#F1F5F9] hover:bg-blue-50/40 transition-colors">{columns.map(c => (<td key={c.key} className="px-4 py-3 whitespace-nowrap">{c.render ? c.render(row) : (row as any)[c.key]}</td>))}<td className="px-4 py-3 whitespace-nowrap"><div className="flex gap-1.5"><button onClick={() => onEdit(row)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">Editar</button>{onMarkClosed && closedState && !isTableRowClosed(row, closedState) && <button onClick={() => onMarkClosed(row.id)} className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">Cerrar</button>}{onDuplicate && <button onClick={() => onDuplicate(row)} className="px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-lg border border-violet-100 hover:bg-violet-100 transition-colors">Duplicar</button>}<button onClick={() => onDelete(row.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Eliminar</button></div></td></tr>))}</tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface Curso { id: string; curso: string; origen: string; area: string; solicitante: string; fechaSolicitud: string; fechaRequerida: string; estado: string; prioridad: string; nivelCritico: string; requiereOC: string; numeroOC: string; proveedor: string; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface OC { id: string; numeroOC: string; categoriaOC: string; cursoAsociado: string; proveedor: string; monto: number; fechaSolicitud: string; fechaLimite: string; estadoOC: string; prioridad: string; accionPendiente: string; responsableId: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface Practicante { id: string; nombre: string; area: string; especialidad: string; fechaInicio: string; fechaTermino: string; costoMensual: number; estado: string; responsableId: string; proximoPaso: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface PresupuestoItem { id: string; concepto: string; presupuestoTotal: number; gastado: number; responsableId: string; ultimaActualizacion: string; observaciones: string; montoComprometidoManual?: number; montoEjecutadoManual?: number; modoCalculo?: string; }
interface Proceso { id: string; proceso: string; tipo: string; estadoActual: string; queFalta: string; responsableId: string; fechaLimite: string; riesgo: string; prioridad: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface Diploma { id: string; cursoAsociado: string; participante: string; tipoDocumento: string; otec: string; etapa: string; fechaSolicitudOTEC: string; fechaRecepcionDoc: string; fechaEnvioParticipante: string; fechaSubidaBUK: string; estadoBUK: string; prioridad: string; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
interface CargaSemanal { id: string; semana: string; cursosPlanificados: number; cursosUrgentesNuevos: number; cursosNoPlanificados: number; ocsNuevas: number; diplomasPendientes: number; procesosBloqueados: number; comentario: string; }
interface Contacto { id: string; nombre: string; rol: string; areaEmpresa: string; correo: string; telefono: string; relacion: string; activo: string; observaciones: string; }
interface Evaluacion { id: string; mes: string; ano: number; cargo: string; area: string; candidato: string; rut: string; tipoEvaluacion: string; proveedor: string; fechaSolicitud: string; fechaEvaluacion: string; fechaEntregaInforme: string; estado: string; resultado: string; prioridad: string; responsableId: string; costo: number; requiereOC: string; numeroOC: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }

interface ValeGas { id: string; colaborador: string; contactoId: string; area: string; periodo: string; fechaEntrega: string; totalValesAsignados: number; valesUsados: number; descuentoDiario: number; diasDescuento: number; totalDescontado: number; saldoVales: number; estado: string; responsableId: string; fechaProximaRevision: string; observaciones: string; ultimaActualizacion: string; }

interface ValeGasOrg { id: string; fechaRegistro: string; periodo: string; tipoMovimiento: string; cantidadVales: number; motivo: string; responsableId: string; observaciones: string; ultimaActualizacion: string; }

interface ProcesoReclutamiento {
  id: string;
  reclutamiento: string;
  plantaCentro: string;
  tipoVacante: string;
  mesIngreso: string;
  revisadoPPTO: string;
  procesoBuk: string;
  publicado: string;
  seleccionCV: string;
  cvSeleccionadoBuk: string;
  entrevistaJefatura: string;
  entrevistaGP: string;
  testPsicolaboral: string;
  testHogan: string;
  seleccionado: string;
  cartaOferta: string;
  envioCartaOferta: string;
  firmaCartaOferta: string;
  fechaIngreso: string;
  reclutador: string;
  proceso: string;
  reclutadorId: string;
  prioridad: string;
  bloqueadoPor: string;
  proximaAccion: string;
  fechaProximaAccion: string;
  observaciones: string;
  ultimaActualizacion: string;
}

interface AppData { cursos: Curso[]; ocs: OC[]; practicantes: Practicante[]; presupuesto: PresupuestoItem[]; procesos: Proceso[]; diplomas: Diploma[]; cargaSemanal: CargaSemanal[]; contactos: Contacto[]; evaluacionesPsicolaborales: Evaluacion[]; valesGas: ValeGas[]; valesGasOrganizacion: ValeGasOrg[]; reclutamiento: ProcesoReclutamiento[]; meta: { version: string; ultimaExportacion: string; actualizado: string }; }

// ──────────────────────────────────────────────
// BACKUPS
// ──────────────────────────────────────────────

interface BackupItem {
  id: string;
  fecha: string;
  motivo: string;
  data: AppData;
  tamaño: string;
}

function getLocalBackups(): BackupItem[] {
  try {
    const raw = localStorage.getItem("controlOperativo_backups");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBackups(backups: BackupItem[]): boolean {
  try {
    localStorage.setItem("controlOperativo_backups", JSON.stringify(backups));
    return true;
  } catch (e: any) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      return false;
    }
    return false;
  }
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function ensureBudgetRows(presupuesto: PresupuestoItem[]): PresupuestoItem[] {
  const baseConcepts = [
    { key: "curso", concepto: "Cursos / Capacitaciones", modo: "Calculado desde registros" },
    { key: "oc", concepto: "Órdenes de Compra (OC)", modo: "Calculado desde registros" },
    { key: "practicante", concepto: "Practicantes", modo: "Calculado desde registros" },
    { key: "evaluaci", concepto: "Evaluaciones Psicolaborales", modo: "Calculado desde registros" },
    { key: "diploma", concepto: "Diplomas / Certificados", modo: "Manual" }
  ];

  const updated = [...(presupuesto || [])];
  baseConcepts.forEach(bc => {
    const exists = updated.some(p => p.concepto.toLowerCase().includes(bc.key));
    if (!exists) {
      updated.push({
        id: "pres_" + bc.key + "_" + genId(),
        concepto: bc.concepto,
        presupuestoTotal: 0,
        gastado: 0,
        responsableId: "",
        ultimaActualizacion: hoy(),
        observaciones: "Concepto inicial base en $0",
        montoComprometidoManual: 0,
        montoEjecutadoManual: 0,
        modoCalculo: bc.modo
      });
    }
  });
  return updated;
}

function createBackup(data: AppData, motivo: string): boolean {
  const backups = getLocalBackups();
  const stringified = JSON.stringify(data);
  const size = formatBytes(new Blob([stringified]).size);

  const newBackup: BackupItem = {
    id: genId(),
    fecha: new Date().toISOString(),
    motivo,
    data,
    tamaño: size,
  };

  const updated = [newBackup, ...backups];
  if (updated.length > 10) {
    updated.splice(10);
  }

  return saveLocalBackups(updated);
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

const genId = (prefix = "id") => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    if (typeof crypto.getRandomValues === "function") {
      const arr = new Uint32Array(3);
      crypto.getRandomValues(arr);
      return `${prefix}_${arr[0].toString(36)}-${arr[1].toString(36)}-${arr[2].toString(36)}`;
    }
  }
  return `${prefix}_${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};
const hoy = () => new Date().toISOString().slice(0, 10);
const ahora = () => new Date().toISOString();
const toDDMMYYYY = (iso: string) => formatDateCL(iso);
const fmtCLP = (n: number) => n != null ? "$" + n.toLocaleString("es-CL") : "-";
const durMesesEntre = (ini: string, fin: string): number => {
  if (!ini || !fin) return 0;
  const d1 = new Date(ini);
  const d2 = new Date(fin);
  const m = Math.round((d2.getTime() - d1.getTime()) / (365.25 * 24 * 3600 * 1000) * 12);
  return m > 0 ? m : 1;
};

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

const ETAPAS_COMPLETADAS_VALUES = ["Sí", "Realizado", "Realizada", "Finalizado", "Emitida", "Aceptado", "Solicitada"];
const ETAPAS_NO_APLICA_VALUES = ["N/A"];

function calcReclutamientoAvance(r: ProcesoReclutamiento): { pct: number; etapaActual: string } {
  if (r.proceso === "Cerrado") return { pct: 100, etapaActual: "Cerrado" };
  if (r.proceso === "Desistido") return { pct: 0, etapaActual: "Desistido" };
  if (r.proceso === "Pausado") return { pct: calcPctRecl(r), etapaActual: "Pausado — revisar bloqueo" };
  let completadas = 0;
  let aplicables = 0;
  let etapaActual = "Listo para ingreso";
  let encontradaPendiente = false;
  for (const etapa of ETAPAS_RECLUTAMIENTO) {
    const val = (r as any)[etapa.key] || "";
    if (ETAPAS_NO_APLICA_VALUES.includes(val)) continue;
    aplicables++;
    if (ETAPAS_COMPLETADAS_VALUES.includes(val)) {
      completadas++;
    } else if (!encontradaPendiente) {
      etapaActual = etapa.label;
      encontradaPendiente = true;
    }
  }
  const pct = aplicables === 0 ? 0 : Math.round((completadas / aplicables) * 100);
  return { pct, etapaActual: encontradaPendiente ? etapaActual : "Listo para ingreso" };
}

function calcPctRecl(r: ProcesoReclutamiento): number {
  let completadas = 0, aplicables = 0;
  for (const etapa of ETAPAS_RECLUTAMIENTO) {
    const val = (r as any)[etapa.key] || "";
    if (ETAPAS_NO_APLICA_VALUES.includes(val)) continue;
    aplicables++;
    if (ETAPAS_COMPLETADAS_VALUES.includes(val)) completadas++;
  }
  return aplicables === 0 ? 0 : Math.round((completadas / aplicables) * 100);
}

export function normalizarReclutamientoXLSX(val: string, campo: string): string {
  if (!val) return "";
  const v = val.trim();
  if (v.toUpperCase() === "SI") return "Sí";
  if (v.toUpperCase() === "NO") return "No";
  if (campo === "reclutamiento" && v.toLowerCase().includes("prompci")) return "Promoción interna";
  if (campo === "proceso") return v.replace(/\s+$/, "");
  return v;
}

// ── XLSX IMPORT HELPERS ──────────────────────────────────────────────

function normalizeDateFromXlsx(value: any): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return "";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (!s) return "";
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2,"0")}-${ymd[3].padStart(2,"0")}`;
  return "";
}

function parseXlsxNumber(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/[$\.,\s]/g, "").replace(",", "."));
  if (isNaN(n) || !isFinite(n)) return 0;
  return n;
}

function parseXlsxMoney(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (isNaN(n) || !isFinite(n)) return 0;
  return Math.max(0, n);
}

function normalizeYesNo(value: any): string {
  if (!value) return "";
  const v = String(value).trim().toUpperCase();
  if (v === "SI" || v === "SÍ" || v === "YES" || v === "S") return "Sí";
  if (v === "NO" || v === "N") return "No";
  return String(value).trim();
}

function normalizeReclutamientoCampo(value: any, campo: string): string {
  if (!value) return "";
  const v = String(value).trim();
  if (campo === "reclutamiento" && v.toLowerCase().includes("prompci")) return "Promoción interna";
  if (campo === "proceso") return v.replace(/\s+$/, "");
  if (["procesoBuk", "publicado", "cvSeleccionadoBuk", "seleccionado", "firmaCartaOferta"].includes(campo)) return normalizeYesNo(v);
  return v;
}

function resolveResponsable(nombre: string, contactos: any[], prefijo: string = "Interno"): { id: string; contactosActualizados: any[] } {
  if (!nombre || nombre.trim() === "" || nombre === "Sin responsable") return { id: "", contactosActualizados: contactos };
  const normalized = nombre.trim().toLowerCase();
  const existing = contactos.find((c: any) => c.nombre?.toLowerCase() === normalized);
  if (existing) return { id: existing.id, contactosActualizados: contactos };
  const newContact = {
    id: `contacto_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    nombre: nombre.trim(),
    rol: prefijo === "RRHH" ? "Reclutador" : "Responsable",
    areaEmpresa: "",
    correo: "",
    telefono: "",
    relacion: prefijo === "RRHH" ? "RRHH" : "Interno",
    activo: "Sí",
    observaciones: "Creado automáticamente al importar XLSX"
  };
  return { id: newContact.id, contactosActualizados: [...contactos, newContact] };
}

function xlsxSheetToObjects(ws: any): any[] {
  if (!ws) return [];
  try {
    return XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  } catch { return []; }
}

interface XlsxParseResult {
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

function isClosedRecord(row: any, moduleKey: string): boolean {
  if (!row) return false;
  switch (moduleKey) {
    case "cursos":
      return ["Cerrado", "Ejecutado"].includes(row.estado);
    case "ocs":
      return row.estadoOC === "Cerrada" || row.estadoOC === "Emitida" || row.estadoOC === "Enviada proveedor";
    case "practicantes":
      return row.estado === "Finalizado";
    case "procesos":
      return ["Cerrado", "Finalizado", "Completado"].includes(row.estadoActual);
    case "diplomas":
      return row.etapa === "Completado" || row.estadoBUK === "Subido";
    case "evaluaciones":
    case "evaluacionesPsicolaborales":
      return row.estado === "Cerrada";
    default:
      return false;
  }
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

function getWeeksForYear(year: number): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  // ISO week 1 starts on the Monday of the week containing Jan 4
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 1=Mon … 7=Sun
  const firstMonday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  for (let w = 1; w <= 53; w++) {
    const monday = new Date(firstMonday.getTime() + (w - 1) * 7 * 86400000);
    const sunday = new Date(monday.getTime() + 6 * 86400000);
    // Stop if the week belongs entirely to the next year
    if (monday.getFullYear() > year && w > 52) break;
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const fmtISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const wednesday = new Date(monday.getTime() + 2 * 86400000);
    weeks.push({
      number: w,
      label: `Semana ${w}`,
      startDateStr: fmtISO(monday),
      endDateStr: fmtISO(sunday),
      rangeLabel: `${fmt(monday)} - ${fmt(sunday)}`,
      monthLabel: monthNames[wednesday.getMonth()]
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
    categoriaOC: o.categoriaOC || "",
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

  const valesGas: ValeGas[] = (oldData.valesGas || []).map((v: any) => ({ ...v, id: v.id || genId() }));
  const valesGasOrganizacion: ValeGasOrg[] = (oldData.valesGasOrganizacion || []).map((v: any) => ({ ...v, id: v.id || genId() }));
  const reclutamiento: ProcesoReclutamiento[] = (oldData.reclutamiento || []).map((r: any) => ({ ...r, id: r.id || genId(), bloqueadoPor: r.bloqueadoPor || "Sin bloqueo" }));

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
    valesGas,
    valesGasOrganizacion,
    reclutamiento,
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
    if (raw) {
      const parsed = migrateData(JSON.parse(raw));
      parsed.presupuesto = ensureBudgetRows(parsed.presupuesto);
      return parsed;
    }
  } catch { /* ignore */ }
  const de = crearDatosEjemplo();
  de.presupuesto = ensureBudgetRows(de.presupuesto);
  return de;
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
const estadoColor: Record<string, string> = { "Pendiente revisar": "bg-slate-100 text-slate-700 border border-slate-200", "En cotización": "bg-sky-50 text-sky-700 border border-sky-200", "En aprobación": "bg-indigo-50 text-indigo-700 border border-indigo-200", Programado: "bg-blue-50 text-blue-700 border border-blue-200", Ejecutado: "bg-teal-50 text-teal-700 border border-teal-200", Cerrado: "bg-emerald-50 text-emerald-700 border border-emerald-200", Detenido: "bg-stone-100 text-stone-700 border border-stone-200", "Pendiente crear": "bg-slate-100 text-slate-700 border border-slate-200", Solicitada: "bg-sky-50 text-sky-700 border border-sky-200", Emitida: "bg-teal-50 text-teal-700 border border-teal-200", "Enviada proveedor": "bg-indigo-50 text-indigo-700 border border-indigo-200", Cerrada: "bg-emerald-50 text-emerald-700 border border-emerald-200", "Por buscar": "bg-slate-100 text-slate-700 border border-slate-200", "En reclutamiento": "bg-sky-50 text-sky-700 border border-sky-200", Seleccionado: "bg-indigo-50 text-indigo-700 border border-indigo-200", Activo: "bg-teal-50 text-teal-700 border border-teal-200", Finalizado: "bg-emerald-50 text-emerald-700 border border-emerald-200", "Pedir a la OTEC": "bg-amber-50 text-amber-800 border border-amber-200", "Enviar o pedir al participante": "bg-orange-50 text-orange-700 border border-orange-200", "Subir a BUK": "bg-red-100 text-red-800 border border-red-200", Completado: "bg-emerald-50 text-emerald-700 border border-emerald-200", "Pendiente subir": "bg-red-100 text-red-800 border border-red-200", Subido: "bg-emerald-50 text-emerald-700 border border-emerald-200", Rechazado: "bg-red-50 text-red-700 border border-red-200", "No aplica": "bg-slate-100 text-slate-600 border border-slate-200", "Pendiente solicitar": "bg-slate-100 text-slate-700 border border-slate-200", Agendada: "bg-sky-50 text-sky-700 border border-sky-200", Realizada: "bg-indigo-50 text-indigo-700 border border-indigo-200", "Informe recibido": "bg-teal-50 text-teal-700 border border-teal-200", "En revisión": "bg-orange-50 text-orange-700 border border-orange-200", "Recomendado": "bg-emerald-50 text-emerald-700 border border-emerald-200", "Recomendado con observaciones": "bg-amber-50 text-amber-800 border border-amber-200", "No recomendado": "bg-red-50 text-red-700 border border-red-200", "Pendiente entregar": "bg-slate-100 text-slate-700 border border-slate-200", "Entregado": "bg-blue-50 text-blue-700 border border-blue-200", "En descuento": "bg-orange-100 text-orange-800 border border-orange-200" };

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

type Modulo = "inicio" | "midia" | "dashboard" | "cursos" | "ocs" | "practicantes" | "presupuesto" | "procesos" | "diplomas" | "evaluaciones" | "cargaSemanal" | "contactos" | "valesGas" | "reclutamiento" | "configuracion";

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

  const [backups, setBackups] = useState<BackupItem[]>(() => getLocalBackups());
  const [lastJSONExport, setLastJSONExport] = useState<string>(() => localStorage.getItem("kata_last_json_export") || "");
  const [lastXLSXExport, setLastXLSXExport] = useState<string>(() => localStorage.getItem("kata_last_xlsx_export") || "");

  const toggleFocusMode = () => { const v = !focusMode; setFocusMode(v); localStorage.setItem("kata_focus_mode", String(v)); };

  useEffect(() => {
    if (sessionStorage.getItem("kata_auth") === "true") setAuthenticated(true);
  }, []);

  useEffect(() => { guardarDatos(data); }, [data]);

  const toastShow = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const runBackupAndToast = (motivo: string) => {
    const success = createBackup(data, motivo);
    if (!success) {
      toastShow("localStorage lleno, libera espacio o elimina respaldos antiguos");
    } else {
      setBackups(getLocalBackups());
    }
  };

  // ── EXPORT / IMPORT ────────────────────────

  const exportJSON = () => {
    const backupFileName = `total-control-rh-backup-${hoy()}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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
          const parsed = JSON.parse(ev.target?.result as string);
          if (!parsed || typeof parsed !== "object") {
            toastShow("Respaldo corrupto o inválido");
            return;
          }
          const imported = migrateData(parsed);
          runBackupAndToast("importar");
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
      ["Vales de Gas", data.valesGas.map(v => ({ ...v, responsable: getResponsableName(data, v.responsableId) }))],
      ["Vales Gas Organización", (data.valesGasOrganizacion || []).map(v => ({ ...v, responsable: getResponsableName(data, v.responsableId) }))],
      ["Reclutamiento", (data.reclutamiento || []).map(r => ({ ...r, responsable: getResponsableName(data, r.reclutadorId) }))],
    ];
    sheets.forEach(([name, rows]) => { const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, name); });
    XLSX.writeFile(wb, `control_operativo_kata_v5_${hoy()}.xlsx`);
    const timeNow = ahora();
    localStorage.setItem("kata_last_xlsx_export", timeNow);
    setLastXLSXExport(timeNow);
    setData(d => ({ ...d, meta: { ...d.meta, ultimaExportacion: timeNow } }));
    toastShow("XLSX exportado correctamente");
  };

  const exportLimpia = () => {
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
    toastShow("Plantilla limpia descargada");
  };

  const downloadXlsxTemplate = () => {
    const wb = XLSX.utils.book_new();
    const readmeData = [
      ["TotalControlRH — Plantilla oficial de carga XLSX"],
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
    toastShow("Plantilla XLSX descargada");
  };

  const parseXlsxFile = async (file: File): Promise<XlsxParseResult> => {
    const buffer = await file.arrayBuffer();
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
      const rows = xlsxSheetToObjects(ws).filter((r: any) => Object.values(r).some((v: any) => v !== "" && v !== null && v !== undefined));
      const { registros, erroresList, advertenciasList } = processor(rows);
      const validos = registros.filter((r: any) => !r._hasError).length;
      const conError = registros.filter((r: any) => r._hasError).length;
      const conAdv = registros.filter((r: any) => r._hasWarning).length;
      if (conError > 0) result.tieneErroresCriticos = true;
      result.hojas.push({ nombre: sheetNames[0], modulo, total: rows.length, validos, advertencias: conAdv, errores: conError, registros, erroresList, advertenciasList });
      (result.parsedData as any)[modulo] = registros.filter((r: any) => !r._hasError).map((r: any) => { const { _hasError, _hasWarning, _errorMsg, ...clean } = r; return clean; });
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
    setConfirm({ msg: "¿Restaurar datos de ejemplo? Se perderán los datos actuales.", cb: () => { runBackupAndToast("restaurar"); limpiarDatos(); setData(crearDatosEjemplo()); toastShow("Datos de ejemplo restaurados"); setConfirm(null); } });
  };

  const limpiarTodo = () => {
    setConfirm({ msg: "⚠️ ¿Eliminar TODOS los datos? Esta acción no se puede deshacer.", cb: () => {
      setConfirm({ msg: "🚨 ÚLTIMA CONFIRMACIÓN: Se borrará todo definitivamente. ¿Continuar?", cb: () => { runBackupAndToast("limpiar"); limpiarDatos(); setData({ ...crearDatosEjemplo(), cursos: [], ocs: [], practicantes: [], presupuesto: [], procesos: [], diplomas: [], cargaSemanal: [], contactos: [], evaluacionesPsicolaborales: [], valesGas: [], valesGasOrganizacion: [], reclutamiento: [] }); toastShow("Todos los datos eliminados"); setConfirm(null); } });
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
    runBackupAndToast("crear");
    setData(d => {
      const nd = { ...d };
      const arr = [...(nd as any)[modulo]];
      
      let extraFields = {};
      if (modulo === "cargaSemanal") {
        extraFields = {
          semana: item.semana ? `${item.semana} (copia)` : "",
          comentario: item.comentario ? `${item.comentario} (Copia de registro anterior)` : "Copia de registro anterior"
        };
      }

      const newItem = {
        ...item,
        id: genId(),
        ultimaActualizacion: hoy(),
        curso: item.curso ? `${item.curso} (copia)` : "",
        nombre: item.nombre ? `${item.nombre} (copia)` : "",
        proceso: item.proceso ? `${item.proceso} (copia)` : "",
        cargo: item.cargo ? `${item.cargo} (copia)` : "",
        semana: item.semana ? `${item.semana} (copia)` : "",
        contacto: item.contacto ? `${item.contacto} (copia)` : "",
        ...extraFields
      };
      arr.push(newItem);
      (nd as any)[modulo] = arr;
      return nd;
    });
    toastShow("Registro duplicado correctamente.");
  };

  const saveItem = (modulo: string, item: any) => {
    runBackupAndToast(editItem ? "editar" : "crear");
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
    setLastCapturedModulo(target.modulo);
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
          const baseUpdate = {
            ...arr[idx],
            ultimaActualizacion: hoy()
          };
          if (modulo === "ocs") {
            arr[idx] = { ...baseUpdate, estadoOC: closedState };
          } else if (modulo === "reclutamiento") {
            arr[idx] = { ...baseUpdate, proceso: closedState };
          } else {
            arr[idx] = { ...baseUpdate, estado: closedState };
          }
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
    interface ItemBandeja { order: number; tipo: string; nombre: string; prioridad: string; estado: string; bloqueadoPor: string; proximaAccion: string; fechaProximaAccion: string; responsableId: string; modulo: string; }
    const bandeja: ItemBandeja[] = [];

    data.cursos.filter(c => !isClosedRecord(c, "cursos")).forEach(c => {
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

    data.ocs.filter(o => !isClosedRecord(o, "ocs")).forEach(o => {
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

    data.diplomas.filter(d => !isClosedRecord(d, "diplomas")).forEach(d => {
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

    data.evaluacionesPsicolaborales.filter(e => !isClosedRecord(e, "evaluacionesPsicolaborales")).forEach(e => {
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

    data.procesos.filter(p => !isClosedRecord(p, "procesos")).forEach(p => {
      const s = semaforo(p.fechaProximaAccion || p.fechaLimite);
      let order = 0;
      if (s.label === "Vencido") order = 1;
      else if (p.prioridad === "P1 Crítico") order = 2;
      else if (p.bloqueadoPor !== "Sin bloqueo") order = 3;
      else if (s.label === "Vence hoy") order = 4;
      else order = 10;
      bandeja.push({ order, tipo: "Proceso", nombre: p.proceso, prioridad: p.prioridad, estado: p.estadoActual, bloqueadoPor: p.bloqueadoPor, proximaAccion: p.proximaAccion, fechaProximaAccion: p.fechaProximaAccion, responsableId: p.responsableId, modulo: "procesos" });
    });

    (data.valesGas || []).filter(v => v.estado !== "Cerrado" && v.estado !== "Detenido").forEach(v => {
      const s = semaforo(v.fechaProximaRevision);
      let order = 0;
      if (s.label === "Vencido") order = 1;
      else if (v.estado === "En descuento") order = 5;
      else if (s.label === "Vence hoy") order = 4;
      else if (s.label === "1-3 días") order = 6;
      else order = 11;
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
  const downloadInstructions = () => {
    const blob = new Blob([instructionsContent], { type: "text/plain" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "instrucciones_kata_v5.txt";
    a.click();
    URL.revokeObjectURL(url);
    toastShow("Instrucciones descargadas");
  };

  // ── MAIN RENDER ────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#1E293B] text-white transition-all duration-300 flex flex-col shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && <span className="font-semibold text-sm leading-tight tracking-wide">Control<br />Operativo<br />RH</span>}
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
              <h1 className="text-2xl font-bold mb-2">Control Operativo RH</h1>
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
              <KpiCard label="Stock organización" value={dashboardData.valesGasStockOrg} color="text-blue-700" />
              <KpiCard label="Saldo disponible org." value={dashboardData.valesGasSaldoOrg} color={dashboardData.valesGasSaldoOrg < 0 ? "text-red-600" : "text-emerald-600"} />
              <KpiCard label="Vales asignados" value={dashboardData.valesGasAsignados} color="text-indigo-700" />
              <KpiCard label="En descuento" value={dashboardData.valesGasEnDescuento} color="text-orange-600" />
              <KpiCard label="Reclut. abiertos" value={dashboardData.reclAbiertos} color="text-blue-700" />
              <KpiCard label="Reclut. pausados" value={dashboardData.reclPausados} color="text-yellow-600" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">🚦 Semáforo general</h3><div className="flex flex-wrap gap-4"><SemaforoItem color="#DC2626" label="Vencido" count={dashboardData.semaforoCounts.vencido} /><SemaforoItem color="#EA580C" label="Vence hoy" count={dashboardData.semaforoCounts.venceHoy} /><SemaforoItem color="#F59E0B" label="1-3 días" count={dashboardData.semaforoCounts.unoATres} /><SemaforoItem color="#FBBF24" label="4-7 días" count={dashboardData.semaforoCounts.cuatroASiete} /><SemaforoItem color="#16A34A" label="Sin urgencia" count={dashboardData.semaforoCounts.sinUrgencia} /><SemaforoItem color="#9CA3AF" label="Sin fecha" count={dashboardData.semaforoCounts.sinFecha} /></div></div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800 mb-3">📋 Bandeja de acción priorizada</h3><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="bg-slate-100 text-slate-600 uppercase text-xs"><th className="px-3 py-2">#</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Nombre / Proceso</th><th className="px-3 py-2">Prioridad</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Bloqueado por</th><th className="px-3 py-2">Próxima acción</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Responsable</th><th className="px-3 py-2">Módulo</th></tr></thead><tbody>{dashboardData.bandeja.slice(0, 20).map((item, i) => (<tr key={i} className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => setActiveModulo(item.modulo as Modulo)}><td className="px-3 py-2 text-slate-400">{i + 1}</td><td className="px-3 py-2"><Badge label={item.tipo} colorClass="bg-slate-200 text-slate-700" /></td><td className="px-3 py-2 font-medium text-slate-800">{item.nombre}</td><td className="px-3 py-2"><Badge label={item.prioridad} colorClass={prioridadColor[item.prioridad] || ""} /></td><td className="px-3 py-2"><Badge label={item.estado} colorClass={estadoColor[item.estado] || ""} /></td><td className="px-3 py-2">{item.bloqueadoPor !== "Sin bloqueo" ? <Badge label={item.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-"}</td><td className="px-3 py-2 text-slate-600">{item.proximaAccion}</td><td className="px-3 py-2">{item.fechaProximaAccion ? <SemaforoBadge fecha={item.fechaProximaAccion} /> : "-"}</td><td className="px-3 py-2">{getResponsableName(data, item.responsableId)}</td><td className="px-3 py-2"><span className="text-xs text-blue-600 underline">{item.modulo}</span></td></tr>))}</tbody></table></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h4 className="font-bold text-slate-800 mb-2 text-sm">Cursos por prioridad</h4><div className="h-48"><Doughnut data={chartCursosPorPrioridad} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }} /></div></div><div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h4 className="font-bold text-slate-800 mb-2 text-sm">Evaluaciones por estado</h4><div className="h-48"><Doughnut data={chartEvaluacionesPorEstado} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }} /></div></div><div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h4 className="font-bold text-slate-800 mb-2 text-sm">Presupuesto: usado vs disponible</h4><div className="h-48"><Bar data={chartPresupuesto} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }, scales: { x: { stacked: true }, y: { stacked: true } } }} /></div></div></div>
            
            {/* 📄 Reporte Mensual Ejecutivo */}
            <div className="border-t border-slate-200 pt-6">
              <ModuloReporteMensual data={data} toastShow={toastShow} />
            </div>
          </div>
        )}

        {activeModulo === "cursos" && <ModuloCursos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "ocs" && <ModuloOCs data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "practicantes" && <ModuloPracticantes data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "presupuesto" && <ModuloPresupuesto data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} getResponsableName={getResponsableName} />}
        {activeModulo === "procesos" && <ModuloProcesos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} getResponsableName={getResponsableName} />}
        {activeModulo === "diplomas" && <ModuloDiplomas data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "evaluaciones" && <ModuloEvaluaciones data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} duplicateItem={duplicateItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "cargaSemanal" && <ModuloCargaSemanal data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} duplicateItem={duplicateItem} />}
        {activeModulo === "contactos" && <ModuloContactos data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} />}
        {activeModulo === "valesGas" && <ModuloValesGas data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} getResponsableName={getResponsableName} />}
        {activeModulo === "reclutamiento" && <ModuloReclutamiento data={data} search={search} setSearch={setSearch} openNew={openNew} openEdit={openEdit} deleteItem={deleteItem} duplicateItem={duplicateItem} markClosed={markClosed} getResponsableName={getResponsableName} />}
        {activeModulo === "configuracion" && (
          <ModuloConfiguracion
            data={data}
            exportJSON={exportJSON}
            importJSON={importJSON}
            exportXLSX={exportXLSX}
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
          />
        )}

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
          {modalModulo === "valesGas" && <FormValesGas data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "valesGasOrganizacion" && <FormValeGasOrg data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
          {modalModulo === "reclutamiento" && <FormReclutamiento data={data} editItem={editItem} closeModal={closeModal} saveItem={saveItem} />}
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

  const columns = [{ key: "curso", label: "Curso" }, { key: "origen", label: "Origen", render: (r: Curso) => <Badge label={r.origen} colorClass="bg-slate-200 text-slate-700" /> }, { key: "prioridad", label: "Prioridad", render: (r: Curso) => <Badge label={r.prioridad} colorClass={prioridadColor[r.prioridad] || ""} /> }, { key: "estado", label: "Estado", render: (r: Curso) => <Badge label={r.estado} colorClass={estadoColor[r.estado] || ""} /> }, { key: "fechaRequerida", label: "Fecha req.", render: (r: Curso) => toDDMMYYYY(r.fechaRequerida) }, { key: "semaforo", label: "Semáforo", render: (r: Curso) => <SemaforoBadge fecha={r.fechaProximaAccion || r.fechaRequerida} /> }, { key: "bloqueadoPor", label: "Bloqueo", render: (r: Curso) => r.bloqueadoPor !== "Sin bloqueo" ? <Badge label={r.bloqueadoPor} colorClass="bg-red-100 text-red-700" /> : "-" }, { key: "responsable", label: "Resp.", render: (r: Curso) => getResponsableName(data, r.responsableId) }];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-slate-800">📚 Cursos / DNC</h1><p className="text-sm text-slate-500 mt-0.5">Control de cursos y capacitaciones</p></div><button onClick={() => openNew("cursos")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">+ Agregar nuevo</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar curso o proveedor..." filters={<><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_CURSO} placeholder="Estado" /><Select value={filtroOrigen} onChange={setFiltroOrigen} options={ORIGENES_CURSO} placeholder="Origen" /><Select value={filtroSemaforo} onChange={setFiltroSemaforo} options={["Vencido", "Vence hoy", "1-3 días", "4-7 días", "Sin urgencia", "Sin fecha"]} placeholder="Semáforo" /></>} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("cursos", r)} onDelete={(id: string) => deleteItem("cursos", id)} onMarkClosed={(id: string) => markClosed("cursos", id, "Cerrado")} closedState="Cerrado" /></div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} cursos</p>
    </div>
  );
}

function ModuloOCs({ data, search, setSearch, openNew, openEdit, deleteItem, markClosed, getResponsableName }: any) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">🧾 OCs Pendientes</h1><button onClick={() => openNew("ocs")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nueva OC</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar OC, curso o proveedor..." filters={<><Select value={filtroCategoria} onChange={setFiltroCategoria} options={CATEGORIAS_OC} placeholder="Categoría" /><Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_OC} placeholder="Estado" /><Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" /></>} />
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
  const durMeses = (ini: string, fin: string) => ini && fin ? durMesesEntre(ini, fin) : "-";
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
            <tbody>{filtered.map((row: any, i: number) => (<tr key={row.id || i} className="border-t border-slate-100 hover:bg-purple-50/50 transition-colors">{columns.map(c => (<td key={c.key} className="px-3 py-2 whitespace-nowrap">{c.render ? c.render(row) : (row as any)[c.key]}</td>))}<td className="px-3 py-2 whitespace-nowrap"><div className="flex gap-1"><button onClick={() => openEdit("evaluaciones", row)} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition">Editar</button><button onClick={() => duplicateItem("evaluacionesPsicolaborales", row)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Duplicar</button><button onClick={() => deleteItem("evaluacionesPsicolaborales", row.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition">Eliminar</button></div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-1">Mostrando {filtered.length} evaluaciones</p>
    </div>
  );
}

function ModuloCargaSemanal({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem }: any) {
  const filtered = data.cargaSemanal.filter((c: CargaSemanal) => { if (search && !c.semana.toLowerCase().includes(search.toLowerCase()) && !c.comentario.toLowerCase().includes(search.toLowerCase())) return false; return true; });
  const columns = [{ key: "semana", label: "Semana" }, { key: "cursosPlanificados", label: "Planificados" }, { key: "cursosUrgentesNuevos", label: "Urgentes nuevos" }, { key: "cursosNoPlanificados", label: "No planificados" }, { key: "ocsNuevas", label: "OCs nuevas" }, { key: "diplomasPendientes", label: "Diplomas pend." }, { key: "procesosBloqueados", label: "Proc. bloqueados" }, { key: "comentario", label: "Comentario" }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-slate-800">📅 Carga Semanal</h1><button onClick={() => openNew("cargaSemanal")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Nueva semana</button></div>
      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar semana..." filters={null} />
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><Table columns={columns} rows={filtered} onEdit={(r: any) => openEdit("cargaSemanal", r)} onDelete={(id: string) => deleteItem("cargaSemanal", id)} onDuplicate={(r: any) => duplicateItem("cargaSemanal", r)} /></div>
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

function XlsxImportPreview({ parseResult, onConfirmReplace, onConfirmMerge, onCancel }: {
  parseResult: XlsxParseResult;
  onConfirmReplace: () => void;
  onConfirmMerge: () => void;
  onCancel: () => void;
}) {
  const totalRegistros = parseResult.hojas.reduce((s, h) => s + h.total, 0);
  const totalErrores = parseResult.hojas.reduce((s, h) => s + h.errores, 0);
  const totalAdv = parseResult.hojas.reduce((s, h) => s + h.advertencias, 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Previsualizacion de importacion XLSX</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl">x</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center border">
              <div className="text-2xl font-bold text-slate-800">{totalRegistros}</div>
              <div className="text-xs text-slate-500">Total registros</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${totalErrores > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <div className={`text-2xl font-bold ${totalErrores > 0 ? "text-red-600" : "text-green-600"}`}>{totalErrores}</div>
              <div className="text-xs text-slate-500">Errores criticos</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${totalAdv > 0 ? "bg-yellow-50 border-yellow-200" : "bg-slate-50"}`}>
              <div className={`text-2xl font-bold ${totalAdv > 0 ? "text-yellow-600" : "text-slate-400"}`}>{totalAdv}</div>
              <div className="text-xs text-slate-500">Advertencias</div>
            </div>
          </div>

          {parseResult.tieneErroresCriticos && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              Hay errores criticos. Solo se importaran los registros validos al confirmar.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase">
                  <th className="px-4 py-2">Hoja / Modulo</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Validos</th>
                  <th className="px-4 py-2 text-right">Advertencias</th>
                  <th className="px-4 py-2 text-right">Errores</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.hojas.map((h, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-700">{h.nombre}</td>
                    <td className="px-4 py-2 text-right">{h.total}</td>
                    <td className="px-4 py-2 text-right text-green-600">{h.validos}</td>
                    <td className="px-4 py-2 text-right text-yellow-600">{h.advertencias || "-"}</td>
                    <td className="px-4 py-2 text-right text-red-600">{h.errores || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parseResult.hojas.some(h => h.erroresList.length > 0 || h.advertenciasList.length > 0) && (
            <div className="space-y-2">
              {parseResult.hojas.filter(h => h.erroresList.length > 0).map((h, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="text-xs font-bold text-red-700 mb-1">{h.nombre} — Errores:</div>
                  {h.erroresList.map((e, j) => <div key={j} className="text-xs text-red-600">- {e}</div>)}
                </div>
              ))}
              {parseResult.hojas.filter(h => h.advertenciasList.length > 0).map((h, i) => (
                <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                  <div className="text-xs font-bold text-yellow-700 mb-1">{h.nombre} — Advertencias:</div>
                  {h.advertenciasList.map((e, j) => <div key={j} className="text-xs text-yellow-600">- {e}</div>)}
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            Se creara un respaldo automatico antes de importar. Las hojas no presentes en el XLSX mantendran sus datos actuales.
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3 justify-end flex-wrap">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={onConfirmMerge} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            Fusionar con base actual
          </button>
          <button onClick={onConfirmReplace} className="px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors">
            Reemplazar base actual
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuloConfiguracion({
  data, exportJSON, importJSON, exportXLSX, exportLimpia, restaurarEjemplos, limpiarTodo, showInstructions,
  backups, setBackups, lastJSONExport, lastXLSXExport, runBackupAndToast, setData, toastShow,
  downloadXlsxTemplate, parseXlsxFile
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

  const [xlsxParseResult, setXlsxParseResult] = useState<XlsxParseResult | null>(null);
  const [xlsxImporting, setXlsxImporting] = useState(false);
  const xlsxFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleXlsxFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlsxImporting(true);
    try {
      const result = await parseXlsxFile(file);
      setXlsxParseResult(result);
    } catch (err) {
      toastShow("Error al leer el archivo XLSX. Verifica que sea un archivo válido.");
    } finally {
      setXlsxImporting(false);
      if (xlsxFileInputRef.current) xlsxFileInputRef.current.value = "";
    }
  };

  const applyXlsxImport = (mode: "merge" | "replace") => {
    if (!xlsxParseResult) return;
    runBackupAndToast("importar-xlsx");
    const parsed = xlsxParseResult.parsedData;
    let newData = { ...data };
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
    toastShow(`XLSX importado correctamente: ${total} registros en ${hojas} modulos (modo: ${mode === "merge" ? "fusion" : "reemplazo"})`);
  };

  const handleRestaurarBackup = (backup: BackupItem) => {
    if (confirm(`¿Seguro que deseas restaurar este respaldo del ${new Date(backup.fecha).toLocaleString("es-CL")}? Se creará un respaldo de seguridad del estado actual antes de restaurar.`)) {
      runBackupAndToast("antes de restaurar");
      if (backup.data && typeof backup.data === "object") {
        setData(backup.data);
        toastShow("Respaldo restaurado exitosamente.");
      } else {
        toastShow("Respaldo corrupto o inválido");
      }
    }
  };

  const handleDescargarBackup = (backup: BackupItem) => {
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `respaldo_local_kata_${new Date(backup.fecha).toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastShow("JSON de respaldo descargado.");
  };

  const handleEliminarBackup = (id: string) => {
    if (confirm("¿Seguro que deseas eliminar este respaldo local de forma permanente?")) {
      const updated = backups.filter((b: BackupItem) => b.id !== id);
      saveLocalBackups(updated);
      setBackups(updated);
      toastShow("Respaldo eliminado.");
    }
  };

  const handleCrearBackupManual = () => {
    runBackupAndToast("manual");
    toastShow("Respaldo manual creado correctamente.");
  };

  const lastLocalBackupDate = backups[0]?.fecha;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">⚙️ Configuración y Respaldos</h1>

      {/* Alerta Semanal */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800 flex items-start gap-3 shadow-sm">
        <span className="text-lg">📢</span>
        <div>
          <p className="font-semibold">Recomendación operativa semanal:</p>
          <p className="text-xs text-blue-600 mt-1">Descarga un respaldo JSON al menos 1 vez por semana y guárdalo de manera segura en tu carpeta /backups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contador */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">📊 Contador de registros</h3>
          <div className="space-y-2">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{k.replace(/([A-Z])/g, " $").trim()}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between text-sm font-bold">
              <span>Total registros</span>
              <span>{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
        </div>

        {/* Info de Últimos Respaldos */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">💾 Estado de Respaldos</h3>
          <div className="space-y-3">
            <div className="text-xs space-y-1.5 text-slate-600">
              <p>🔄 Último respaldo automático local: <span className="font-semibold text-slate-800">{lastLocalBackupDate ? new Date(lastLocalBackupDate).toLocaleString("es-CL") : "Ninguno todavía"}</span></p>
              <p>📥 Última descarga de respaldo JSON: <span className="font-semibold text-slate-800">{lastJSONExport ? new Date(lastJSONExport).toLocaleString("es-CL") : "Nunca"}</span></p>
              <p>📥 Última descarga de reporte XLSX: <span className="font-semibold text-slate-800">{lastXLSXExport ? new Date(lastXLSXExport).toLocaleString("es-CL") : "Nunca"}</span></p>
              <p>⏱️ Última actualización de datos: <span className="font-semibold text-slate-800">{new Date(data.meta.actualizado).toLocaleString("es-CL")}</span></p>
              <p>⚙️ Versión del sistema: <span className="font-semibold text-slate-800">{data.meta.version}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={exportJSON} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition">📥 Exportar JSON</button>
              <button onClick={importJSON} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition">📤 Importar JSON</button>
              <button onClick={exportXLSX} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition">📥 Exportar XLSX</button>
              <button onClick={exportLimpia} className="bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-700 transition">📋 Plantilla limpia</button>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">📖 Instrucciones de uso</h3>
          <p className="text-sm text-slate-600 mb-3">Guía completa para usar el sistema correctamente.</p>
          <button onClick={showInstructions} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition">Ver instrucciones de uso</button>
        </div>

        {/* Base de datos XLSX */}
        <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm col-span-1 md:col-span-2">
          <h3 className="font-bold text-slate-800 mb-1">📊 Base de datos XLSX</h3>
          <p className="text-sm text-slate-500 mb-4">Importa o exporta toda la base de datos desde/hacia un archivo Excel. Descarga primero la plantilla oficial para conocer el formato correcto.</p>
          <input
            ref={xlsxFileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleXlsxFileSelect}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadXlsxTemplate}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
            >
              📋 Descargar plantilla XLSX
            </button>
            <button
              onClick={() => xlsxFileInputRef.current?.click()}
              disabled={xlsxImporting}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {xlsxImporting ? "Procesando..." : "📤 Importar base desde XLSX"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">Modos disponibles al importar: <strong>Fusionar</strong> (agrega/actualiza sin borrar) o <strong>Reemplazar</strong> (sobreescribe los módulos presentes en el archivo).</p>
        </div>

        {/* Datos de Ejemplo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">🔄 Datos de ejemplo</h3>
          <p className="text-sm text-slate-600 mb-3">Restaura los datos de ejemplo para previsualizar el sistema.</p>
          <button onClick={restaurarEjemplos} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition">Restaurar datos de ejemplo</button>
        </div>

        {/* Zona de peligro */}
        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
          <h3 className="font-bold text-red-700 mb-3">⚠️ Zona de peligro</h3>
          <p className="text-sm text-slate-600 mb-3">Elimina todos los datos. Requiere doble confirmación.</p>
          <button onClick={limpiarTodo} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">Limpiar todos los datos</button>
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
          onConfirmMerge={() => applyXlsxImport("merge")}
          onConfirmReplace={() => applyXlsxImport("replace")}
          onCancel={() => setXlsxParseResult(null)}
        />
      )}
    </div>
  );
}

// ── FORM COMPONENTS ────────────────────────

function useForm(initial: any, editItem: any) {
  const initialRef = React.useRef(initial);
  const [form, setForm] = useState(() => editItem ?? initial);
  useEffect(() => { setForm(editItem ?? initialRef.current); }, [editItem]);
  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  return { form, set };
}

function FormCursos({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ curso: "", origen: "DNC", area: "", solicitante: "", fechaSolicitud: hoy(), fechaRequerida: "", estado: "Pendiente revisar", prioridad: "P3 Medio", nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "", responsableId: "", proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
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
  const { form, set } = useForm({ numeroOC: "", categoriaOC: "", cursoAsociado: "", proveedor: "", monto: 0, fechaSolicitud: hoy(), fechaLimite: "", estadoOC: "Pendiente crear", prioridad: "P3 Medio", accionPendiente: "", responsableId: "", bloqueadoPor: "Sin bloqueo", observaciones: "" }, editItem);
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
      <Field label="Categoría OC" required><Select value={form.categoriaOC} onChange={v => set("categoriaOC", v)} options={CATEGORIAS_OC} placeholder="Seleccionar categoría..." /></Field>
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
  const { form, set } = useForm({ concepto: "", presupuestoTotal: 0, observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});

  const save = () => {
    const errors: VError = {};
    const total = Number(form.presupuestoTotal) || 0;
    if (total < 0) errors.presupuestoTotal = "El presupuesto asignado no puede ser negativo.";
    setVErr(errors);
    if (Object.keys(errors).length > 0) return;
    saveItem("presupuesto", { ...form, presupuestoTotal: total });
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-500 border border-slate-200">
        Módulo: <span className="font-semibold text-slate-700">{form.concepto}</span>
      </div>
      <Field label="Presupuesto asignado (CLP)" required error={vErr.presupuestoTotal}>
        <Input type="number" value={form.presupuestoTotal} onChange={e => set("presupuestoTotal", Number(e.target.value) || 0)} />
      </Field>
      <Field label="Observaciones">
        <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} />
      </Field>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
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
  const [vErr, setVErr] = useState<VError>({});
  const save = () => {
    if (!form.semana.trim()) {
      setVErr({ semana: "El campo Semana es obligatorio." });
      return;
    }
    saveItem("cargaSemanal", form);
  };
  const weeks2026 = getWeeksForYear(new Date().getFullYear());

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Semana (Calendario 2026)" required error={vErr.semana}>
        <select
          value={form.semana}
          onChange={e => set("semana", e.target.value)}
          className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors w-full"
        >
          <option value="">Seleccionar semana...</option>
          {weeks2026.map(w => (
            <option key={w.number} value={w.label}>
              {w.label} ({w.monthLabel} - {w.rangeLabel})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Cursos planificados"><Input type="number" value={form.cursosPlanificados} onChange={e => set("cursosPlanificados", Number(e.target.value) || 0)} /></Field>
      <Field label="Cursos urgentes nuevos"><Input type="number" value={form.cursosUrgentesNuevos} onChange={e => set("cursosUrgentesNuevos", Number(e.target.value) || 0)} /></Field>
      <Field label="Cursos no planificados necesarios"><Input type="number" value={form.cursosNoPlanificados} onChange={e => set("cursosNoPlanificados", Number(e.target.value) || 0)} /></Field>
      <Field label="OCs nuevas"><Input type="number" value={form.ocsNuevas} onChange={e => set("ocsNuevas", Number(e.target.value) || 0)} /></Field>
      <Field label="Diplomas pendientes"><Input type="number" value={form.diplomasPendientes} onChange={e => set("diplomasPendientes", Number(e.target.value) || 0)} /></Field>
      <Field label="Procesos bloqueados"><Input type="number" value={form.procesosBloqueados} onChange={e => set("procesosBloqueados", Number(e.target.value) || 0)} /></Field>
      <Field label="Comentario"><Textarea value={form.comentario} onChange={e => set("comentario", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={[]} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2"><button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button><button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button></div>
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
const TIPOS_CAPTURA = ["Curso", "OC", "Practicante", "Diploma / Certificado / Licencia", "Evaluación Psicolaboral", "Vale de Gas", "Proceso Pendiente"];

function FormCapturaRapida({ data, onCancel, onSave }: { data: AppData; onCancel: () => void; onSave: (capture: any) => void; }) {
  const [form, setForm] = useState({
    tipo: "Curso", nombre: "", prioridad: "P3 Medio", responsableId: "",
    proximaAccion: "", fechaProximaAccion: "", bloqueadoPor: "Sin bloqueo", observaciones: "",
  });
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    setError("");
    if (!form.tipo) return setError("El tipo de registro es obligatorio.");
    if (!form.nombre.trim()) return setError("El nombre o asunto es obligatorio.");
    if (!form.prioridad) return setError("La prioridad es obligatoria.");
    if (!form.proximaAccion.trim()) return setError("La próxima acción es obligatoria.");
    if (form.prioridad === "P1 Crítico" && !form.fechaProximaAccion) return setError("Si la prioridad es P1 Crítico, la fecha próxima acción es obligatoria.");

    onSave({ ...form });
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

// ── REPORTE MENSUAL EJECUTIVO COMPONENT ─────────────────────────

function ModuloReporteMensual({ data, toastShow }: { data: AppData; toastShow: (msg: string) => void }) {
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
  const exportReportXLSX = () => {
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
    toastShow("Reporte mensual XLSX descargado");
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
    toastShow("Reporte mensual JSON descargado");
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
    toastShow("Resumen ejecutivo copiado al portapapeles");
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

function ModuloValesGas({ data, search, setSearch, openNew, openEdit, deleteItem, getResponsableName }: any) {
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
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">⛽ Vales de Gas</h1>
          <p className="text-xs text-slate-500 mt-0.5">Control integral de vales de gas — organización y colaboradores</p>
        </div>
      </div>

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
          <select value={filterOrgTipo} onChange={e => setFilterOrgTipo(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todos los tipos</option>
            {TIPOS_MOVIMIENTO_VALES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterOrgPeriodo} onChange={e => setFilterOrgPeriodo(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
            onEdit={(r: ValeGasOrg) => openEdit("valesGasOrganizacion", r)}
            onDelete={(id: string) => deleteItem("valesGasOrganizacion", id)}
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
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-64"
          />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todos los estados</option>
            {ESTADOS_VALE_GAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todas las áreas</option>
            {areas.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
          </select>
          <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
            onEdit={(r: ValeGas) => openEdit("valesGas", r)}
            onDelete={(id: string) => deleteItem("valesGas", id)}
          />
        </div>
      </div>
    </div>
  );
}

// ── FORMULARIO VALES DE GAS ─────────────────────────

function FormValesGas({ data, editItem, closeModal, saveItem }: any) {
  const today = hoy();
  const defaults: ValeGas = {
    id: "", colaborador: "", contactoId: "", area: "", periodo: "",
    fechaEntrega: today, totalValesAsignados: 0, valesUsados: 0,
    descuentoDiario: 0, diasDescuento: 0, totalDescontado: 0, saldoVales: 0,
    estado: "Pendiente entregar", responsableId: "", fechaProximaRevision: "",
    observaciones: "", ultimaActualizacion: today,
  };
  const { form, set } = useForm(defaults, editItem);

  // Cálculos automáticos
  const saldoCalculado = (form.totalValesAsignados || 0) - (form.valesUsados || 0);
  const totalDescontadoCalculado = (form.descuentoDiario || 0) * (form.diasDescuento || 0);

  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);

  const save = () => {
    const errors: VError = {};
    const warnings: string[] = [];
    if (!form.colaborador?.trim()) errors.colaborador = "El nombre del colaborador es obligatorio.";
    if (!form.area?.trim()) errors.area = "El área es obligatoria.";
    if (!form.periodo?.trim()) errors.periodo = "El período es obligatorio.";
    if ((form.totalValesAsignados || 0) < 0) errors.totalValesAsignados = "El total de vales asignados no puede ser negativo.";
    if ((form.valesUsados || 0) < 0) errors.valesUsados = "Los vales usados no pueden ser negativos.";
    if ((form.valesUsados || 0) > (form.totalValesAsignados || 0)) warnings.push("Los vales entregados/utilizados superan los vales asignados al colaborador. Verifique el dato.");
    if (!form.estado) errors.estado = "El estado es obligatorio.";
    if (form.estado === "En descuento" && !form.fechaProximaRevision) errors.fechaProximaRevision = "La fecha de próxima revisión es obligatoria cuando el vale está en descuento.";
    if (form.estado === "Cerrado" && saldoCalculado > 0) warnings.push("El estado es 'Cerrado' pero hay saldo pendiente del colaborador. Verifique si corresponde cerrar el registro.");
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("valesGas", {
      ...form,
      saldoVales: saldoCalculado,
      totalDescontado: totalDescontadoCalculado,
      ultimaActualizacion: today,
    });
    closeModal();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2">Información principal</h3>
      </div>
      <Field label="Colaborador *"><Input value={form.colaborador} onChange={e => set("colaborador", e.target.value)} placeholder="Nombre del colaborador" /></Field>
      <Field label="Área *"><Input value={form.area} onChange={e => set("area", e.target.value)} placeholder="Ej: Operaciones" /></Field>
      <Field label="Período *"><Input value={form.periodo} onChange={e => set("periodo", e.target.value)} placeholder="Ej: Mayo 2026" /></Field>
      <Field label="Fecha de entrega"><DateInput value={form.fechaEntrega} onChange={v => set("fechaEntrega", v)} /></Field>
      <Field label="Responsable"><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <Field label="Contacto (opcional)">
        <select value={form.contactoId} onChange={e => set("contactoId", e.target.value)} className="border border-[#D9E2EC] rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-100 transition-colors w-full">
          <option value="">Sin contacto asociado</option>
          {(data.contactos || []).filter((c: any) => c.activo !== "No").map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </Field>

      <div className="md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2 mt-2">Control de vales</h3>
      </div>
      <p className="text-xs text-slate-400 col-span-2">Este formulario registra los vales asociados a un colaborador, no el total general de la organización.</p>
      <Field label="Vales asignados al colaborador"><Input type="number" value={String(form.totalValesAsignados)} onChange={e => set("totalValesAsignados", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Vales entregados / utilizados"><Input type="number" value={String(form.valesUsados)} onChange={e => set("valesUsados", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Saldo pendiente del colaborador">
        <div className={`border rounded-lg px-3 py-2 text-sm font-semibold ${saldoCalculado < 0 ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-800"}`}>
          {saldoCalculado} vales
        </div>
      </Field>
      <Field label="Descuento diario (vales/día)"><Input type="number" value={String(form.descuentoDiario)} onChange={e => set("descuentoDiario", parseFloat(e.target.value) || 0)} /></Field>
      <Field label="Días de descuento"><Input type="number" value={String(form.diasDescuento)} onChange={e => set("diasDescuento", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Total descontado al colaborador">
        <div className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 text-slate-800">
          {totalDescontadoCalculado} vales
        </div>
      </Field>

      <div className="md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2 mt-2">Seguimiento</h3>
      </div>
      <Field label="Estado *"><Select value={form.estado} onChange={v => set("estado", v)} options={ESTADOS_VALE_GAS} /></Field>
      <Field label="Fecha próxima revisión"><DateInput value={form.fechaProximaRevision} onChange={v => set("fechaProximaRevision", v)} /></Field>
      <div className="md:col-span-2">
        <Field label="Observaciones"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Contexto adicional..." /></Field>
      </div>

      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}

// ── FORMULARIO VALES GAS ORGANIZACIÓN ─────────────────────────

function FormValeGasOrg({ data, editItem, closeModal, saveItem }: any) {
  const today = hoy();
  const defaults: ValeGasOrg = {
    id: "", fechaRegistro: today, periodo: "", tipoMovimiento: "Ingreso de vales",
    cantidadVales: 0, motivo: "", responsableId: "", observaciones: "", ultimaActualizacion: today,
  };
  const { form, set } = useForm(defaults, editItem);
  const [vErr, setVErr] = useState<VError>({});

  const save = () => {
    const errors: VError = {};
    if (!form.fechaRegistro) errors.fechaRegistro = "La fecha de registro es obligatoria.";
    if (!form.periodo?.trim()) errors.periodo = "El período es obligatorio.";
    if (!form.tipoMovimiento) errors.tipoMovimiento = "El tipo de movimiento es obligatorio.";
    if ((form.cantidadVales || 0) <= 0) errors.cantidadVales = "La cantidad de vales debe ser mayor a 0.";
    setVErr(errors);
    if (Object.keys(errors).length > 0) return;
    saveItem("valesGasOrganizacion", { ...form, ultimaActualizacion: today });
    closeModal();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1.5 mb-2">Movimiento de vales — Organización</h3>
      </div>
      <Field label="Fecha de registro *" error={vErr.fechaRegistro}><DateInput value={form.fechaRegistro} onChange={v => set("fechaRegistro", v)} /></Field>
      <Field label="Período *" error={vErr.periodo}><Input value={form.periodo} onChange={e => set("periodo", e.target.value)} placeholder="Ej: Mayo 2026" /></Field>
      <Field label="Tipo de movimiento *" error={vErr.tipoMovimiento}><Select value={form.tipoMovimiento} onChange={v => set("tipoMovimiento", v)} options={TIPOS_MOVIMIENTO_VALES} /></Field>
      <Field label="Cantidad de vales *" error={vErr.cantidadVales}><Input type="number" value={String(form.cantidadVales)} onChange={e => set("cantidadVales", parseInt(e.target.value) || 0)} /></Field>
      <Field label="Motivo"><Input value={form.motivo} onChange={e => set("motivo", e.target.value)} placeholder="Ej: Compra mensual" /></Field>
      <Field label="Responsable"><SelectContact value={form.responsableId} onChange={v => set("responsableId", v)} data={data} /></Field>
      <div className="md:col-span-2">
        <Field label="Observaciones"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Contexto adicional..." /></Field>
      </div>
      <FormMessages errors={vErr} warnings={[]} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}

// ── MÓDULO RECLUTAMIENTO ─────────────────────────

function ModuloReclutamiento({ data, search, setSearch, openNew, openEdit, deleteItem, duplicateItem, markClosed }: any) {
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-xl font-bold text-slate-800">👥 Reclutamiento</h1><p className="text-sm text-slate-500">Control de procesos de reclutamiento y selección</p></div>
        <button onClick={() => openNew("reclutamiento")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-semibold">+ Nuevo proceso</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total", val: total, color: "bg-slate-50 text-slate-700" },
          { label: "Abiertos", val: abiertos, color: "bg-green-50 text-green-700" },
          { label: "Cerrados", val: cerrados, color: "bg-slate-100 text-slate-600" },
          { label: "Pausados", val: pausados, color: "bg-yellow-50 text-yellow-700" },
          { label: "Desistidos", val: desistidos, color: "bg-red-50 text-red-700" },
          { label: "Bloqueados", val: bloqueados, color: "bg-orange-50 text-orange-700" },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-3 text-center border ${k.color}`}>
            <div className="text-xs font-medium opacity-70">{k.label}</div>
            <div className="text-2xl font-bold">{k.val}</div>
          </div>
        ))}
      </div>

      <FilterBar search={search} setSearch={setSearch} searchPlaceholder="Buscar por planta, tipo, reclutador..." filters={<>
        <Select value={filtroEstado} onChange={setFiltroEstado} options={ESTADOS_PROCESO_RECLUTAMIENTO} placeholder="Proceso" />
        <Select value={filtroPlanta} onChange={setFiltroPlanta} options={PLANTAS_CENTROS} placeholder="Planta / Centro" />
        <Select value={filtroTipo} onChange={setFiltroTipo} options={TIPOS_VACANTE} placeholder="Tipo vacante" />
        <Select value={filtroMes} onChange={setFiltroMes} options={MESES} placeholder="Mes ingreso" />
        <Select value={filtroPrioridad} onChange={setFiltroPrioridad} options={PRIORIDADES} placeholder="Prioridad" />
      </>} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} rows={filtered}
          onEdit={(r: any) => openEdit("reclutamiento", r)}
          onDelete={(id: string) => deleteItem("reclutamiento", id)}
          onDuplicate={duplicateItem ? (id: string) => duplicateItem("reclutamiento", id) : undefined}
          onMarkClosed={(id: string) => markClosed("reclutamiento", id, "Cerrado")}
          closedState="Cerrado" />
      </div>
      <p className="text-xs text-slate-400">Mostrando {filtered.length} de {total} procesos</p>
    </div>
  );
}

function FormReclutamiento({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({
    reclutamiento: "", plantaCentro: "", tipoVacante: "", mesIngreso: "",
    revisadoPPTO: "", procesoBuk: "", publicado: "", seleccionCV: "",
    cvSeleccionadoBuk: "", entrevistaJefatura: "", entrevistaGP: "",
    testPsicolaboral: "", testHogan: "", seleccionado: "", cartaOferta: "",
    envioCartaOferta: "", firmaCartaOferta: "", fechaIngreso: "",
    reclutador: "", proceso: "Abierto", reclutadorId: "",
    prioridad: "P3 Medio", bloqueadoPor: "Sin bloqueo",
    proximaAccion: "", fechaProximaAccion: "", observaciones: ""
  }, editItem);

  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);

  const { pct, etapaActual } = calcReclutamientoAvance(form as ProcesoReclutamiento);

  const save = () => {
    const errors: VError = {};
    const warnings: string[] = [];
    if (!form.plantaCentro) errors.plantaCentro = "Planta o Centro es obligatorio.";
    if (!form.tipoVacante) errors.tipoVacante = "Tipo de vacante es obligatorio.";
    if (!form.mesIngreso) errors.mesIngreso = "Mes ingreso es obligatorio.";
    if (!form.proceso) errors.proceso = "El estado del proceso es obligatorio.";
    if (form.proceso === "Pausado" && (!form.bloqueadoPor || form.bloqueadoPor === "Sin bloqueo")) {
      warnings.push("El proceso está Pausado pero no tiene bloqueante indicado.");
    }
    setVErr(errors); setVWarn(warnings);
    if (Object.keys(errors).length > 0) return;
    saveItem("reclutamiento", form);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-blue-700 mb-1"><span>Avance del proceso</span><span className="font-bold">{pct}%</span></div>
          <div className="w-full bg-blue-200 rounded-full h-2"><div className="h-2 rounded-full bg-blue-600 transition-all" style={{width:`${pct}%`}}/></div>
        </div>
        <div className="text-xs text-blue-600 font-semibold min-w-max">Etapa: {etapaActual}</div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">1. Información principal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo de reclutamiento"><Select value={form.reclutamiento} onChange={(v: string) => set("reclutamiento", v)} options={TIPOS_RECLUTAMIENTO} placeholder="Seleccionar..." /></Field>
          <Field label="Planta o Centro" required error={vErr.plantaCentro}><Select value={form.plantaCentro} onChange={(v: string) => set("plantaCentro", v)} options={PLANTAS_CENTROS} placeholder="Seleccionar..." /></Field>
          <Field label="Tipo de vacante" required error={vErr.tipoVacante}><Select value={form.tipoVacante} onChange={(v: string) => set("tipoVacante", v)} options={TIPOS_VACANTE} placeholder="Seleccionar..." /></Field>
          <Field label="Mes ingreso" required error={vErr.mesIngreso}><Select value={form.mesIngreso} onChange={(v: string) => set("mesIngreso", v)} options={MESES} placeholder="Seleccionar..." /></Field>
          <Field label="Fecha ingreso"><DateInput value={form.fechaIngreso} onChange={(v: string) => set("fechaIngreso", v)} /></Field>
          <Field label="Proceso" required error={vErr.proceso}><Select value={form.proceso} onChange={(v: string) => set("proceso", v)} options={ESTADOS_PROCESO_RECLUTAMIENTO} /></Field>
          <Field label="Reclutador (texto)"><Input value={form.reclutador} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("reclutador", e.target.value)} placeholder="Nombre del reclutador" /></Field>
          <Field label="Responsable web"><SelectContact value={form.reclutadorId} onChange={(v: string) => set("reclutadorId", v)} data={data} /></Field>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">2. Flujo del proceso</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Revisado PPTO"><Select value={form.revisadoPPTO} onChange={(v: string) => set("revisadoPPTO", v)} options={OPTS_REVISADO_PPTO} placeholder="—" /></Field>
          <Field label="Proceso en BUK"><Select value={form.procesoBuk} onChange={(v: string) => set("procesoBuk", v)} options={OPTS_PROCESO_BUK} placeholder="—" /></Field>
          <Field label="Publicado"><Select value={form.publicado} onChange={(v: string) => set("publicado", v)} options={OPTS_SI_NO} placeholder="—" /></Field>
          <Field label="Selección de CV"><Select value={form.seleccionCV} onChange={(v: string) => set("seleccionCV", v)} options={OPTS_SELECCION_CV} placeholder="—" /></Field>
          <Field label="CV Seleccionado en BUK"><Select value={form.cvSeleccionadoBuk} onChange={(v: string) => set("cvSeleccionadoBuk", v)} options={OPTS_SI_NO} placeholder="—" /></Field>
          <Field label="Entrevista Jefatura"><Select value={form.entrevistaJefatura} onChange={(v: string) => set("entrevistaJefatura", v)} options={OPTS_ENTREVISTA} placeholder="—" /></Field>
          <Field label="Entrevista GP"><Select value={form.entrevistaGP} onChange={(v: string) => set("entrevistaGP", v)} options={OPTS_ENTREVISTA} placeholder="—" /></Field>
          <Field label="Test Psicolaboral"><Select value={form.testPsicolaboral} onChange={(v: string) => set("testPsicolaboral", v)} options={OPTS_TEST} placeholder="—" /></Field>
          <Field label="Test Hogan"><Select value={form.testHogan} onChange={(v: string) => set("testHogan", v)} options={OPTS_TEST} placeholder="—" /></Field>
          <Field label="Seleccionado"><Select value={form.seleccionado} onChange={(v: string) => set("seleccionado", v)} options={OPTS_SI_NO} placeholder="—" /></Field>
          <Field label="Carta Oferta"><Select value={form.cartaOferta} onChange={(v: string) => set("cartaOferta", v)} options={OPTS_CARTA_OFERTA} placeholder="—" /></Field>
          <Field label="Envío carta oferta"><Select value={form.envioCartaOferta} onChange={(v: string) => set("envioCartaOferta", v)} options={OPTS_ENVIO_CARTA} placeholder="—" /></Field>
          <Field label="Firma Carta Oferta"><Select value={form.firmaCartaOferta} onChange={(v: string) => set("firmaCartaOferta", v)} options={OPTS_SI_NO} placeholder="—" /></Field>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">3. Seguimiento interno</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Prioridad"><Select value={form.prioridad} onChange={(v: string) => set("prioridad", v)} options={PRIORIDADES} /></Field>
          <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={(v: string) => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
          <Field label="Próxima acción"><Input value={form.proximaAccion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("proximaAccion", e.target.value)} /></Field>
          <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={(v: string) => set("fechaProximaAccion", v)} /></Field>
          <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("observaciones", e.target.value)} /></Field>
        </div>
      </div>

      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
