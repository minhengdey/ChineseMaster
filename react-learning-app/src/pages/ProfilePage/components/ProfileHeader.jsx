import { User } from "lucide-react"

const ProfileHeader = () => (
  <div className="mb-8 bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-xl text-white shadow-lg flex items-center gap-4">
    <User size={40} />
    <div>
      <h1 className="text-4xl font-bold mb-2">Hồ sơ cá nhân</h1>
      <p className="text-purple-100 text-lg">Quản lý thông tin và theo dõi tiến độ học tập</p>
    </div>
  </div>
)

export default ProfileHeader
