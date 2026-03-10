const OrderChoiceModal = ({ onCancel, onOrder, onRandom }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Chọn chế độ luyện</h2>
      <p className="text-gray-600 mb-8 leading-relaxed">Bạn muốn luyện theo thứ tự của bài hay ngẫu nhiên?</p>
      <div className="flex gap-3 justify-end">
        <button
          className="px-6 py-2 rounded-lg font-semibold bg-gray-300 text-gray-800 hover:bg-gray-400 transition-all duration-200"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
          onClick={onOrder}
        >
          Theo thứ tự
        </button>
        <button
          className="px-6 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200"
          onClick={onRandom}
        >
          Ngẫu nhiên
        </button>
      </div>
    </div>
  </div>
)

export default OrderChoiceModal
