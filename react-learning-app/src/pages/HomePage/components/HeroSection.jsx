import { memo } from "react"

const HeroSection = memo(({ userName }) => {
  return (
    <section className="text-center mb-14 sm:mb-16 slide-in-up">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-slate-900">
        Chào mừng trở lại, <span className="gradient-text">{userName || "Bạn"}</span>!
      </h1>
      <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
        Tiếp tục hành trình học tiếng Trung của bạn với các bài học tương tác, luyện tập phát âm, và ôn tập từ vựng
      </p>
    </section>
  )
})

HeroSection.displayName = "HeroSection"

export default HeroSection
