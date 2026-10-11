import { Link } from "react-router-dom"
import { useUserStore } from "../../../store/UserStore"
import { Users, BookOpen, GraduationCap, BarChart3, FileText } from "lucide-react"

const ADMIN_FEATURES = [
  { icon: Users, title: "Quản lý Người dùng", description: "Xem và quản lý tất cả người dùng trong hệ thống", link: "/admin?tab=users", gradient: "from-blue-500 to-cyan-500", bgGradient: "from-blue-50 to-cyan-50", iconColor: "text-blue-600" },
  { icon: GraduationCap, title: "Quản lý Lớp học", description: "Tạo và quản lý các lớp học, phân bổ học viên", link: "/admin/classes", gradient: "from-purple-500 to-blue-500", bgGradient: "from-purple-50 to-blue-50", iconColor: "text-purple-600" },
  { icon: BookOpen, title: "Quản lý Bài học", description: "Theo dõi tiến độ học tập theo từng bài", link: "/admin?tab=lesson", gradient: "from-cyan-500 to-teal-500", bgGradient: "from-cyan-50 to-teal-50", iconColor: "text-cyan-600" },
  { icon: FileText, title: "Bài kiểm tra", description: "Xem kết quả và thống kê các bài kiểm tra", link: "/admin?tab=test", gradient: "from-teal-500 to-green-500", bgGradient: "from-teal-50 to-green-50", iconColor: "text-teal-600" },
  { icon: BarChart3, title: "Bảng xếp hạng", description: "Xem BXH theo khoảng thời gian tùy chỉnh", link: "/admin?tab=weekly", gradient: "from-pink-500 to-rose-500", bgGradient: "from-pink-50 to-rose-50", iconColor: "text-pink-600" },
]

const AdminHero = () => {
  const user = useUserStore((state) => state.user)

  return (
    <>
      <div className="text-center mb-16 slide-in-up">
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-slate-900">
          Chào Admin, <span className="gradient-text">{user?.name || "Quản trị viên"}</span>!
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Quản lý hệ thống học tiếng Trung - người dùng, lớp học, bài học và thống kê
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {ADMIN_FEATURES.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Link key={index} to={feature.link} className="group">
              <div className={`card p-8 h-full card-hover card-interactive bg-gradient-to-br ${feature.bgGradient} border-2 border-transparent hover:border-purple-300`}>
                <div className={`${feature.iconColor} mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                <div className={`mt-4 flex items-center bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Truy cập →
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

export default AdminHero
