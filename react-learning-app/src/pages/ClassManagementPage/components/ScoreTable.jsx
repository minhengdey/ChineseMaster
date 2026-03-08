import React from "react";

const ScoreTable = ({ data = [], columns = [] }) => {
    if (!data || data.length === 0) {
        return <div className="text-center py-8 text-slate-500">Không có dữ liệu điểm</div>;
    }

    const maxScores = Math.max(...data.map(d => (d.scores ? d.scores.length : 0)), 0);

    return (
        <div className="overflow-auto relative max-h-[70vh]">
            <table className="w-full table-fixed border-separate [border-spacing:0] text-sm">
                <thead>
                    <tr className="bg-slate-50 sticky top-0 z-40">
                        <th className="px-4 py-3 text-left font-semibold text-slate-800 sticky left-0 z-50 bg-slate-50 border-r border-slate-200 w-48 sm:w-60">Họ tên</th>
                        {Array.from({ length: maxScores }).map((_, idx) => (
                            <th key={idx} className="px-3 py-3 text-center font-semibold text-slate-700 border-l border-slate-100 w-24 sm:w-28">
                                {columns && columns[idx] && columns[idx].label ? columns[idx].label : `Bài ${idx + 1}`}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row) => (
                        <tr key={row.userId} className="border-b border-slate-100 hover:bg-violet-50/50 transition-colors align-top">
                            <td className="px-4 py-3 align-top w-48 sm:w-60 font-medium text-slate-800 sticky left-0 z-30 bg-white border-r border-slate-100">{row.name || "N/A"}</td>
                            {Array.from({ length: maxScores }).map((_, idx) => {
                                const s = row.scores && row.scores[idx];
                                // Determine display text and secondary meta
                                let main = null;
                                let meta = null;
                                const col = columns && columns[idx];
                                const hideMetaForTest = col && col.source === "test";

                                if (s) {
                                    // common shapes: { value, outOf, display } and meta in { meta, detail, raw }
                                    if (s.display) main = s.display;
                                    else if (s.value != null) main = `${s.value}${s.outOf ? `/${s.outOf}` : "%"}`;
                                    else if (typeof s === "number") main = `${s}%`;

                                    if (!hideMetaForTest) {
                                        meta = s.meta || s.detail || s.secondary || s.raw || null;
                                    }
                                }

                                return (
                                    <td key={idx} className="px-2 py-3 text-center align-top w-24 sm:w-28">
                                        {main ? (
                                            <div className="flex flex-col items-center">
                                                <span className="font-medium text-slate-800">{main}</span>
                                                {meta && <span className="text-xs text-slate-400">{`(${meta})`}</span>}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScoreTable;
