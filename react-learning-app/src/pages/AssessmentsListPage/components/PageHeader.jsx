import StatsCards from "./StatsCards"
import { ClipboardList } from "lucide-react"

export default function PageHeader({ total = 0, completed = 0, pending = 0 }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 shadow-xl shadow-pink-500/20 text-white overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-6 h-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Bài kiểm tra</h1>
            <p className="text-white/90 text-sm sm:text-base">Đánh giá trình độ phát âm của bạn</p>
            <StatsCards total={total} completed={completed} pending={pending} />
          </div>
        </div>
      </div>
    </div>
  )
}
