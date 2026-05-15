import { memo } from "react";
import { BookOpen, Calendar, CheckCircle2, ClipboardList, Download, HelpCircle, Info, Lightbulb, Shield, Star, Zap } from "lucide-react";
import { ModuleHeader, ExpandableSection } from "../components/ui";

const RUTINA: { dia: string; tareas: string[] }[] = [
  {
    dia: "Lunes",
    tareas: [
      "Revisar cursos activos: verificar estados, próximas acciones y vencimientos",
      "Controlar OCs pendientes: seguimiento a bloqueos y fechas límite",
      "Actualizar presupuesto: registrar nuevos compromisos o pagos",
    ],
  },
  {
    dia: "Miércoles",
    tareas: [
      "Gestionar diplomas y certificados: actualizar etapas (OTEC → participante → BUK)",
      "Revisar evaluaciones psicolaborales: confirmar resultados e informes",
      "Verificar practicantes y reclutamientos activos",
    ],
  },
  {
    dia: "Viernes",
    tareas: [
      "Cerrar registros finalizados en todos los módulos",
      "Hacer respaldo manual desde Configuración",
      "Preparar agenda y próximas acciones de la semana siguiente",
    ],
  },
];

const MODULOS: { nombre: string; icono: string; descripcion: string; pasos: string[] }[] = [
  {
    nombre: "Mi Día",
    icono: "☀️",
    descripcion: "Vista diaria personalizada con tus pendientes más urgentes.",
    pasos: [
      "Accede desde el sidebar para ver tus tareas críticas del día.",
      "Los semáforos indican urgencia: rojo vencido, naranja próximo, verde al día.",
      "Haz click en cualquier ítem para ir directamente al registro.",
    ],
  },
  {
    nombre: "Dashboard",
    icono: "📊",
    descripcion: "Panel ejecutivo con métricas en tiempo real de todos los módulos.",
    pasos: [
      "Muestra conteos de registros críticos, vencidos y bloqueados.",
      "Úsalo al inicio de la semana para identificar qué requiere atención inmediata.",
      "Los gráficos reflejan el estado actual sin necesidad de filtrar.",
    ],
  },
  {
    nombre: "Cursos / DNC",
    icono: "🎓",
    descripcion: "Gestión de cursos de capacitación y Diagnóstico de Necesidades.",
    pasos: [
      "Crear: Agregar nuevo → define origen, estado, prioridad, responsable y próxima acción.",
      "Si requiere OC, marca el campo y gestiona la orden de compra en el módulo OCs.",
      "Actualiza el estado en cada hito hasta cerrar el curso.",
      "Usa Prioridad P1 solo para cursos críticos; requiere responsable y próxima acción definida.",
    ],
  },
  {
    nombre: "OCs Pendientes",
    icono: "📄",
    descripcion: "Control de órdenes de compra asociadas a cursos y otras actividades.",
    pasos: [
      "Crea la OC indicando proveedor, monto y fecha límite.",
      "Asocia la OC al curso correspondiente para trazabilidad completa.",
      "Actualiza estado: Pendiente crear → Solicitada → Emitida → Enviada proveedor → Cerrada.",
      "Revisa bloqueos periódicamente para no perder plazos.",
    ],
  },
  {
    nombre: "Diplomas / Cert / Lic",
    icono: "🏆",
    descripcion: "Seguimiento de diplomas, certificados y licencias por participante.",
    pasos: [
      "Crea el registro asociado al curso una vez que este esté ejecutado.",
      "Sigue el flujo: Pedir a la OTEC → Enviar o pedir al participante → Subir a BUK → Completado.",
      "El semáforo indica si la gestión está dentro del plazo.",
    ],
  },
  {
    nombre: "Evaluaciones Psicolaborales",
    icono: "🧠",
    descripcion: "Gestión de evaluaciones de candidatos en procesos de selección.",
    pasos: [
      "Crea la evaluación con mes, cargo y nombre del candidato.",
      "Registra el proveedor y define la fecha de evaluación.",
      "Actualiza cuando llegue el informe: Agendada → Realizada → Informe recibido → En revisión → Resultado.",
      "Cierra con Recomendado, Recomendado con observaciones o No recomendado.",
    ],
  },
  {
    nombre: "Contactos",
    icono: "👥",
    descripcion: "Directorio de responsables y personas de referencia.",
    pasos: [
      "Todo responsable debe existir primero en Contactos antes de ser asignado.",
      "Marca como Inactivo a quienes ya no estén en la organización.",
      "Usa el campo Notas para información relevante de contacto.",
    ],
  },
  {
    nombre: "Presupuesto",
    icono: "💰",
    descripcion: "Control de compromisos y gastos del área.",
    pasos: [
      "Registra cada compromiso de gasto con su monto y estado.",
      "Asocia al responsable y categoría para facilitar reportes.",
      "Cierra el registro cuando el pago esté confirmado.",
    ],
  },
];

