import { memo } from "react"

const StatCard = memo(({ label, value }) => (
  <div className="bg-white/20 px-4 sm:px-5 py-3 rounded-xl backdrop-blur-sm border border-white/30">
    <div className="text-sm text-white/90">{label}</div>
    <div className="text-xl sm:text-2xl font-bold">{value}</div>
  </div>
))

StatCard.displayName = "StatCard"

export default function StatsCards({ total, completed, pending }) {
  return (
    <div className="mt-4 sm:mt-5 flex flex-wrap gap-3">
      <StatCard label="Tổng số bài" value={total} />
      <StatCard label="Đã hoàn thành" value={completed} />
      <StatCard label="Chưa làm" value={pending} />
    </div>
  )
}
