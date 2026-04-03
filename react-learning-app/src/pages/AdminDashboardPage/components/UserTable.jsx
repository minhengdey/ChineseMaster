const UserTable = ({ rows, columns, maxHeight = "500px" }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-12 text-center">
        <div className="text-purple-300 text-5xl mb-3">📊</div>
        <p className="text-slate-600 font-medium">Chưa có dữ liệu</p>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="table w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs uppercase tracking-wider">
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-semibold ${c.headClassName || "text-left"}`}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={idx}
                className="border-b last:border-b-0 border-slate-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-150"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-sm text-slate-700 ${c.className || "text-left"}`}>
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
