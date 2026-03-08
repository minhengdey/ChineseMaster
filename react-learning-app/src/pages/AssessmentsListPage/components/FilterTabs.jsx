import { memo } from "react"

const FilterTabs = memo(function FilterTabs({ filter, onFilterChange, total, completed, pending }) {
  const tabs = [
    { key: "all", label: `Tất cả (${total})` },
    { key: "pending", label: `Chưa làm (${pending})` },
    { key: "completed", label: `Đã hoàn thành (${completed})` },
  ]
  return (
    <div className="mb-6 flex gap-2 p-2 bg-pink-50/70 rounded-xl border border-pink-100">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onFilterChange(key)}
          className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
            filter === key
              ? "bg-white text-pink-600 shadow-sm border border-pink-200"
              : "text-slate-600 hover:bg-pink-50 hover:text-slate-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
})

export default FilterTabs
