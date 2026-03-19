import SectionCard from "./SectionCard"
import WeeklyTableView from "./WeeklyTableView"

const WeeklySection = ({ weeklyRows, dateRange, onDateChange, onApply, isLoading, error, requested }) => {
  const hasRange = Boolean(dateRange.from && dateRange.to)
  const filteredWeeks = hasRange ? weeklyRows : []

  return (
    <SectionCard title="BXH theo khoảng thời gian">
      <div className="space-y-6">
        <div className="rounded-xl bg-violet-50/80 border border-violet-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Từ ngày</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                value={dateRange.from}
                onChange={(e) => onDateChange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Đến ngày</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                value={dateRange.to}
                onChange={(e) => onDateChange({ ...dateRange, to: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-semibold shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              onClick={onApply}
              disabled={!hasRange || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tải...
                </>
              ) : (
                "Xem BXH"
              )}
            </button>
          </div>
        </div>

        {requested && (
          <>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 flex items-center gap-3">
                <span>{error}</span>
              </div>
            )}

            {!error && isLoading && (
              <div className="flex items-center justify-center gap-3 p-10 text-slate-600">
                <span className="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />
                <span className="font-medium">Đang tải BXH...</span>
              </div>
            )}

            {!isLoading && !error && filteredWeeks.length === 0 && (
              <div className="text-center p-10 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-400 text-4xl mb-2">📊</div>
                <p className="text-slate-600 font-medium">Không có dữ liệu trong khoảng này</p>
              </div>
            )}

            {!isLoading && !error && filteredWeeks.length > 0 && (
              <div className="space-y-6">
                {filteredWeeks.map((week) => (
                  <WeeklyTableView key={week.weekIndex} week={week} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SectionCard>
  )
}

export default WeeklySection
