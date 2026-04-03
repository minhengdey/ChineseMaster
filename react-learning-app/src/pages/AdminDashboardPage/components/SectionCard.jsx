const SectionCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="p-6 sm:p-8">
      <div className="pb-6">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>
)

export default SectionCard
