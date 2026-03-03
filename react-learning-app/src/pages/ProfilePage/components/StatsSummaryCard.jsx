import { BarChart3 } from "lucide-react"

const StatsSummaryCard = ({ summary }) => (
  <div className="card overflow-hidden card-hover">
    <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center gap-3">
      <BarChart3 size={28} className="text-purple-600" />
      <h2 className="text-2xl font-bold gradient-text">Thống kê học tập</h2>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">Bài Học</div>
          <div className="text-4xl font-bold text-purple-600">{summary?.lessonsCompleted ?? 0}</div>
          <div className="text-xs text-purple-600 mt-2 font-semibold">Đã hoàn thành</div>
        </div>
        <div className="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">Từ Vựng</div>
          <div className="text-4xl font-bold text-blue-600">{summary?.wordsLearned ?? 0}</div>
          <div className="text-xs text-blue-600 mt-2 font-semibold">Đã học</div>
        </div>
        <div className="card p-6 text-center bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <div className="text-sm font-bold text-cyan-700 mb-2 uppercase tracking-wide">HSKK Sơ Cấp</div>
          <div className="text-4xl font-bold text-cyan-600">{summary?.hskkCount ?? 0}</div>
          <div className="text-xs text-cyan-600 mt-2 font-semibold">Đã làm</div>
        </div>
      </div>
    </div>
  </div>
)

export default StatsSummaryCard
