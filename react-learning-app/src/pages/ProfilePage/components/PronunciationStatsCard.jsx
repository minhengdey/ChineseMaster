import { Volume2, BookOpen, BarChart3 } from "lucide-react"

const PronunciationStatsCard = ({ todayStat, lessonRows, testRows, statsLoading }) => (
  <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden card-hover">
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-slate-200 flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Volume2 size={28} className="text-purple-600" />
        <h2 className="text-2xl font-bold gradient-text">Đánh giá phát âm</h2>
      </div>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
            <div className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
              <BookOpen size={20} />
              Điểm ngày (Hôm nay)
            </div>
            {statsLoading ? (
              <div className="text-sm text-slate-500">Đang tải...</div>
            ) : !todayStat ? (
              <div className="text-sm text-slate-500">Chưa có lượt hôm nay</div>
            ) : (
              <div>
                <div className="flex justify-between text-sm py-3 border-b border-slate-200 last:border-0">
                  <div className="text-slate-600 font-medium">{todayStat.date}</div>
                  <div className="font-bold text-purple-600 text-lg">{todayStat.avgScore}%</div>
                </div>
                <div className="text-xs text-slate-500 mt-4 font-semibold">Số lượt: {todayStat.count ?? 0}</div>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50">
                  <th className="text-left py-3 px-3 font-bold text-slate-700">Bài</th>
                  <th className="text-left py-3 px-3 font-bold text-slate-700">Điểm từ</th>
                  <th className="text-left py-3 px-3 font-bold text-slate-700">Điểm câu</th>
                  <th className="text-left py-3 px-3 font-bold text-slate-700">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {statsLoading ? (
                  <tr>
                    <td colSpan={4} className="text-sm text-slate-500 py-4 text-center">Đang tải...</td>
                  </tr>
                ) : lessonRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-sm text-slate-500 py-4 text-center">Không có dữ liệu</td>
                  </tr>
                ) : (
                  lessonRows.map((r) => (
                    <tr key={r.lessonId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{r.lessonId}</td>
                      <td className="py-3 px-3 text-slate-600 font-semibold">
                        {r.avgWordScore != null ? `${r.avgWordScore}%` : r.avgScore != null ? `${Math.round(r.avgScore)}%` : "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-semibold">
                        {r.avgSentenceScore != null ? `${r.avgSentenceScore}%` : r.avgScore != null ? `${Math.round(r.avgScore)}%` : "—"}
                      </td>
                      <td className="py-3 px-3">
                        {r.completedFull ? <span className="text-green-600 font-bold text-lg">✔</span> : <span className="text-red-600 font-bold text-lg">✘</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-8 pt-8 border-t-2 border-slate-200">
            <div className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
              <BarChart3 size={20} />
              Điểm test (Tổng quan)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50">
                    <th className="text-left py-3 px-3 font-bold text-slate-700">Test ID</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700">Trung bình</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700">Số lần</th>
                  </tr>
                </thead>
                <tbody>
                  {statsLoading ? (
                    <tr>
                      <td colSpan={3} className="text-sm text-slate-500 py-4 text-center">Đang tải...</td>
                    </tr>
                  ) : testRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-sm text-slate-500 py-4 text-center">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    testRows.map((r) => (
                      <tr key={r.testId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{r.testId}</td>
                        <td className="py-3 px-3 text-slate-600 font-semibold">{r.avgTotal}</td>
                        <td className="py-3 px-3 text-slate-600 font-semibold">{r.attempts}</td>
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
