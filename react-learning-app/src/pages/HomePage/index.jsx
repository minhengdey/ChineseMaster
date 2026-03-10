import { useUserStore } from "../../store/UserStore"
import PageLayout from "../../components/layout/PageLayout"
import { HeroSection, FeatureCard } from "./components"
import { BookOpen, Volume2, Sparkles, Type, ClipboardCheck, Mic } from "lucide-react"

const FEATURES = [
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
    icon: Mic,
    title: "Luyện HSKK sơ cấp",
    description: "Luyện thi nói HSKK sơ cấp",
    link: "/hskk-exam",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
    iconColor: "text-amber-600",
  },
  {
    icon: BookOpen,
    title: "Bài học",
    description: "Học theo hệ thống từ cơ bản đến nâng cao",
    link: "/curriculum",
    gradient: "from-pink-500 to-violet-500",
    bgGradient: "from-pink-50 to-violet-50",
    iconColor: "text-pink-600",
  },
  {
    icon: Volume2,
    title: "Phát âm",
    description: "Luyện phát âm chuẩn với giọng bản ngữ",
    link: "/pronunciation",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
    iconColor: "text-violet-600",
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
    gradient: "from-pink-500 to-violet-500",
    bgGradient: "from-pink-50 to-violet-50",
    iconColor: "text-pink-600",
  },
]

const HomePage = () => {
  const user = useUserStore((state) => state.user)

  return (
    <PageLayout innerClassName="pt-0 sm:pt-2 lg:pt-4">
      <HeroSection userName={user?.name} />
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4 px-1">
        Bắt đầu học
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            style={{
              animation: `fadeIn 0.5s ease-out ${(120 + index * 70) / 1000}s backwards`,
            }}
          >
            <FeatureCard {...feature} />
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

export default HomePage
