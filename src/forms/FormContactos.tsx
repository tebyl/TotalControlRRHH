import { useState } from "react";
import { useForm } from "../hooks/useForm";
import { Field, Input, Select, Textarea } from "../components/forms/fields";
import { ValidatedInput } from "../components/forms/ValidatedForm";
import { notifyValidationError, FormMessages, isValidEmail, isValidPhone } from "../shared/formHelpers";
import type { VError } from "../shared/formTypes";
import { RELACIONES } from "../domain/options";

export function FormContactos({ data, editItem, closeModal, saveItem }: any) {
  const { form, set } = useForm({ nombre: "", rol: "", areaEmpresa: "", correo: "", telefono: "", relacion: "Interno", activo: "Sí", observaciones: "" }, editItem);
  const [vErr, setVErr] = useState<VError>({});
  const [vWarn, setVWarn] = useState<string[]>([]);
  const [fieldWarn, setFieldWarn] = useState<Record<string, string>>({});
  const save = () => {
    const errors: VError = {};
    const warnings: string[] = [];
    const fieldWarnings: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    const norm = form.nombre.trim().toLowerCase().replace(/\s+/g, " ");
    const dup = data.contactos.find((c: any) => c.nombre.trim().toLowerCase().replace(/\s+/g, " ") === norm && (!editItem || c.id !== editItem.id));
    if (dup) warnings.push(`Ya existe un contacto llamado "${dup.nombre}". ¿Estás segura de que no es duplicado?`);
    const email = form.correo.trim();
    if (email && !isValidEmail(email)) {
      if (editItem) fieldWarnings.correo = "Formato de correo poco usual.";
      else errors.correo = "El correo no tiene un formato válido.";
    }
    const telefono = form.telefono.trim();
    if (telefono && !isValidPhone(telefono)) {
      if (editItem) fieldWarnings.telefono = "Formato de teléfono poco usual.";
      else errors.telefono = "El teléfono no tiene un formato válido.";
    }
    setVErr(errors); setVWarn(warnings);
    setFieldWarn(fieldWarnings);
    if (Object.keys(errors).length > 0) { notifyValidationError(); return; }
    saveItem("contactos", form);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Nombre" required error={vErr.nombre}><Input value={form.nombre} onChange={e => set("nombre", e.target.value)} /></Field>
      <Field label="Rol"><Input value={form.rol} onChange={e => set("rol", e.target.value)} /></Field>
      <Field label="Área / Empresa"><Input value={form.areaEmpresa} onChange={e => set("areaEmpresa", e.target.value)} /></Field>
      <ValidatedInput label="Correo" type="email" value={form.correo} onChange={(v) => set("correo", v)} error={vErr.correo} warning={fieldWarn.correo} hint="Ej: nombre@empresa.cl" />
      <ValidatedInput label="Teléfono" value={form.telefono} onChange={(v) => set("telefono", v)} error={vErr.telefono} warning={fieldWarn.telefono} hint="Ej: +56912345678" />
      <Field label="Relación"><Select value={form.relacion} onChange={v => set("relacion", v)} options={RELACIONES} /></Field>
      <Field label="Activo">
        <select value={form.activo} onChange={e => set("activo", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="Sí">Sí</option><option value="No">No</option>
        </select>
      </Field>
      <Field label="Observaciones"><Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} /></Field>
      <FormMessages errors={vErr} warnings={vWarn} />
      <div className="md:col-span-2 flex gap-3 justify-end pt-2">
        <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar</button>
      </div>
    </div>
  );
}
