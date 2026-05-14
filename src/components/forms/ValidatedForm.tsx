import React, { ReactNode } from "react";

interface ValidatedInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  warning?: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "number" | "password" | "tel";
  onBlur?: () => void;
  disabled?: boolean;
  hint?: string;
}

export function ValidatedInput({
  label,
  value,
  onChange,
  error,
  warning,
  required,
  placeholder,
  type = "text",
  onBlur,
  disabled,
  hint,
}: ValidatedInputProps) {
  const hasError = !!error;
  const hasWarning = !!warning && !hasError;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {hasWarning && <span className="text-xs text-amber-600">⚠️</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border transition-all ${
          hasError
            ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
            : hasWarning
              ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
              : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        } text-sm disabled:bg-slate-100 disabled:text-slate-500`}
      />
      {hint && !hasError && !hasWarning && <p className="text-xs text-slate-500">{hint}</p>}
      {hasError && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {hasWarning && <p className="text-xs text-amber-700">{warning}</p>}
    </div>
  );
}

interface SmartFormProps {
  title: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  submitLoading?: boolean;
  submitDisabled?: boolean;
  onCancel?: () => void;
}

export function SmartForm({
  title,
  children,
  onSubmit,
  submitLabel = "Guardar",
  submitLoading,
  submitDisabled,
  onCancel,
}: SmartFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="space-y-4">{children}</div>

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitDisabled || submitLoading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

interface FormStepProps {
  number: number;
  title: string;
  completed?: boolean;
  current?: boolean;
  children?: ReactNode;
}

export function FormSteps({
  steps,
  currentStep,
}: {
  steps: FormStepProps[];
  currentStep: number;
}) {
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <React.Fragment key={step.number}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                step.completed
                  ? "bg-emerald-100 text-emerald-700"
                  : step.current
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {step.completed ? "✓" : step.number}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                  step.completed ? "bg-emerald-300" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current step title */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          {steps[currentStep - 1]?.title}
        </h3>
      </div>

      {/* Step content */}
      <div className="animate-in fade-in slide-in-from-bottom duration-300">
        {steps[currentStep - 1]?.children}
      </div>
    </div>
  );
}
