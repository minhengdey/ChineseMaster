import { memo } from "react"
import { Link } from "react-router-dom"

const FeatureCard = memo(({ icon: Icon, title, description, link, gradient, bgGradient, iconColor }) => {
  return (
    <Link to={link} className="group block h-full">
      <div
        className={`card p-6 sm:p-8 h-full card-hover card-interactive bg-gradient-to-br ${bgGradient} border-2 border-transparent hover:border-purple-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
      >
        <div
          className={`${iconColor} mb-4 transform group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon size={40} aria-hidden />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        <div
          className={`mt-4 flex items-center bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          Bắt đầu →
        </div>
      </div>
    </Link>
  )
})

FeatureCard.displayName = "FeatureCard"

export default FeatureCard
