import React, { useEffect, useState } from 'react';
import { iseStatsAPI } from '../services/api';

// Compute daily score using provided formula with normalization for completion count
const computeDailyScore = (entry, maxCompletion) => {
    const avg = Number(entry.avgScore ?? 0); // assumed 0-100
    const completionCount = Number(entry.completionCount ?? 0);
    // normalize completionCount to 0-100 using maxCompletion (avoid div0)
    const completionRate = maxCompletion > 0 ? Math.min(100, (completionCount / maxCompletion) * 100) : 0;
    // improvementRate is expected as a percent number (e.g. +3 or -1)
    const improvementRate = Number(entry.improvementRate ?? 0);

    const dailyScore = 0.7 * avg + 0.2 * completionRate + 0.1 * improvementRate;
    return Math.round(Math.max(0, Math.min(100, dailyScore)) * 10) / 10; // one decimal
};

const DailyLeaderboard = ({ className }) => {
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                // NOTE: backend endpoint /ise/stats/leaderboard/daily must exist to return aggregated rows across users.
                const data = await iseStatsAPI.getLeaderboardDaily();
                if (!mounted) return;
                const rows = Array.isArray(data?.rows) ? data.rows : [];

                // find max completion to normalize
                const maxCompletion = rows.reduce((m, r) => Math.max(m, Number(r.completionCount || 0)), 0) || 1;

                const enriched = rows.map((r) => ({
                    ...r,
                    dailyScore: computeDailyScore(r, maxCompletion),
                }));

                // sort by dailyScore desc, tie-breaker: improvementRate desc, completionCount desc, timestamp asc
                enriched.sort((a, b) => {
                    if (b.dailyScore !== a.dailyScore) return b.dailyScore - a.dailyScore;
                    if ((b.improvementRate ?? 0) !== (a.improvementRate ?? 0)) return (b.improvementRate ?? 0) - (a.improvementRate ?? 0);
                    if ((b.completionCount ?? 0) !== (a.completionCount ?? 0)) return (b.completionCount ?? 0) - (a.completionCount ?? 0);
                    // older timestamp (smaller) should come first if other metrics tie
                    return (a.timestamp || 0) - (b.timestamp || 0);
                });

                setRows(enriched);
            } catch (e) {
                console.debug('Failed to load daily leaderboard', e);
                setError(e?.message || 'Không thể tải BXH');
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <div className={`card p-3 ${className || ''}`}>
                <div className="text-sm text-gray-500">Đang tải BXH hôm nay...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`card p-3 ${className || ''}`}>
                <div className="text-sm text-error">{error}</div>
                <div className="text-xs text-base-content/60 mt-2">Lưu ý: BXH yêu cầu endpoint backend hợp lệ: <code>/api/ise/stats/leaderboard/daily</code></div>
            </div>
        );
    }

    if (!rows || rows.length === 0) {
        return (
            <div className={`card p-3 ${className || ''}`}>
                <div className="font-semibold">🏆 BXH hôm nay</div>
                <div className="text-sm text-gray-500 mt-2">Chưa có dữ liệu BXH hôm nay.</div>
            </div>
        );
    }

    const top3 = rows.slice(0, 3);

    return (
        <div className={`card p-3 ${className || ''}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-lg">🏆 BXH hôm nay</div>
                <div className="text-sm text-base-content/60">👥 {rows.length} người đã luyện hôm nay</div>
            </div>

            {/* Top 3 highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {top3.map((r, idx) => (
                    <div key={r.userId || idx} className={`p-3 rounded-lg shadow-sm ${idx === 0 ? 'bg-yellow-100' : idx === 1 ? 'bg-gray-100' : 'bg-amber-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-xl overflow-hidden">
                                {r.avatar ? <img src={r.avatar} alt="av" className="w-full h-full object-cover" /> : (r.name ? r.name.charAt(0) : 'U')}
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">{r.name || r.userId}</div>
                                <div className="text-xs text-base-content/70">{r.avgScore}% • {r.completionCount} lượt</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{r.dailyScore}</div>
                                <div className="text-xs text-base-content/60">#{idx + 1}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full leaderboard table */}
            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th className="w-12">#</th>
                            <th>Học viên</th>
                            <th className="text-right">Điểm trong ngày</th>
                            <th className="text-right">Điểm trung bình</th>
                            <th className="text-right">Lượt luyện</th>
                            <th className="text-right">Tiến bộ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.userId || i} className={i < 3 ? 'font-semibold' : ''}>
                                <td>{i + 1}</td>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center overflow-hidden">
                                            {r.avatar ? <img src={r.avatar} alt="av" className="w-full h-full object-cover" /> : (r.name ? r.name.charAt(0) : 'U')}
                                        </div>
                                        <div className="truncate">{r.name || r.userId}</div>
                                    </div>
                                </td>
                                <td className="text-right">{r.dailyScore}</td>
                                <td className="text-right">{r.avgScore}%</td>
                                <td className="text-right">{r.completionCount}</td>
                                <td className={`text-right ${Number(r.improvementRate) > 0 ? 'text-success' : Number(r.improvementRate) < 0 ? 'text-error' : ''}`}>
                                    {Number(r.improvementRate) > 0 ? '↑' : Number(r.improvementRate) < 0 ? '↓' : ''} {Math.abs(Number(r.improvementRate) || 0)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DailyLeaderboard;
