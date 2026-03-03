import SectionCard from "./SectionCard"
import LessonTableView from "./LessonTableView"

const LessonSection = ({ lessons, activeLesson, onLessonChange, loading }) => (
  <SectionCard title="BXH theo bài">
    {loading ? (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
        <span className="ml-3 text-slate-600">Đang tải...</span>
      </div>
    ) : lessons.length === 0 ? (
      <div className="text-center p-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
        <div className="text-purple-300 text-5xl mb-4">📚</div>
        <p className="text-slate-600 font-medium">Chưa có dữ liệu BXH theo bài</p>
      </div>
    ) : (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
          <label className="block text-sm font-medium text-slate-700 mb-3">Chọn bài học</label>
          <select
            className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
            value={activeLesson ?? ""}
            onChange={(e) => onLessonChange(Number(e.target.value))}
          >
            <option value="" disabled>-- Chọn bài học --</option>
            {lessons.map((l) => (
              <option key={l.lessonId} value={l.lessonId}>📖 Bài {l.lessonId} — {l.lessonTitle || "Không tiêu đề"}</option>
            ))}
          </select>
        </div>
        {activeLesson != null && <LessonTableView lessons={lessons} activeLesson={activeLesson} />}
      </div>
    )}
  </SectionCard>
)

export default LessonSection
