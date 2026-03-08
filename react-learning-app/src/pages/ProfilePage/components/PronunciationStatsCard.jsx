import { Volume2, BookOpen, BarChart3, CheckCircle, XCircle } from "lucide-react"

const PronunciationStatsCard = ({ todayStat, lessonRows, testRows, statsLoading }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
    <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/80">
      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
        <Volume2 className="w-5 h-5 text-pink-600" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-slate-800">Đánh giá phát âm</h2>
    </div>
    <div className="p-5 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
          <div className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5 text-pink-600" aria-hidden />
            Điểm hôm nay
          </div>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />
              Đang tải...
            </div>
          ) : !todayStat ? (
            <p className="text-sm text-slate-500">Chưa có lượt luyện hôm nay</p>
          ) : (
            <div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-sm text-slate-600 font-medium">{todayStat.date}</span>
                <span className="font-bold text-pink-600 text-lg">{todayStat.avgScore ?? 0}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">Số lượt: {todayStat.count ?? 0}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm">
              Điểm theo bài học
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Bài</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Điểm từ</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Điểm câu</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {statsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                        <span className="inline-block w-5 h-5 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin align-middle mr-2" />
                        Đang tải...
                      </td>
                    </tr>
                  ) : lessonRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">Chưa có dữ liệu</td>
                    </tr>
                  ) : (
                    lessonRows.map((r) => (
                      <tr key={r.lessonId} className="border-b border-slate-100 hover:bg-violet-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">{r.lessonId}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {r.avgWordScore != null ? `${r.avgWordScore}%` : r.avgScore != null ? `${Math.round(r.avgScore)}%` : "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {r.avgSentenceScore != null ? `${r.avgSentenceScore}%` : r.avgScore != null ? `${Math.round(r.avgScore)}%` : "—"}
                        </td>
                        <td className="py-3 px-4">
                          {r.completedFull ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 inline" aria-hidden />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-300 inline" aria-hidden />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-600" aria-hidden />
              Điểm bài kiểm tra
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Bài test</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Điểm TB</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Số lần</th>
                  </tr>
                </thead>
                <tbody>
                  {statsLoading ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">Đang tải...</td>
                    </tr>
                  ) : testRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">Chưa có dữ liệu</td>
                    </tr>
                  ) : (
                    testRows.map((r) => (
                      <tr key={r.testId} className="border-b border-slate-100 hover:bg-violet-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">{r.testId}</td>
                        <td className="py-3 px-4 text-slate-600">{r.avgTotal ?? "—"}</td>
                        <td className="py-3 px-4 text-slate-600">{r.attempts ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default PronunciationStatsCard
