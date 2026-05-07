import { useState } from "react";
import { formatDateCL, isValidDateCL, parseDateCL } from "../../domain/dates";

type DateInputProps = {
  value: string;
  onChange: (isoValue: string) => void;
  placeholder?: string;
};

export function DateInput({ value, onChange, placeholder = "dd/mm/yyyy" }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(formatDateCL(value));
  const [errorMsg, setErrorMsg] = useState("");
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setDisplayValue(formatDateCL(value));
    setErrorMsg("");
  }

  return (
    <div className="w-full">
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        className={`border ${errorMsg ? "border-red-400 focus:ring-red-100 focus:border-red-400" : "border-slate-300 focus:ring-blue-500 focus:border-transparent"} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white w-full font-sans text-slate-800`}
        inputMode="numeric"
        maxLength={10}
        onChange={(e) => {
          let v = e.target.value.replace(/[^\d]/g, "");

          if (v.length >= 5) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
          } else if (v.length >= 3) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
          }

          setDisplayValue(v);
          setErrorMsg("");

          if (/^\d{2}\/\d{2}\/\d{4}$/.test(v) && isValidDateCL(v)) {
            onChange(parseDateCL(v));
          } else if (v === "") {
            onChange("");
          }
        }}
        onBlur={() => {
          if (displayValue && (!/^\d{2}\/\d{2}\/\d{4}$/.test(displayValue) || !isValidDateCL(displayValue))) {
            setErrorMsg("Formato de fecha inválido. Usa dd/mm/aaaa.");
          } else {
            setErrorMsg("");
          }
        }}
      />
      {errorMsg && <p className="text-[11px] text-red-500 mt-1">{errorMsg}</p>}
    </div>
  );
}
