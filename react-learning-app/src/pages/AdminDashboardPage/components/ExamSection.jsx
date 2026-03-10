import SectionCard from "./SectionCard"
import UserTable from "./UserTable"

const EXAM_COLUMNS = [
  {
    key: "rank",
    title: "Hạng",
    headClassName: "w-16 text-center",
    className: "text-center font-bold text-purple-600",
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
        <span className="font-semibold text-slate-900">{r.name || `User #${r.userId}`}</span>
        {r.email && <span className="text-xs text-slate-500 mt-0.5">{r.email}</span>}
      </div>
    ),
  },
  {
    key: "initialScore",
    title: "Thanh mẫu",
    render: (r) => <span className="font-semibold text-blue-600">{r.initialScore != null ? `${r.initialScore}` : "-"}</span>,
  },
  {
    key: "finalScore",
    title: "Vận mẫu",
    render: (r) => <span className="font-semibold text-indigo-600">{r.finalScore != null ? `${r.finalScore}` : "-"}</span>,
  },
  {
    key: "toneScore",
    title: "Thanh điệu",
    render: (r) => <span className="font-semibold text-cyan-600">{r.toneScore != null ? `${r.toneScore}` : "-"}</span>,
  },
  {
    key: "sentenceScore",
    title: "Câu",
    render: (r) => <span className="font-semibold text-teal-600">{r.sentenceScore != null ? `${r.sentenceScore}` : "-"}</span>,
  },
  {
    key: "totalScore",
    title: "Điểm tổng",
    render: (r) => <span className="font-bold text-purple-600 text-base">{r.totalScore != null ? `${r.totalScore}` : "-"}</span>,
  },
]

const ExamSection = ({ exams, loading }) => (
  <SectionCard title="BXH bài kiểm tra">
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          <span className="ml-3 text-slate-600">Đang tải...</span>
        </div>
      )}
      {!loading && exams.length === 0 && (
        <div className="text-center p-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
          <div className="text-purple-300 text-5xl mb-4">📝</div>
          <p className="text-slate-600 font-medium">Chưa có dữ liệu bài kiểm tra</p>
        </div>
      )}
      {!loading && exams.map((exam) => (
        <div key={exam.testId ?? exam.examId} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <span>📝</span>
                {exam.title ?? exam.examTitle ?? `Bài kiểm tra #${exam.testId ?? exam.examId}`}
              </div>
              <div className="text-sm text-slate-600 font-medium">{exam.rows?.length || 0} học viên</div>
            </div>
          </div>
          <div className="p-4">
            <UserTable
              rows={(exam.rows || []).map((r, idx) => ({ ...r, rank: idx + 1 }))}
              columns={EXAM_COLUMNS}
            />
          </div>
        </div>
      ))}
    </div>
  </SectionCard>
)

export default ExamSection
