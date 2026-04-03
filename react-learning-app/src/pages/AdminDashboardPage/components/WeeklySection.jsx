import SectionCard from "./SectionCard"
import WeeklyTableView from "./WeeklyTableView"

const WeeklySection = ({ weeklyRows, dateRange, onDateChange, onApply, isLoading, error, requested }) => {
  const hasRange = Boolean(dateRange.from && dateRange.to)
  const filteredWeeks = hasRange ? weeklyRows : []

  return (
    <SectionCard title="BXH theo khoảng thời gian">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Từ ngày</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                value={dateRange.from}
                onChange={(e) => onDateChange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Đến ngày</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                value={dateRange.to}
                onChange={(e) => onDateChange({ ...dateRange, to: e.target.value })}
              />
            </div>
            <button
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={onApply}
              disabled={!hasRange || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Đang tải...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Xem BXH
                </>
              )}
            </button>
          </div>
        </div>

        {requested && (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {!error && isLoading && (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-600">
                <span className="loading loading-spinner loading-lg text-purple-600" />
                <span className="font-medium">Đang tải BXH...</span>
              </div>
            )}

            {!isLoading && !error && filteredWeeks.length === 0 && (
              <div className="text-center p-12 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                <div className="text-purple-300 text-5xl mb-3">📊</div>
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
