import { useState } from "react";
import type React from "react";
import type { AppData, Contacto, ModuloKey } from "../domain/types";
import { MESES } from "../domain/options";
import type { ConfirmState, ToastType } from "../shared/formTypes";
import { duplicateRecord, genId, hoy, markRecordClosed } from "../utils/appHelpers";
import { logAudit } from "../audit/auditService";

type ToastShow = (
  title: string,
  options?: {
    type?: ToastType;
    message?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
  }
) => void;

type UseModalsParams = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  setActiveModulo: (modulo: ModuloKey) => void;
  runBackupAndToast: (motivo: string) => void;
  toastShow: ToastShow;
};

export function useModals({ data, setData, setActiveModulo, runBackupAndToast, toastShow }: UseModalsParams) {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [modalModulo, setModalModulo] = useState<string>("");
  const [editItem, setEditItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  const modalConfig = { modulo: modalModulo, editItem };

  const openNew = (modulo: string) => { setModalModulo(modulo); setEditItem(null); setModalOpen(true); };
  const openEdit = (modulo: string, item: any) => { setModalModulo(modulo); setEditItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); };
  const openCapture = () => setCaptureOpen(true);

  const handleModalSave = (modulo: string, item: any) => {
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

  const deleteItem = (modulo: string, id: string) => {
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

    type CapturaTarget = { modulo: ModuloKey; dataKey: keyof AppData };
    let target: CapturaTarget = { modulo: "cursos", dataKey: "cursos" };
    let newItem: any = {};

    switch (capture.tipo) {
      case "Curso":
        target = { modulo: "cursos", dataKey: "cursos" };
        newItem = { ...baseFields, curso: capture.nombre, origen: "Urgente no planificado", area: "", solicitante: "", fechaSolicitud: today, fechaRequerida: capture.fechaProximaAccion || "", estado: "Pendiente revisar", nivelCritico: "Medio", requiereOC: "No", numeroOC: "", proveedor: "", montoEstimado: 0 };
        break;
      case "OC":
        target = { modulo: "ocs", dataKey: "ocs" };
        newItem = { ...baseFields, numeroOC: capture.nombre, categoriaOC: "", cursoAsociado: "", proveedor: "", monto: 0, fechaSolicitud: today, fechaLimite: capture.fechaProximaAccion || "", estadoOC: "Pendiente crear", accionPendiente: capture.proximaAccion };
        break;
      case "Practicante":
        target = { modulo: "practicantes", dataKey: "practicantes" };
        newItem = { ...baseFields, nombre: capture.nombre, area: "", especialidad: "", fechaInicio: "", fechaTermino: "", costoMensual: 0, estado: "Por buscar", proximoPaso: capture.proximaAccion };
        break;
      case "Diploma / Certificado / Licencia":
        target = { modulo: "diplomas", dataKey: "diplomas" };
        newItem = { ...baseFields, cursoAsociado: capture.nombre, participante: "", tipoDocumento: "Diploma", otec: "", etapa: "Pedir a la OTEC", fechaSolicitudOTEC: "", fechaRecepcionDoc: "", fechaEnvioParticipante: "", fechaSubidaBUK: "", estadoBUK: "Pendiente subir" };
        break;
      case "Evaluacion Psicolaboral":
      case "Evaluación Psicolaboral":
        target = { modulo: "evaluaciones", dataKey: "evaluacionesPsicolaborales" };
        newItem = { ...baseFields, mes: MESES[new Date().getMonth()], ano: new Date().getFullYear(), cargo: capture.nombre, area: "", candidato: "", rut: "", tipoEvaluacion: "Psicolaboral", proveedor: "", fechaSolicitud: today, fechaEvaluacion: "", fechaEntregaInforme: "", estado: "Pendiente solicitar", resultado: "Pendiente", costo: 0, requiereOC: "No", numeroOC: "" };
        break;
      case "Vale de Gas":
        target = { modulo: "valesGas", dataKey: "valesGas" };
        newItem = { ...baseFields, colaborador: capture.nombre, contactoId: "", area: "", periodo: "", fechaEntrega: today, totalValesAsignados: 0, valesUsados: 0, descuentoDiario: 0, diasDescuento: 0, totalDescontado: 0, saldoVales: 0, estado: "Pendiente entregar", fechaProximaRevision: capture.fechaProximaAccion || "" };
        break;
      case "Proceso Pendiente":
        target = { modulo: "procesos", dataKey: "procesos" };
        newItem = { ...baseFields, proceso: capture.nombre, tipo: "Otro", estadoActual: "Pendiente revisar", queFalta: capture.proximaAccion, fechaLimite: capture.fechaProximaAccion || "", riesgo: "" };
        break;
      case "Reclutamiento":
        target = { modulo: "reclutamiento", dataKey: "reclutamiento" };
        newItem = { ...baseFields, reclutamiento: "Por definir", plantaCentro: capture.nombre || "", tipoVacante: "Por definir", mesIngreso: new Date().toLocaleString("es-CL", { month: "long" }).replace(/^\w/, (c: string) => c.toUpperCase()), revisadoPPTO: "", procesoBuk: "", publicado: "", seleccionCV: "", cvSeleccionadoBuk: "", entrevistaJefatura: "", entrevistaGP: "", testPsicolaboral: "", testHogan: "", seleccionado: "", cartaOferta: "", envioCartaOferta: "", firmaCartaOferta: "", fechaIngreso: "", reclutador: "", proceso: "Abierto", proximaAccion: capture.proximaAccion || "", fechaProximaAccion: capture.fechaProximaAccion || "" };
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
      action: { label: "Ir al módulo", onClick: () => setActiveModulo(target.modulo) },
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
          if (idx >= 0) arr[idx] = markRecordClosed(modulo, arr[idx], closedState);
          (nd as any)[modulo] = arr;
          return nd;
        });
        toastShow("Estado actualizado", { type: "success" });
        setConfirm(null);
      },
    });
  };

  return {
    modalOpen, modalConfig, modalModulo, editItem, confirm, setConfirm,
    captureOpen, setCaptureOpen, openNew, openEdit, closeModal, openCapture,
    handleModalSave, saveItem: handleModalSave, deleteItem, duplicateItem, markClosed, saveCaptura,
  };
}
