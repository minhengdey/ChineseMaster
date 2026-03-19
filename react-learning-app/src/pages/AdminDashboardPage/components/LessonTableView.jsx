import UserTable from "./UserTable"

const LessonTableView = ({ lessons, activeLesson }) => {
  const activeLessonData = lessons.find((l) => l.lessonId === activeLesson)
  if (!activeLessonData) return null

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-800 flex items-center gap-2">
            <span>📖</span>
            Bài {activeLessonData.lessonId} — {activeLessonData.lessonTitle}
          </div>
          <span className="text-sm font-medium text-violet-700 bg-violet-100 px-3 py-1 rounded-xl">{activeLessonData.rows?.length || 0} học viên</span>
        </div>
      </div>
      <div className="p-4">
        <UserTable
          maxHeight="600px"
          rows={(activeLessonData.rows || []).map((r, idx) => ({ ...r, rank: idx + 1 }))}
          columns={[
            { key: "rank", title: "Hạng", headClassName: "w-16 text-center", className: "text-center font-bold text-pink-600", render: (r) => (<div className="flex items-center justify-center">{r.rank <= 3 ? <span className="text-2xl">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span> : <span className="font-bold">{r.rank}</span>}</div>) },
            { key: "name", title: "Học viên", render: (r) => <span className="font-semibold text-slate-900">{r.name || r.userId}</span> },
            { key: "attempts", title: "Số lượt", className: "font-medium text-slate-700" },
            { key: "bestScore", title: "Cao nhất", render: (r) => <span className="font-semibold text-emerald-600">{r.bestScore}%</span> },
            { key: "avgScore", title: "Điểm TB", render: (r) => <span className="font-semibold text-pink-600">{r.avgScore}%</span> },
          ]}
        />
      </div>
    </div>
  )
}

export default LessonTableView
