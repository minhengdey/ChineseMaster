import { Search, X } from "lucide-react"

export default function CurriculumSearch({ value, onChange, placeholder = "Tìm khóa học..." }) {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white shadow-sm"
        />
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          aria-hidden
        />
        {value && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={() => onChange("")}
            aria-label="Xóa"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
