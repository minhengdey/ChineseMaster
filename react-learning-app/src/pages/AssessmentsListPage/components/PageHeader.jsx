import StatsCards from "./StatsCards"

export default function PageHeader({ total = 0, completed = 0, pending = 0 }) {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 p-6 sm:p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-[200px] leading-none">📋</div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <span className="text-4xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-1">Bài Kiểm Tra</h1>
              <p className="text-purple-100">Đánh giá trình độ phát âm của bạn</p>
            </div>
          </div>
          <StatsCards total={total} completed={completed} pending={pending} />
        </div>
      </div>
    </div>
  )
}
