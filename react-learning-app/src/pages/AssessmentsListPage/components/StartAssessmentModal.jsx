import { Button } from "@/components/ui"
import { ClipboardList } from "lucide-react"

const SECTIONS = [
  { emoji: "🎵", title: "Phần A - Thanh mẫu", desc: "Phát âm các thanh mẫu cơ bản", bg: "bg-pink-50", border: "border-pink-100" },
  { emoji: "🎤", title: "Phần B - Vận mẫu", desc: "Phát âm vận mẫu trong từ vựng", bg: "bg-emerald-50", border: "border-emerald-100" },
  { emoji: "🎶", title: "Phần C - Thanh điệu", desc: "Phát âm 4 thanh điệu chuẩn", bg: "bg-violet-50", border: "border-violet-100" },
  { emoji: "💬", title: "Phần D - Câu", desc: "Phát âm các câu hoàn chỉnh", bg: "bg-pink-50/80", border: "border-pink-200" },
]

export default function StartAssessmentModal({ assessment, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-xl border border-pink-200 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-100 flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-pink-600" aria-hidden />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {assessment?.title || "Bài kiểm tra"}
          </h3>
          <p className="text-slate-600 text-sm">
            Bài kiểm tra toàn diện kỹ năng phát âm tiếng Trung
          </p>
        </div>

        <div className="mb-6 space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className={`flex items-start gap-3 p-4 rounded-xl border ${s.bg} ${s.border}`}>
              <span className="text-2xl flex-shrink-0" aria-hidden>{s.emoji}</span>
              <div>
                <div className="font-semibold text-slate-800">{s.title}</div>
                <div className="text-sm text-slate-600 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
          <p className="font-semibold text-amber-800 mb-2">Lưu ý</p>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Mỗi câu hỏi có tối đa 3 lần thử</li>
            <li>Không thể thoát giữa chừng</li>
            <li>Điểm sẽ được lưu tự động</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 rounded-xl min-h-[48px] font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 border-0"
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 rounded-xl min-h-[48px] font-semibold bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0"
            onClick={onConfirm}
          >
            Bắt đầu ngay
          </Button>
        </div>
      </div>
    </div>
  )
}
