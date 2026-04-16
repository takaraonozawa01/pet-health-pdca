import SkeletonCard from '@/components/SkeletonCard'

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-slate-200 rounded w-56 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-72 mt-2" />
        <div className="h-px bg-slate-200 mt-4" />
      </div>

      {/* gauge cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* trend chart */}
      <div className="bg-white rounded-xl border border-slate-200 h-72" />

      {/* cohort chart */}
      <div className="bg-white rounded-xl border border-slate-200 h-56" />
    </div>
  )
}
