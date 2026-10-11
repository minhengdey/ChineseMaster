import { formatDate } from "./utils"
import UserTable from "./UserTable"

const WeeklyTableView = ({ week }) => {
  if (!week) return null

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-800 flex items-center gap-2">
            <span>📅</span>
            BXH từ {formatDate(week.weekStart)} đến {formatDate(week.weekEnd)}
          </div>
          <div className="text-sm text-slate-600 font-medium">{week.rows?.length || 0} học viên</div>
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
