const ProgressBar = ({ currentIndex, total, showPinyin, onTogglePinyin, onShuffle }) => (
  <div className="mb-8 space-y-4">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Tiến độ</h2>
        <p className="text-sm text-slate-600">{currentIndex + 1} / {total}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button className="icon-btn icon-btn-sm" onClick={onTogglePinyin} title={showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}>
          {showPinyin ? "👁️" : "👁️‍🗨️"}
        </button>
        <button className="icon-btn icon-btn-sm" onClick={onShuffle} title="Trộn">🔀</button>
      </div>
    </div>
    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-md">
      <div
        className="h-3 rounded-full transition-all duration-500"
        style={{
          width: `${total ? Math.round(((currentIndex + 1) / total) * 100) : 0}%`,
          background: "linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4)",
        }}
      />
    </div>
  </div>
)

export default ProgressBar
