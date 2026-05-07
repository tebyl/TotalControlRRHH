import React, { useState } from "react";
import { isTableRowClosed } from "../../domain/status";

type Column = { key: string; label: string; render?: (row: any) => React.ReactNode };

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function EmptyTableState({ message = "Sin registros", hint }: { message?: string; hint?: string }) {
  return (
    <tr>
      <td colSpan={999}>
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="text-4xl mb-3 opacity-40">📋</div>
          <p className="text-sm font-medium text-slate-500 mb-1">{message}</p>
          {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
      </td>
    </tr>
  );
}

export function DataTable({
  columns,
  rows,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkClosed,
  closedState,
  emptyMessage,
  emptyHint,
  pageSize: defaultPageSize = 25,
}: {
  columns: Column[];
  rows: any[];
  onEdit: (row: any) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (row: any) => void;
  onMarkClosed?: (id: string) => void;
  closedState?: string;
  emptyMessage?: string;
  emptyHint?: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  // Clamp page if rows shrink (filter applied) without using an effect
  const safePageNum = Math.min(page, totalPages);
  const pageRows = rows.slice((safePageNum - 1) * size, safePageNum * size);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(c => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-[200px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyTableState
                message={emptyMessage || "Aún no hay registros en este módulo"}
                hint={emptyHint || "Usa el botón «Agregar nuevo» para crear el primero."}
              />
            ) : (
              pageRows.map((row: any, i: number) => {
                const isClosed = closedState ? isTableRowClosed(row, closedState) : false;
                return (
                  <tr
                    key={row.id || i}
                    className={`border-t border-slate-100 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    } hover:bg-blue-50/50 ${isClosed ? "opacity-60" : ""}`}
                  >
                    {columns.map(c => (
                      <td key={c.key} className="px-4 py-3 max-w-[220px]">
                        <div className="truncate">
                          {c.render ? c.render(row) : (row as any)[c.key] ?? "—"}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => onEdit(row)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                          aria-label="Editar"
                        >
                          Editar
                        </button>
                        {onMarkClosed && closedState && !isClosed && (
                          <button
                            onClick={() => onMarkClosed(row.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            aria-label="Cerrar registro"
                          >
                            Cerrar
                          </button>
                        )}
                        {onDuplicate && (
                          <button
                            onClick={() => onDuplicate(row)}
                            className="px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-lg border border-violet-100 hover:bg-violet-100 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-300"
                            aria-label="Duplicar"
                          >
                            Duplicar
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(row.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                          aria-label="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar — only show if more than one page or more rows than minimum page size */}
      {rows.length > PAGE_SIZE_OPTIONS[0] && (
        <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Filas por página:</span>
            <select
              value={size}
              onChange={e => { setSize(Number(e.target.value)); setPage(1); }}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>{((safePageNum - 1) * size) + 1}–{Math.min(safePageNum * size, rows.length)} de {rows.length}</span>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePageNum === 1}
              className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed ml-2"
              aria-label="Página anterior"
            >‹</button>
            <span className="px-1">{safePageNum} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePageNum === totalPages}
              className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página siguiente"
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
}
