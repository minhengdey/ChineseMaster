import { X } from "lucide-react"

const Modal = ({ title, children, onClose, wide = false }) => (
  <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-xl shadow-xl ${wide ? "max-w-4xl" : "max-w-md"} w-full max-h-[90vh] overflow-y-auto`}>
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
          <X size={24} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

export default Modal
