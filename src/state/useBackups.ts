import { useState } from "react";
import type React from "react";
import type { AppData, BackupItem } from "../domain/types";
import type { ConfirmState, ToastType } from "../shared/formTypes";
import { createBackup, getLocalBackups, saveLocalBackups } from "../storage/backupStorage";

type ToastShow = (
  title: string,
  options?: {
    type?: ToastType;
    message?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
  }
) => void;

type UseBackupsParams = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  setConfirm?: React.Dispatch<React.SetStateAction<ConfirmState | null>>;
  toastShow: ToastShow;
};

export function useBackups({ data, setData, setConfirm, toastShow }: UseBackupsParams) {
  const [backups, setBackups] = useState<BackupItem[]>(() => getLocalBackups());
  const updateConfirm: React.Dispatch<React.SetStateAction<ConfirmState | null>> = setConfirm || (() => undefined);

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

  const handleRestaurarBackup = (backup: BackupItem) => {
    updateConfirm({
      title: "Restaurar respaldo",
      message: `¿Restaurar respaldo del ${new Date(backup.fecha).toLocaleString("es-CL")}? Se creará un respaldo de seguridad antes de restaurar.`,
      variant: "warning",
      confirmLabel: "Restaurar",
      onConfirm: () => {
        runBackupAndToast("antes de restaurar");
        if (backup.data && typeof backup.data === "object") {
          setData(backup.data);
          toastShow("Respaldo restaurado exitosamente", { type: "success" });
        } else {
          toastShow("Respaldo corrupto o inválido", { type: "error" });
        }
        updateConfirm(null);
      },
    });
  };

  const handleDescargarBackup = (backup: BackupItem) => {
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `respaldo_local_kata_${new Date(backup.fecha).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastShow("JSON de respaldo descargado", { type: "success" });
  };

  const handleEliminarBackup = (id: string) => {
    updateConfirm({
      title: "Eliminar respaldo",
      message: "¿Seguro que deseas eliminar este respaldo local de forma permanente?",
      variant: "danger",
      confirmLabel: "Eliminar",
      onConfirm: () => {
        const updated = backups.filter((b: BackupItem) => b.id !== id);
        saveLocalBackups(updated);
        setBackups(updated);
        toastShow("Respaldo eliminado", { type: "success" });
        updateConfirm(null);
      },
    });
  };

  const handleCrearBackupManual = () => {
    runBackupAndToast("manual");
    toastShow("Respaldo manual creado correctamente", { type: "success" });
  };

  return {
    backups,
    setBackups,
    runBackupAndToast,
    handleRestaurarBackup,
    handleDescargarBackup,
    handleEliminarBackup,
    handleCrearBackupManual,
    saveLocalBackups,
  };
}