const BUENAS_PRACTICAS = [
  { titulo: "Registra el mismo día", detalle: "Actualiza estados y observaciones el mismo día que ocurre el hito. Los datos viejos generan decisiones erróneas." },
  { titulo: "No dejes fechas vacías en temas críticos", detalle: "Todo registro de prioridad P1 o P2 debe tener fecha de próxima acción definida." },
  { titulo: "Cierra lo finalizado", detalle: "Un registro cerrado libera atención. No dejes cursos 'Ejecutados' sin pasar a 'Cerrado'." },
  { titulo: "Observaciones breves y claras", detalle: "Una línea con fecha y contexto es suficiente. Ejemplo: '10-may: pendiente firma jefatura'." },
  { titulo: "Revisa bloqueos antes de escalar", detalle: "Si un proceso está detenido, primero actualiza el campo Bloqueado por. Así el equipo sabe el estado real." },
  { titulo: "Un responsable, no varios", detalle: "Asigna un solo responsable por registro. Si hay varios involucrados, úsalo en observaciones." },
  { titulo: "Respalda semanalmente", detalle: "Exporta JSON cada viernes desde Configuración y guárdalo en una carpeta segura fuera de la app." },
];

function RutinaSemanal() {
  const colores: Record<string, string> = {
    Lunes: "border-blue-200 bg-blue-50",
    Miércoles: "border-indigo-200 bg-indigo-50",
    Viernes: "border-emerald-200 bg-emerald-50",
  };
  const titulos: Record<string, string> = {
    Lunes: "text-blue-700",
    Miércoles: "text-indigo-700",
    Viernes: "text-emerald-700",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {RUTINA.map(({ dia, tareas }) => (
        <div key={dia} className={`rounded-xl border p-4 space-y-3 ${colores[dia]}`}>
          <div className="flex items-center gap-2">
            <Calendar size={15} className={titulos[dia]} />
            <p className={`text-sm font-bold ${titulos[dia]}`}>{dia}</p>
          </div>
          <ul className="space-y-2">
            {tareas.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-slate-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function GuiaModulo({ nombre, icono, descripcion, pasos }: typeof MODULOS[0]) {
  return (
    <details className="bg-white border border-slate-200 rounded-xl group">
      <summary className="px-5 py-3.5 flex items-center gap-3 cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-xl">
        <span className="text-xl">{icono}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{nombre}</p>
          <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
        </div>
        <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="px-5 pb-4 pt-1 border-t border-slate-100">
        <ol className="space-y-2">
          {pasos.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              {p}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}

function handleCopyGuia() {
  const texto = [
    "GUÍA DE USO — PulsoLaboral Control Operativo",
    "",
    "REGLA DE ORO",
    "Si no está registrado aquí, no existe para seguimiento.",
    "",
    "RUTINA SEMANAL",
    ...RUTINA.flatMap(r => [`${r.dia}:`, ...r.tareas.map(t => `  · ${t}`)]),
    "",
    "BUENAS PRÁCTICAS",
    ...BUENAS_PRACTICAS.map(p => `· ${p.titulo}: ${p.detalle}`),
  ].join("\n");
  navigator.clipboard.writeText(texto).catch(() => {});
}

function handleDescargarGuia() {
  const texto = [
    "GUÍA DE USO — PulsoLaboral Control Operativo",
    "=".repeat(50),
    "",
    "REGLA DE ORO",
    "Si no está registrado aquí, no existe para seguimiento.",
    "",
    "RUTINA SEMANAL",
    ...RUTINA.flatMap(r => [`\n${r.dia.toUpperCase()}`, ...r.tareas.map(t => `  · ${t}`)]),
    "",
    "\nBUENAS PRÁCTICAS",
    ...BUENAS_PRACTICAS.map(p => `\n· ${p.titulo}\n  ${p.detalle}`),
  ].join("\n");
  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "guia_uso_pulsolaboral.txt";
  a.click();
}

function ModuloGuia() {
  return (
    <div className="space-y-4">
      <ModuleHeader
        icon={<BookOpen size={20} className="text-white" />}
        gradient="from-violet-500 to-indigo-600"
        title="Guía de Uso"
        subtitle="Instrucciones, rutina semanal y buenas prácticas para sacar el máximo provecho de la app."
      />

      {/* Regla de oro */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <Star size={18} className="shrink-0 text-amber-500 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Regla de oro</p>
          <p className="text-sm text-amber-700 mt-0.5">Si no está registrado aquí, no existe para seguimiento. La app vale lo que tú le ingresas.</p>
        </div>
      </div>

      {/* Rutina semanal */}
      <ExpandableSection title="Rutina semanal recomendada" defaultOpen={true}>
        <RutinaSemanal />
      </ExpandableSection>

      {/* Por módulo */}
      <ExpandableSection title="Cómo usar cada módulo" defaultOpen={true}>
        <div className="space-y-2">
          {MODULOS.map(m => (
            <GuiaModulo key={m.nombre} {...m} />
          ))}
        </div>
      </ExpandableSection>

      {/* Semáforos */}
      <ExpandableSection title="Semáforos y prioridades">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Zap size={12} />Semáforo de fechas</p>
            {[
              { color: "bg-red-500", label: "Vencido", desc: "La fecha ya pasó. Acción urgente." },
              { color: "bg-orange-500", label: "Vence hoy o mañana", desc: "Muy próximo. Actuar hoy." },
              { color: "bg-amber-400", label: "Vence en 3–7 días", desc: "Próximo. Coordinar esta semana." },
              { color: "bg-yellow-300", label: "Vence en 8–14 días", desc: "A tiempo pero en seguimiento." },
              { color: "bg-emerald-500", label: "Más de 14 días", desc: "Holgado. Sin acción inmediata." },
              { color: "bg-slate-300", label: "Sin fecha", desc: "No tiene fecha asignada." },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
                <div>
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                  <span className="text-xs text-slate-400"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Shield size={12} />Prioridades</p>
            {[
              { label: "P1 Crítico", color: "bg-red-100 text-red-800 border-red-200", desc: "Requiere responsable y próxima acción definida." },
              { label: "P2 Alto", color: "bg-orange-100 text-orange-800 border-orange-200", desc: "Seguimiento semanal obligatorio." },
              { label: "P3 Medio", color: "bg-amber-50 text-amber-800 border-amber-200", desc: "En seguimiento normal." },
              { label: "P4 Bajo", color: "bg-green-100 text-green-800 border-green-200", desc: "Puede esperar sin riesgo." },
            ].map(({ label, color, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>{label}</span>
                <span className="text-xs text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </ExpandableSection>

      {/* Buenas prácticas */}
      <ExpandableSection title="Buenas prácticas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUENAS_PRACTICAS.map(({ titulo, detalle }, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500 shrink-0" />
                {titulo}
              </p>
              <p className="text-xs text-slate-600 pl-5">{detalle}</p>
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Preguntas frecuentes */}
      <ExpandableSection title="Preguntas frecuentes">
        <div className="space-y-2">
          {[
            { q: "¿Puedo usar la app sin internet?", a: "Sí. Los datos se guardan localmente en el navegador. Si tienes Supabase configurado, se sincronizará automáticamente cuando vuelva la conexión." },
            { q: "¿Cómo agrego un nuevo responsable?", a: "Ve a Contactos → Agregar nuevo. El responsable debe estar activo para aparecer en los formularios de otros módulos." },
            { q: "¿Qué pasa si borro un registro por error?", a: "Antes de cualquier eliminación se crea un respaldo automático. Ve a Configuración → Respaldos locales y restaura el más reciente." },
            { q: "¿La app se puede usar desde el celular?", a: "Sí, la interfaz es responsiva. Funciona en móvil aunque está optimizada para escritorio." },
            { q: "¿Cómo comparto datos con mi equipo?", a: "Con Supabase activo, ve a Admin → Trabajo en equipo y comparte el código de invitación. Todos los miembros ven y editan los mismos datos en tiempo real." },
            { q: "¿Cada cuánto debo respaldar?", a: "Mínimo una vez por semana. El viernes es el momento ideal: justo antes de terminar la jornada." },
          ].map(({ q, a }, i) => (
            <details key={i} className="bg-white border border-slate-200 rounded-xl group">
              <summary className="px-5 py-3 text-sm font-medium text-slate-700 cursor-pointer select-none hover:bg-slate-50 rounded-xl flex items-center gap-2">
                <HelpCircle size={14} className="shrink-0 text-indigo-400" />
                {q}
              </summary>
              <p className="px-5 pb-4 pt-1 text-sm text-slate-600 border-t border-slate-100">{a}</p>
            </details>
          ))}
        </div>
      </ExpandableSection>

      {/* Acciones */}
      <div className="flex gap-3 flex-wrap pt-2">
        <button
          onClick={handleCopyGuia}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <ClipboardList size={15} />
          Copiar guía completa
        </button>
        <button
          onClick={handleDescargarGuia}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Download size={15} />
          Descargar .txt
        </button>
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info size={14} className="shrink-0 text-blue-500 mt-0.5" />
        <p className="text-xs text-blue-700">
          Esta guía refleja el flujo recomendado para el equipo de RH. Si hay dudas sobre el proceso de un módulo específico, consulta primero aquí antes de escalar.
        </p>
      </div>
    </div>
  );
}

export default memo(ModuloGuia);
