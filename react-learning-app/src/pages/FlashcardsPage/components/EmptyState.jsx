import { Layers } from "lucide-react"

export default function EmptyState({ icon: Icon = Layers, title, description }) {
  return (
    <div className="text-center py-16 rounded-2xl bg-slate-50 border border-slate-200">
      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon size={40} className="text-slate-400" aria-hidden />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 max-w-md mx-auto">{description}</p>
    </div>
  )
}
