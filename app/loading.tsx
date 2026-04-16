import SkeletonCard from '@/components/SkeletonCard'

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* page header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-64 mt-2" />
        <div className="h-px bg-slate-200 mt-4" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* chart */}
      <div className="bg-white rounded-xl border border-slate-200 h-64" />

      {/* leading indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
