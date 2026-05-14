import React from "react";
import { cn } from "../../utils/cn";

export const INPUT_BASE = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors";

export function Field({
  label,
  children,
  error,
  required,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className={error ? "[&>input]:border-red-300 [&>select]:border-red-300 [&>textarea]:border-red-300" : ""}>{children}</div>
      {error && <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(INPUT_BASE, className)} />;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={cn(INPUT_BASE, className)}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(INPUT_BASE, "resize-y", className)} rows={props.rows ?? 3} />;
}
