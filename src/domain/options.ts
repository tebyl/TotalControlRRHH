export const PRIORIDADES = ["P1 Crítico", "P2 Alto", "P3 Medio", "P4 Bajo"];
export const ESTADOS_CURSO = ["Pendiente revisar", "En cotización", "En aprobación", "Programado", "Ejecutado", "Cerrado", "Detenido"];
export const ESTADOS_OC = ["Pendiente crear", "Solicitada", "En aprobación", "Emitida", "Enviada proveedor", "Cerrada", "Detenida"];
export const CATEGORIAS_OC = ["Curso / Capacitación", "Evento", "Actividad de bienestar", "Kit de bienvenida", "Artículos / Insumos", "Evaluación psicolaboral", "Servicio profesional", "Uniformes / EPP", "Tecnología / Software", "Otro"];
export const ESTADOS_PRACTICANTE = ["Por buscar", "En reclutamiento", "Seleccionado", "Activo", "Finalizado", "Detenido"];
export const ESTADOS_DIPLOMA = ["Pedir a la OTEC", "Enviar o pedir al participante", "Subir a BUK", "Completado", "Detenido"];
export const ESTADOS_BUK = ["Pendiente subir", "Subido", "Rechazado", "No aplica"];
export const ESTADOS_EVALUACION = ["Pendiente solicitar", "Solicitada", "Agendada", "Realizada", "Informe recibido", "En revisión", "Cerrada", "Detenida"];
export const RESULTADOS_EVALUACION = ["Recomendado", "Recomendado con observaciones", "No recomendado", "Pendiente", "No aplica"];
export const TIPOS_EVALUACION = ["Psicolaboral", "Referencias laborales", "Evaluación técnica", "Evaluación mixta", "Hogan", "Otro"];
export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const ORIGENES_CURSO = ["DNC", "Carta Gantt", "Urgente no planificado", "Academia Molineria", "No planificado necesario", "Emergente por operación", "Requerimiento legal", "Solicitud jefatura", "Reprogramado", "Otro"];
export const BLOQUEOS = ["Sin bloqueo", "Falta aprobación", "Falta OC", "Falta cotización", "Falta OTEC", "Falta participante", "Falta jefatura", "Falta presupuesto", "Falta subir a BUK", "Falta candidato", "Falta proveedor", "Falta informe", "Otro"];
export const RELACIONES = ["Interno", "OTEC", "Participante", "Jefatura", "Compras", "Finanzas", "RRHH", "BUK", "Psicólogo / Proveedor evaluación", "Otro"];
export const TIPOS_PROCESO = ["Curso", "OC", "Presupuesto", "Practicante", "Reclutamiento", "Diploma / certificado / licencia", "BUK", "Otro"];
export const TIPOS_DOCUMENTO = ["Diploma", "Certificado", "Licencia", "Otro"];
export const ESTADOS_VALE_GAS = ["Pendiente entregar", "Entregado", "En descuento", "Cerrado", "Detenido"];
export const TIPOS_MOVIMIENTO_VALES = ["Ingreso de vales", "Ajuste positivo", "Ajuste negativo", "Corrección inventario", "Otro"];
export const TIPOS_RECLUTAMIENTO = ["Interno", "Externo", "Promoción interna", "Reemplazo interno", "Otro", "Por definir"];
export const PLANTAS_CENTROS = ["Planta Bio Bio", "Planta Freire", "Planta Perquenco", "Perquenco Carretera", "Planta Lautaro", "Lautaro Copeval", "Planta Rio Bueno", "Planta Victoria", "Casa Matriz", "Otro"];
export const TIPOS_VACANTE = ["Cosecha", "Reemplazo", "Fijo", "Temporal", "Práctica", "Proyecto", "Otro", "Por definir"];
export const ESTADOS_PROCESO_RECLUTAMIENTO = ["Abierto", "Cerrado", "Pausado", "Desistido"];
export const OPTS_SI_NO = ["Sí", "No", "Pendiente", "N/A"];
export const OPTS_ENTREVISTA = ["Pendiente", "Agendada", "Realizada", "N/A"];
export const OPTS_TEST = ["Pendiente", "Solicitado", "Realizado", "N/A"];
export const OPTS_SELECCION_CV = ["Pendiente", "En proceso", "Finalizado", "N/A"];
export const OPTS_CARTA_OFERTA = ["Pendiente", "Solicitada", "Emitida", "N/A"];
export const OPTS_ENVIO_CARTA = ["Pendiente", "Realizado", "N/A"];
export const OPTS_PROCESO_BUK = ["Sí", "No", "Confidencial", "Pendiente", "N/A"];
export const OPTS_REVISADO_PPTO = ["Pendiente", "Aceptado", "Rechazado", "N/A"];
export const ETAPAS_RECLUTAMIENTO = [
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
export const ETAPAS_COMPLETADAS_VALUES = ["Sí", "Realizado", "Realizada", "Finalizado", "Emitida", "Aceptado", "Solicitada"];
export const ETAPAS_NO_APLICA_VALUES = ["N/A"];
export const TIPOS_CAPTURA = ["Curso", "OC", "Practicante", "Diploma / Certificado / Licencia", "Evaluación Psicolaboral", "Vale de Gas", "Proceso Pendiente"];
