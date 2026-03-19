const OrderChoiceModal = ({ onCancel, onOrder, onRandom }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Chọn chế độ luyện</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Bạn muốn luyện theo thứ tự bài hay ngẫu nhiên?
      </p>
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          type="button"
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-500/25 transition-colors"
          onClick={onOrder}
        >
          Theo thứ tự
        </button>
        <button
          type="button"
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-pink-500/25 transition-colors"
          onClick={onRandom}
        >
          Ngẫu nhiên
        </button>
      </div>
    </div>
  </div>
)

export default OrderChoiceModal
