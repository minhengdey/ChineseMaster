import { User } from "lucide-react"

const ProfileHeader = () => (
  <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 text-white shadow-xl shadow-pink-500/20 flex items-center gap-4 slide-in-up">
    <div className="p-3.5 rounded-xl bg-white/20 flex-shrink-0">
      <User size={32} aria-hidden />
    </div>
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Hồ sơ cá nhân</h1>
      <p className="text-white/90 text-sm sm:text-base">Quản lý thông tin và theo dõi tiến độ học tập</p>
    </div>
  </div>
)

export default ProfileHeader
