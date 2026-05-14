export type VError = Record<string, string>;
export type ToastType = "success" | "error" | "warning" | "info";
export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
};
export type ConfirmState = {
  title: string;
  message?: string;
  onConfirm: () => void;
  variant?: "default" | "danger" | "warning";
  confirmLabel?: string;
  cancelLabel?: string;
};
