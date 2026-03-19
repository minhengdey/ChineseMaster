import { formatDate } from "./utils"
import UserTable from "./UserTable"

const WeeklyTableView = ({ week }) => {
  if (!week) return null

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-800 flex items-center gap-2">
            <span>📅</span>
            BXH từ {formatDate(week.weekStart)} đến {formatDate(week.weekEnd)}
          </div>
          <span className="text-sm font-medium text-violet-700 bg-violet-100 px-3 py-1 rounded-xl">{week.rows?.length || 0} học viên</span>
        </div>
      </div>
      <div className="p-4">
        <UserTable
          maxHeight="720px"
          rows={(week.rows || []).map((r, idx) => ({ ...r, rank: idx + 1 }))}
          columns={[
            {
              key: "rank",
              title: "Hạng",
              headClassName: "w-16 text-center",
              className: "text-center font-bold text-blue-600",
              render: (r) => (
                <div className="flex items-center justify-center">
                  {r.rank <= 3 ? (
                    <span className="text-2xl">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span>
                  ) : (
                    <span className="font-bold">{r.rank}</span>
                  )}
                </div>
              ),
            },
            {
              key: "name",
              title: "Học viên",
              render: (r) => (
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">{r.name || r.userId}</span>
                  {r.email && <span className="text-xs text-slate-500 mt-0.5">{r.email}</span>}
                </div>
              ),
            },
            {
              key: "attempts",
              title: "Số lượt",
              className: "font-medium text-slate-700",
              render: (r) => <span>{r.attempts ?? r.completionCount ?? "-"}</span>,
            },
            {
              key: "bestScore",
              title: "Cao nhất",
              render: (r) => {
                const v = r.bestScore
                if (v == null || v === "") return <span className="text-slate-400">-</span>
                const n = Number(v)
                return <span className="font-semibold text-emerald-600">{Number.isFinite(n) ? `${n}%` : "-"}</span>
              },
            },
            {
              key: "avgScore",
              title: "Điểm TB",
              render: (r) => {
                const v = r.avgScore
                if (v == null || v === "") return <span className="text-slate-400">-</span>
                const n = Number(v)
                return <span className="font-semibold text-blue-600">{Number.isFinite(n) ? `${n}%` : "-"}</span>
              },
            },
          ]}
        />
      </div>
    </div>
  )
}

export default WeeklyTableView
