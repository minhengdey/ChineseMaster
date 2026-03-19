const HeroSection = () => {
  const features = [
    {
      icon: "📚",
      title: "Bài học có hệ thống",
      description: "Từ cơ bản đến nâng cao",
    },
    {
      icon: "🔊",
      title: "Phát âm chuẩn",
      description: "Với giọng bản ngữ",
    },
    {
      icon: "🎯",
      title: "Luyện tập hiệu quả",
      description: "Theo từng kỹ năng",
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-7 fade-in">
      {/* Logo + title block — nền trắng */}
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <img
          src="/image.png"
          alt="Chinese Master"
          className="h-40 w-auto sm:h-48 md:h-56 max-w-[85vw] object-contain drop-shadow-lg"
        />
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg text-center px-1">
          Ứng dụng học tiếng Trung toàn diện với bài học tương tác, luyện phát âm và ôn từ vựng.
        </p>
      </div>

      {/* Feature cards — pastel trên nền trắng */}
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white/90 sm:bg-white shadow-sm border border-pink-200 hover:border-pink-300 hover:shadow-md transition-all duration-300"
          >
            <span
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-100 to-violet-100 border border-pink-300 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0"
              aria-hidden
            >
              {feature.icon}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-0.5">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeroSection
