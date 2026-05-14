
export function SkeletonLoader({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return (
    <div className={`${width} ${height} bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg animate-pulse`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
      <SkeletonLoader height="h-6" width="w-2/3" />
      <div className="space-y-2">
        <SkeletonLoader height="h-4" />
        <SkeletonLoader height="h-4" width="w-5/6" />
      </div>
      <div className="flex gap-3 pt-2">
        <SkeletonLoader height="h-8" width="w-20" />
        <SkeletonLoader height="h-8" width="w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-white border border-slate-200 rounded-lg">
          <SkeletonLoader height="h-4" width="w-1/4" />
          <SkeletonLoader height="h-4" width="w-1/3" />
          <SkeletonLoader height="h-4" width="w-1/5" />
        </div>
      ))}
    </div>
  );
}
