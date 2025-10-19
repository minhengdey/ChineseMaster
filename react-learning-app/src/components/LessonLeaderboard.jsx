import React, { useEffect, useState } from 'react';
import { iseStatsAPI } from '../services/api';

const LessonLeaderboard = ({ lessonId, className }) => {
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        if (!lessonId) {
            setRows([]);
            setLoading(false);
            return;
        }
        const load = async () => {
            setLoading(true);
            try {
                const data = await iseStatsAPI.getLeaderboardByLesson(lessonId);
                if (!mounted) return;
                const rows = Array.isArray(data?.rows) ? data.rows : [];
                // ensure numeric score
                const enriched = rows.map(r => ({ ...r, bestScore: Number(r.bestScore ?? r.score ?? 0), avgScore: Number(r.avgScore ?? 0), attempts: Number(r.attempts ?? 0) }));

                // compute consistency_score and composite lesson_score
                const withScores = enriched.map(r => {
                    const consistency = Math.min(5, Math.max(0, Number(r.attempts || 0))) * 2; // 0..10
                    const lessonScore = Math.round((0.8 * (r.bestScore || 0) + 0.2 * consistency) * 100) / 100;
                    return { ...r, consistency, lessonScore };
                });

                // sort by lessonScore desc
                withScores.sort((a, b) => (b.lessonScore ?? 0) - (a.lessonScore ?? 0));
                setRows(withScores);
            } catch (e) {
                console.debug('Failed to load lesson leaderboard', e);
                setError('Không thể tải BXH theo bài');
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [lessonId]);

    if (loading) {
        return <div className={`card p-3 ${className || ''}`}><div className="text-sm text-gray-500">Đang tải BXH bài...</div></div>;
    }
    if (error) {
        return <div className={`card p-3 ${className || ''}`}><div className="text-sm text-error">{error}</div></div>;
    }
    if (!rows || rows.length === 0) {
        return <div className={`card p-3 ${className || ''}`}><div className="font-semibold">BXH theo bài</div><div className="text-sm text-gray-500 mt-2">Chưa có BXH cho bài này hôm nay.</div></div>;
    }

    const top3 = rows.slice(0, 3);

    return (
        <div className={`card p-3 ${className || ''}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-lg">🏅 BXH — Bài {lessonId}</div>
                <div className="text-sm text-base-content/60">👥 {rows.length} lượt</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {top3.map((r, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                    const bg = idx === 0 ? 'bg-gradient-to-r from-yellow-200 to-yellow-50' : idx === 1 ? 'bg-gradient-to-r from-slate-200 to-slate-50' : 'bg-gradient-to-r from-amber-200 to-amber-50';
                    return (
                        <div key={r.userId || idx} className={`p-3 rounded-lg shadow-md ${bg}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-2xl overflow-hidden border">
                                    {r.avatar ? <img src={r.avatar} alt="av" className="w-full h-full object-cover" /> : (r.name ? r.name.charAt(0) : 'U')}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold">{r.name || r.userId}</div>
                                        <div className="text-xs text-base-content/60">{medal}</div>
                                    </div>
                                    <div className="text-xs text-base-content/70">{r.email ? r.email : (r.userId ? `uid:${r.userId}` : '')}</div>

                                    {/* avg progress bar */}
                                    <div className="mt-2 h-2 bg-base-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, r.avgScore || 0))}%`, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }} />
                                    </div>
                                    <div className="text-xs text-base-content/60 mt-1">Avg: {r.avgScore}% • {r.attempts} lượt</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{r.lessonScore ?? r.bestScore}</div>
                                    <div className="text-xs text-base-content/60">#{idx + 1}</div>
                                    <div className="text-xs mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.lessonScore >= 80 ? 'bg-green-100 text-green-800' : r.lessonScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>BXH {r.lessonScore}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th className="w-12">#</th>
                            <th>Học viên</th>
                            <th className="text-right">Điểm cao nhất</th>
                            <th className="text-right">Điểm trung bình</th>
                            <th className="text-right">Lượt luyện</th>
                            <th className="text-right">Điểm BXH</th>
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
                                        <div className="truncate">
                                            <div className="truncate">{r.name || r.userId}</div>
                                            <div className="text-xs text-base-content/60">{r.email ? r.email : (r.userId ? `uid:${r.userId}` : '')}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-right">{r.bestScore}</td>
                                <td className="text-right">{r.avgScore}%</td>
                                <td className="text-right">{r.attempts}</td>
                                <td className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${r.lessonScore >= 80 ? 'bg-green-100 text-green-800' : r.lessonScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{r.lessonScore}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LessonLeaderboard;
