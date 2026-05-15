export interface Curso { id: string; curso: string; origen: string; area: string; solicitante: string; fechaSolicitud: string; fechaRequerida: string; estado: string; prioridad: string; nivelCritico: string; requiereOC: string; numeroOC: string; proveedor: string; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
export interface OC { id: string; numeroOC: string; categoriaOC: string; cursoAsociado: string; proveedor: string; monto: number; fechaSolicitud: string; fechaLimite: string; estadoOC: string; prioridad: string; accionPendiente: string; responsableId: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
export interface Practicante { id: string; nombre: string; area: string; especialidad: string; fechaInicio: string; fechaTermino: string; costoMensual: number; estado: string; responsableId: string; proximoPaso: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
export interface PresupuestoItem { id: string; concepto: string; presupuestoTotal: number; gastado: number; responsableId: string; ultimaActualizacion: string; observaciones: string; montoComprometidoManual?: number; montoEjecutadoManual?: number; modoCalculo?: string; }
export interface Proceso { id: string; proceso: string; tipo: string; estadoActual: string; queFalta: string; responsableId: string; fechaLimite: string; riesgo: string; prioridad: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
export interface Diploma { id: string; cursoAsociado: string; participante: string; tipoDocumento: string; otec: string; etapa: string; fechaSolicitudOTEC: string; fechaRecepcionDoc: string; fechaEnvioParticipante: string; fechaSubidaBUK: string; estadoBUK: string; prioridad: string; responsableId: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
export interface CargaSemanal { id: string; semana: string; cursosPlanificados: number; cursosUrgentesNuevos: number; cursosNoPlanificados: number; ocsNuevas: number; diplomasPendientes: number; procesosBloqueados: number; comentario: string; }
export interface Contacto { id: string; nombre: string; rol: string; areaEmpresa: string; correo: string; telefono: string; relacion: string; activo: string; observaciones: string; }
export interface EvaluacionPsicolaboral { id: string; mes: string; ano: number; cargo: string; area: string; candidato: string; rut: string; tipoEvaluacion: string; proveedor: string; fechaSolicitud: string; fechaEvaluacion: string; fechaEntregaInforme: string; estado: string; resultado: string; prioridad: string; responsableId: string; costo: number; requiereOC: string; numeroOC: string; proximaAccion: string; fechaProximaAccion: string; bloqueadoPor: string; ultimaActualizacion: string; observaciones: string; }
export type Evaluacion = EvaluacionPsicolaboral;

export interface ValeGas { id: string; colaborador: string; contactoId: string; area: string; periodo: string; fechaEntrega: string; totalValesAsignados: number; valesUsados: number; descuentoDiario: number; diasDescuento: number; totalDescontado: number; saldoVales: number; estado: string; responsableId: string; fechaProximaRevision: string; observaciones: string; ultimaActualizacion: string; }
export interface ValeGasOrg { id: string; fechaRegistro: string; periodo: string; tipoMovimiento: string; cantidadVales: number; motivo: string; responsableId: string; observaciones: string; ultimaActualizacion: string; }

export interface Reclutamiento {
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
export type ProcesoReclutamiento = Reclutamiento;

export interface AppData {
  cursos: Curso[];
  ocs: OC[];
  practicantes: Practicante[];
  presupuesto: PresupuestoItem[];
  procesos: Proceso[];
  diplomas: Diploma[];
  cargaSemanal: CargaSemanal[];
  contactos: Contacto[];
  evaluacionesPsicolaborales: EvaluacionPsicolaboral[];
  valesGas: ValeGas[];
  valesGasOrganizacion: ValeGasOrg[];
  reclutamiento: Reclutamiento[];
  meta: { version: string; ultimaExportacion: string; actualizado: string };
}

export type DataModuleKey = Exclude<keyof AppData, "meta">;
export type ModuloKey = "inicio" | "midia" | "dashboard" | DataModuleKey | "evaluaciones" | "configuracion" | "admin" | "guia";

export interface BackupItem {
  id: string;
  fecha: string;
  motivo: string;
  data: AppData;
  tamaño: string;
}
