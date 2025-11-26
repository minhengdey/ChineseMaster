import React from 'react'

// Generic leaderboard table for LeaderboardRowResponse arrays
// Expected fields: name, avgScore, bestScore, attempts, completionCount, improvementRate
const LeaderboardTable = ({ title, rows = [] }) => {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                            <th className="px-3 py-2 text-left font-semibold">Tên</th>
                            <th className="px-3 py-2 text-left font-semibold">Avg</th>
                            <th className="px-3 py-2 text-left font-semibold">Best</th>
                            <th className="px-3 py-2 text-left font-semibold">Attempts</th>
                            <th className="px-3 py-2 text-left font-semibold">Completions</th>
                            <th className="px-3 py-2 text-left font-semibold">Improve%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => {
                            const name = r.name || `#${r.userId ?? i + 1}`;
                            const avg = r.avgScore != null ? Math.round(r.avgScore) : '-';
                            const best = r.bestScore != null ? Math.round(r.bestScore) : '-';
                            const attempts = r.attempts != null ? r.attempts : '-';
                            const completions = r.completionCount != null ? r.completionCount : '-';
                            const improve = r.improvementRate != null ? `${Math.round(r.improvementRate)}%` : '-';
                            return (
                                <tr key={i} className="even:bg-gray-50 border-t border-gray-100">
                                    <td className="px-3 py-2 font-medium text-gray-900">{name}</td>
                                    <td className="px-3 py-2">{avg}%</td>
                                    <td className="px-3 py-2">{best === '-' ? '-' : `${best}%`}</td>
                                    <td className="px-3 py-2">{attempts}</td>
                                    <td className="px-3 py-2">{completions}</td>
                                    <td className="px-3 py-2">{improve}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaderboardTable;