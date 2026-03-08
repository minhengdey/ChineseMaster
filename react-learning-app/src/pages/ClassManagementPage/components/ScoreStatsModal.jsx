import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import ScoreTable from "./ScoreTable";
import { classAPI, adminStatsAPI, handleApiError } from "../../../services/api";

const _scoreStatsModalInFlight = {};

const ScoreStatsModal = ({ classId, className, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);

    useEffect(() => {
        if (!classId) {
            setLoading(false);
            return;
        }
        let mounted = true;
        setLoading(true);
        setError(null);

        const run = async () => {
            if (_scoreStatsModalInFlight[classId]) {
                try {
                    const res = await _scoreStatsModalInFlight[classId];
                    if (mounted && res) {
                        setData(res.data ?? []);
                        setColumns(res.columns ?? []);
                        setError(null);
                    }
                } catch (err) {
                    if (mounted) setError(handleApiError ? handleApiError(err) : "Lỗi khi tải dữ liệu");
                } finally {
                    if (mounted) setLoading(false);
                }
                return;
            }

            _scoreStatsModalInFlight[classId] = (async () => {
                try {
                    let result = null;
                    if (classAPI && typeof classAPI.getScores === "function") {
                        result = await classAPI.getScores(classId);
                    } else if (classAPI && typeof classAPI.getById === "function") {
                        const details = await classAPI.getById(classId);
                        result = details.scores || details.members || [];
                    }

                    const [lessonsLb, testsLb] = await Promise.all([
                        adminStatsAPI.getLessonLeaderboards().catch(() => []),
                        adminStatsAPI.getExamLeaderboards().catch(() => []),
                    ]);

                    const lessonsArr = Array.isArray(lessonsLb?.lessons) ? lessonsLb.lessons : Array.isArray(lessonsLb) ? lessonsLb : [];
                    const testsArr = Array.isArray(testsLb?.exams) ? testsLb.exams : Array.isArray(testsLb) ? testsLb : [];
                    const lessonsAll = lessonsArr || [];
                    const testsAll = testsArr || [];

                    const lessonsBefore12 = lessonsAll
                        .filter((l) => {
                            const id = Number(l.lessonId);
                            return Number.isFinite(id) && id >= 1 && id <= 12;
                        })
                        .sort((a, b) => Number(a.lessonId) - Number(b.lessonId));
                    const lessonsAfter12 = lessonsAll
                        .filter((l) => {
                            const id = Number(l.lessonId);
                            return Number.isFinite(id) && id > 12;
                        })
                        .sort((a, b) => Number(a.lessonId) - Number(b.lessonId));

                    const cols = [];
                    lessonsBefore12.forEach((l) => {
                        cols.push({ id: `lesson-${l.lessonId}`, label: `Bài ${l.lessonId}`, source: "lesson", raw: l });
                    });
                    if (testsAll.length > 0) {
                        cols.push({ id: `test-${testsAll[0].testId}`, label: `Test 1`, source: "test", raw: testsAll[0] });
                    }
                    lessonsAfter12.forEach((l) => {
                        cols.push({ id: `lesson-${l.lessonId}`, label: `Bài ${l.lessonId}`, source: "lesson", raw: l });
                    });
                    if (testsAll.length > 1) {
                        testsAll.slice(1).forEach((t, idx) => {
                            cols.push({ id: `test-${t.testId}`, label: `Test ${idx + 2}`, source: "test", raw: t });
                        });
                    }

                    let members = [];
                    if (Array.isArray(result) && result.length > 0 && result[0].userId) {
                        members = result;
                    } else if (result && result.members) {
                        members = result.members;
                    } else {
                        members = await classAPI.getMembers(classId).catch(() => []);
                    }

                    const rows = (members || []).map((m) => {
                        const userId = m.userId || m.id || m.user?.id;
                        const name = m.name || m.fullName || (m.user && m.user.name) || "";
                        const scores = cols.map((col) => {
                            let entry = null;
                            let avg, attempts;
                            if (col.source === "lesson") {
                                const lessonObj = (lessonsAll || []).find(l => Number(l.lessonId) === Number(col.raw.lessonId));
                                entry = (lessonObj?.rows || []).find(r => String(r.userId) === String(userId));
                                avg = entry?.avgScore ?? entry?.avg ?? entry?.bestScore ?? null;
                            } else {
                                const testObj = (testsAll || []).find(t => String(t.testId) === String(col.raw.testId));
                                entry = (testObj?.rows || []).find(r => String(r.userId) === String(userId));
                                avg = entry?.totalScore ?? null;
                            }
                            if (!entry) return null;
                            attempts = entry?.attempts ?? entry?.numAttempts ?? null;
                            return {
                                display: avg != null ? (typeof avg === "number" ? `${avg}${avg > 0 && avg <= 1 ? "" : "%"}` : `${avg}`) : null,
                                meta: attempts != null ? attempts : null,
                                raw: entry,
                            };
                        });
                        return { userId: userId || `${name}-${Math.random()}`, name, scores };
                    });

                    if (mounted) {
                        setColumns(cols);
                        setData(rows);
                    }
                    return { data: rows, columns: cols };
                } catch (err) {
                    console.error(err);
                    if (mounted) setError(handleApiError ? handleApiError(err) : "Lỗi khi tải dữ liệu");
                    throw err;
                } finally {
                    delete _scoreStatsModalInFlight[classId];
                    if (mounted) setLoading(false);
                }
            })();
            await _scoreStatsModalInFlight[classId];
        };
        run();
        return () => { mounted = false; };
    }, [classId]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-6xl max-h-[96vh] overflow-y-auto my-4">
                <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-lg font-bold text-slate-800">Thống kê điểm — {className}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" aria-label="Đóng">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                    {loading && (
                        <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
                            <span className="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />
                            <span className="font-medium">Đang tải dữ liệu...</span>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">{error}</div>
                    )}

                    {!loading && !error && (
                        <div>
                            <div className="mb-4 text-slate-600">Tổng học viên: <span className="font-bold text-pink-600">{data.length}</span></div>
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                                <ScoreTable data={data} columns={columns} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScoreStatsModal;
