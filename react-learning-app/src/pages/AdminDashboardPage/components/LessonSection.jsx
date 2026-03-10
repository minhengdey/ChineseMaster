import SectionCard from "./SectionCard"
import LessonTableView from "./LessonTableView"

const LessonSection = ({ lessons, activeLesson, onLessonChange, loading }) => (
  <SectionCard title="BXH theo bài">
    {loading ? (
      <div className="flex items-center justify-center p-10 gap-3">
        <span className="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />
        <span className="text-slate-600 font-medium">Đang tải...</span>
      </div>
    ) : lessons.length === 0 ? (
      <div className="text-center p-10 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="text-slate-400 text-4xl mb-3">📚</div>
        <p className="text-slate-600 font-medium">Chưa có dữ liệu BXH theo bài</p>
      </div>
    ) : (
      <div className="space-y-5">
        <div className="rounded-xl bg-violet-50/80 border border-violet-100 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Chọn bài học</label>
          <select
            className="w-full max-w-md px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white font-medium"
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
