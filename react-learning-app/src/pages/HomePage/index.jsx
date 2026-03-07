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
    title: "Thi nói HSKK",
    description: "Luyện thi nói HSKK sơ cấp (mô phỏng đề thật)",
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

const HomePage = () => {
  const user = useUserStore((state) => state.user)

  return (
    <PageLayout>
      <HeroSection userName={user?.name} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
        {FEATURES.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </PageLayout>
  )
}

export default HomePage
