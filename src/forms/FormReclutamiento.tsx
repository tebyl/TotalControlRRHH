import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { DateInput } from "../components/forms/DateInput";
import { ExpandableSection } from "../components/ui";
import { notifyValidationError, FormMessages, SelectContact } from "../shared/formHelpers";
import { calcReclutamientoAvance } from "../shared/reclutamientoHelpers";
import type { VError } from "../shared/formTypes";
import type { ProcesoReclutamiento } from "../domain/types";
import {
  BLOQUEOS, ESTADOS_PROCESO_RECLUTAMIENTO, MESES, OPTS_CARTA_OFERTA, OPTS_ENTREVISTA,
  OPTS_ENVIO_CARTA, OPTS_PROCESO_BUK, OPTS_REVISADO_PPTO, OPTS_SELECCION_CV,
  OPTS_SI_NO, OPTS_TEST, PLANTAS_CENTROS, PRIORIDADES, TIPOS_RECLUTAMIENTO, TIPOS_VACANTE,
} from "../domain/options";

export function FormReclutamiento({ data, editItem, closeModal, saveItem }: any) {
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
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
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

      <ExpandableSection title="📋 Flujo del proceso" defaultOpen={pct > 0}>
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
      </ExpandableSection>

      <ExpandableSection title="🎯 Seguimiento interno" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Prioridad"><Select value={form.prioridad} onChange={(v: string) => set("prioridad", v)} options={PRIORIDADES} /></Field>
          <Field label="Bloqueado por" error={vErr.bloqueadoPor}><Select value={form.bloqueadoPor} onChange={(v: string) => set("bloqueadoPor", v)} options={BLOQUEOS} /></Field>
          <Field label="Próxima acción"><Input value={form.proximaAccion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("proximaAccion", e.target.value)} /></Field>
          <Field label="Fecha próxima acción" error={vErr.fechaProximaAccion}><DateInput value={form.fechaProximaAccion} onChange={(v: string) => set("fechaProximaAccion", v)} /></Field>
          <Field label="Observaciones" error={vErr.observaciones}><Textarea value={form.observaciones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("observaciones", e.target.value)} /></Field>
        </div>
      </ExpandableSection>

      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
