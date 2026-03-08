const UserTable = ({ rows, columns, maxHeight = "500px" }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-10 text-center">
        <div className="text-slate-400 text-4xl mb-2">📊</div>
        <p className="text-slate-600 font-medium">Chưa có dữ liệu</p>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-semibold text-left ${c.headClassName || ""}`}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={idx}
                className="border-b border-slate-100 hover:bg-violet-50/50 transition-colors"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-slate-700 ${c.className || "text-left"}`}>
                    {c.render ? c.render(r, idx) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserTable
