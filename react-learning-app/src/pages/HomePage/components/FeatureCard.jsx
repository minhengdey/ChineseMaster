import { memo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

const FeatureCard = memo(
  ({ icon: Icon, title, description, link, gradient, bgGradient, iconColor }) => {
    return (
      <Link
        to={link}
        className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-2xl"
      >
        <div
          className={`
            h-full p-5 sm:p-6 rounded-2xl
            bg-white border border-slate-200/80
            shadow-sm hover:shadow-lg hover:shadow-violet-500/10
            hover:border-violet-200 hover:-translate-y-1
            transition-all duration-300 ease-out
            flex flex-col
          `}
        >
          {/* Icon with soft background */}
          <div
            className={`
              w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4
              bg-gradient-to-br ${bgGradient} border border-slate-100
              group-hover:scale-105 transition-transform duration-300
            `}
          >
            <Icon className={`${iconColor} w-6 h-6 sm:w-7 sm:h-7`} aria-hidden />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-1.5 group-hover:text-violet-700 transition-colors">
            {title}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed flex-1">
            {description}
          </p>

          <span
            className={`
              mt-4 inline-flex items-center gap-1.5 text-sm font-semibold
              bg-gradient-to-r ${gradient} bg-clip-text text-transparent
              opacity-80 group-hover:opacity-100 group-hover:gap-2
              transition-all duration-300
            `}
          >
            Bắt đầu
            <ArrowRight className="w-4 h-4" aria-hidden />
          </span>
        </div>
      </Link>
    )
  }
)

FeatureCard.displayName = "FeatureCard"

export default FeatureCard
