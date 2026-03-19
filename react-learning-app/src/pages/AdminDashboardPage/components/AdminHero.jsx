import { Link } from "react-router-dom"
import { useUserStore } from "../../../store/UserStore"
import { Users, BookOpen, GraduationCap, BarChart3, FileText } from "lucide-react"

const ADMIN_FEATURES = [
  { icon: Users, title: "Quản lý Người dùng", description: "Xem và quản lý tất cả người dùng trong hệ thống", link: "/admin?tab=users", gradient: "from-pink-500 to-violet-500", bgGradient: "from-pink-50 to-violet-50", iconColor: "text-pink-600" },
  { icon: GraduationCap, title: "Quản lý Lớp học", description: "Tạo và quản lý các lớp học, phân bổ học viên", link: "/admin/classes", gradient: "from-violet-500 to-purple-500", bgGradient: "from-violet-50 to-purple-50", iconColor: "text-violet-600" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {ADMIN_FEATURES.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Link key={index} to={feature.link} className="group block h-full">
              <div className={`h-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all duration-200 bg-gradient-to-br ${feature.bgGradient}`}>
                <div className={`w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center mb-4 ${feature.iconColor} group-hover:scale-105 transition-transform`}>
                  <Icon size={24} aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1.5">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                <span className={`mt-3 inline-flex items-center gap-1 font-semibold text-sm bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent opacity-80 group-hover:opacity-100 transition-opacity`}>
                  Truy cập →
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

export default AdminHero
