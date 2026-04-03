import { memo } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, Button } from "@/components/ui"

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
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
      <div
        className={`h-2 ${
          assessment.completed
            ? "bg-gradient-to-r from-green-400 to-emerald-500"
            : "bg-gradient-to-r from-purple-400 to-blue-500"
        }`}
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={assessment.completed ? "success" : "info"}>
            {assessment.completed ? "Đã hoàn thành" : "Chưa làm"}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          {assessment.title || `Bài kiểm tra #${assessment.id}`}
        </h3>
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-100 text-sm text-slate-600">
          {assessment.questionCount && (
            <div className="flex items-center gap-1.5">
              <span>📄</span>
              <span>{assessment.questionCount} câu</span>
            </div>
          )}
        </div>
        {assessment.completed && assessment.score !== undefined && (
          <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">Điểm của bạn</div>
                <div className="text-3xl font-bold text-green-600">{assessment.score.toFixed(1)}</div>
              </div>
              <div className="text-4xl">
                {assessment.score >= 90 ? "🌟" : assessment.score >= 80 ? "⭐" : assessment.score >= 70 ? "👍" : "📚"}
              </div>
            </div>
          </div>
        )}
        <Button
          className="w-full rounded-xl"
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
