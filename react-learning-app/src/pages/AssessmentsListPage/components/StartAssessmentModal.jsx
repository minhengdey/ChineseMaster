import { Button } from "@/components/ui"

const SECTIONS = [
  { emoji: "🎵", title: "Phần A - THANH MẪU", desc: "Phát âm các thanh mẫu cơ bản", bg: "bg-blue-50", titleCl: "text-blue-900", descCl: "text-blue-700" },
  { emoji: "🎤", title: "Phần B - VẬN MẪU", desc: "Phát âm vận mẫu trong từ vựng", bg: "bg-green-50", titleCl: "text-green-900", descCl: "text-green-700" },
  { emoji: "🎶", title: "Phần C - THANH ĐIỆU", desc: "Phát âm 4 thanh điệu chuẩn xác", bg: "bg-purple-50", titleCl: "text-purple-900", descCl: "text-purple-700" },
  { emoji: "💬", title: "Phần D - CÂU", desc: "Phát âm các câu hoàn chỉnh", bg: "bg-pink-50", titleCl: "text-pink-900", descCl: "text-pink-700" },
]

export default function StartAssessmentModal({ assessment, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            {assessment?.title || "Bài Kiểm Tra"}
          </h3>
          <p className="text-slate-600 mb-6">
            Bài kiểm tra toàn diện kỹ năng phát âm tiếng Trung
          </p>
        </div>

        <div className="mb-6 space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className={`flex items-start gap-3 p-4 ${s.bg} rounded-xl`}>
              <span className="text-2xl">{s.emoji}</span>
              <div>
                <div className={`font-semibold ${s.titleCl}`}>{s.title}</div>
                <div className={`text-sm ${s.descCl}`}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Lưu ý:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Mỗi câu hỏi có tối đa 3 lần thử</li>
                <li>Không thể thoát giữa chừng</li>
                <li>Điểm sẽ được lưu tự động</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
            onClick={onConfirm}
          >
            Bắt đầu ngay →
          </Button>
        </div>
      </div>
    </div>
  )
}
