import React, { useEffect, useState } from "react";
import { INPUT_BASE } from "../components/forms/fields";

export function SemaforoItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-[#D9E2EC]">
      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm text-slate-600">{label}: <strong className="text-slate-800">{count}</strong></span>
    </div>
  );
}

export function FilterBar({ filters, searchPlaceholder, search, setSearch }: { filters: React.ReactNode; searchPlaceholder: string; search: string; setSearch: (v: string) => void }) {
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  };

  const handleClear = () => { setLocalSearch(""); setSearch(""); };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Filtros</div>
      <div className="flex flex-wrap gap-3 items-center">
        {filters}
        <div className="flex-1 min-w-[200px]">
          <input type="text" placeholder={searchPlaceholder} value={localSearch} onChange={e => handleChange(e.target.value)} className={INPUT_BASE} />
        </div>
        {(localSearch || search) && (
          <button onClick={handleClear} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Limpiar filtros</button>
        )}
      </div>
    </div>
  );
}
