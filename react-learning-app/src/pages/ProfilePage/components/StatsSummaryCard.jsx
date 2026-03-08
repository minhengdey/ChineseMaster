import { BarChart3, BookOpen, BookMarked, Mic } from "lucide-react"

const StatsSummaryCard = ({ summary }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
    <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/80">
      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
        <BarChart3 className="w-5 h-5 text-pink-600" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-slate-800">Thống kê học tập</h2>
    </div>
    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-pink-600" aria-hidden />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-violet-700">{summary?.lessonsCompleted ?? 0}</div>
          <div className="text-xs font-semibold text-pink-600 mt-1 uppercase tracking-wide">Bài học hoàn thành</div>
        </div>
        <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-violet-50 p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-blue-100 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-blue-600" aria-hidden />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{summary?.wordsLearned ?? 0}</div>
          <div className="text-xs font-semibold text-blue-600 mt-1 uppercase tracking-wide">Từ vựng đã học</div>
        </div>
        <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Mic className="w-5 h-5 text-cyan-600" aria-hidden />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-cyan-700">{summary?.hskkCount ?? 0}</div>
          <div className="text-xs font-semibold text-cyan-600 mt-1 uppercase tracking-wide">HSKK đã làm</div>
        </div>
      </div>
    </div>
  </div>
)

export default StatsSummaryCard
