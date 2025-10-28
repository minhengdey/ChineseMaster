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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 leading-tight">
          Học tiếng Trung dễ dàng
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
          Ứng dụng học tiếng Trung toàn diện với bài học tương tác, luyện tập phát âm, và ôn tập từ vựng
        </p>
      </div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 border-2 border-slate-200 hover:shadow-lg hover:border-purple-300 hover:from-purple-50 hover:to-blue-50 transform hover:scale-105"
          >
            <span className="text-3xl flex-shrink-0">{feature.icon}</span>
            <div>
              <h3 className="font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1 text-lg">
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
