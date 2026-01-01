import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useUserStore } from "../../store/UserStore"
import { BookOpen, Volume2, Sparkles, Type, ClipboardCheck } from "lucide-react"

const HomePage = () => {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);
  const user = useUserStore((state) => state.user)

  const features = [
    {
      icon: ClipboardCheck,
      title: "Bài kiểm tra",
      description: "Đánh giá trình độ phát âm của bạn",
      link: "/assessments",
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50",
      iconColor: "text-pink-600",
    },
    {
      icon: BookOpen,
      title: "Bài học",
      description: "Học theo hệ thống từ cơ bản đến nâng cao",
      link: "/curriculum",
      gradient: "from-purple-500 to-blue-500",
      bgGradient: "from-purple-50 to-blue-50",
      iconColor: "text-purple-600",
    },
    {
      icon: Volume2,
      title: "Phát âm",
      description: "Luyện phát âm chuẩn với giọng bản ngữ",
      link: "/pronunciation",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      iconColor: "text-blue-600",
    },
    {
      icon: Sparkles,
      title: "Flash Card",
      description: "Ôn tập từ vựng một cách hiệu quả",
      link: "/flashcards",
      gradient: "from-cyan-500 to-teal-500",
      bgGradient: "from-cyan-50 to-teal-50",
      iconColor: "text-cyan-600",
    },
    {
      icon: Type,
      title: "Bảng PINYIN",
      description: "Học bảng chữ cái và phiên âm Pinyin",
      link: "/alphabet",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      iconColor: "text-purple-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container-max">
          <div className="text-center mb-16 slide-in-up">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-slate-900">
              Chào mừng trở lại, <span className="gradient-text">{user?.name || "Bạn"}</span>!
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Tiếp tục hành trình học tiếng Trung của bạn với các bài học tương tác, luyện tập phát âm, và ôn tập từ
              vựng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Link key={index} to={feature.link} className="group">
                  <div
                    className={`card p-8 h-full card-hover card-interactive bg-gradient-to-br ${feature.bgGradient} border-2 border-transparent hover:border-purple-300`}
                  >
                    <div
                      className={`${feature.iconColor} mb-4 transform group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                    <div
                      className={`mt-4 flex items-center bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      Bắt đầu →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
