import { memo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui"
import { FileText } from "lucide-react"

const AssessmentCard = memo(function AssessmentCard({ assessment, onStart }) {
  const navigate = useNavigate()
  const handleClick = () => {
    if (assessment.completed) {
      navigate(`/assessment/${assessment.id}`)
    } else {
      onStart(assessment)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden hover:shadow-lg hover:border-pink-200 hover:-translate-y-0.5 transition-all duration-300">
      <div
        className={`h-1.5 ${
          assessment.completed
            ? "bg-gradient-to-r from-teal-400 to-violet-400"
            : "bg-gradient-to-r from-pink-500 to-violet-500"
        }`}
      />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${
              assessment.completed
                ? "bg-violet-50 text-violet-700 border border-violet-200"
                : "bg-pink-50 text-pink-700 border border-pink-200"
            }`}
          >
            {assessment.completed ? "Đã hoàn thành" : "Chưa làm"}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          {assessment.title || `Bài kiểm tra #${assessment.id}`}
        </h3>
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-pink-50 text-sm text-slate-600">
          {assessment.questionCount && (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-pink-400" aria-hidden />
              {assessment.questionCount} câu
            </span>
          )}
        </div>
        {assessment.completed && assessment.score !== undefined && (
          <div className="mb-4 p-4 rounded-xl bg-violet-50 border border-violet-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-500 mb-1">Điểm của bạn</div>
                <div className="text-2xl font-bold text-violet-700">{assessment.score.toFixed(1)}</div>
              </div>
              <span className="text-3xl" aria-hidden>
                {assessment.score >= 90 ? "🌟" : assessment.score >= 80 ? "⭐" : assessment.score >= 70 ? "👍" : "📚"}
              </span>
            </div>
          </div>
        )}
        <Button
          className="w-full rounded-xl min-h-[44px] font-semibold"
          variant={assessment.completed ? "outline" : "primary"}
          onClick={handleClick}
        >
          {assessment.completed ? "Xem lại kết quả" : "Bắt đầu kiểm tra"}
        </Button>
      </div>
    </div>
  )
})

export default AssessmentCard
