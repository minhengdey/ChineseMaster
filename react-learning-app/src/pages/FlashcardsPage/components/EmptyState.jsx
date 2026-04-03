import { Layers } from "lucide-react"

export default function EmptyState({ icon: Icon = Layers, title, description }) {
  return (
    <div className="text-center py-16 rounded-2xl bg-slate-50 border border-slate-100">
      <Icon size={80} className="mx-auto mb-4 text-slate-300" aria-hidden />
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 max-w-md mx-auto">{description}</p>
    </div>
  )
}
