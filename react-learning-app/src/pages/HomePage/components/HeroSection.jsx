import { memo } from "react"

const HeroSection = memo(({ userName }) => {
  return (
    <section className="relative text-center mb-6 sm:mb-8 slide-in-up overflow-hidden">
      {/* Subtle background accent */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        aria-hidden
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,28rem)] h-48 sm:h-56 bg-gradient-to-b from-violet-200/40 via-purple-100/30 to-transparent rounded-full blur-2xl" />
        <div className="absolute top-8 right-[10%] w-32 h-32 bg-blue-200/30 rounded-full blur-2xl" />
        <div className="absolute top-12 left-[15%] w-24 h-24 bg-cyan-200/25 rounded-full blur-2xl" />
      </div>

      <div className="flex justify-center mb-3 sm:mb-4">
        <img
          src="/image.png"
          alt="Chinese Master - Học phát âm tiếng Trung"
          className="w-auto max-w-[min(85vw,20rem)] object-contain drop-shadow-md"
        />
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 text-slate-800 tracking-tight">
        Chào mừng trở lại,{" "}
        <span className="gradient-text">{userName || "Bạn"}</span>
        !
      </h1>
    </section>
  )
})

HeroSection.displayName = "HeroSection"

export default HeroSection
