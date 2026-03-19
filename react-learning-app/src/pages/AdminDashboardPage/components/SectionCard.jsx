const SectionCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="pb-5">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>
)

export default SectionCard
