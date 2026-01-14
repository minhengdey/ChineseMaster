import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import ScoreTable from "./ScoreTable";
import { classAPI, adminStatsAPI, handleApiError } from "../../../services/api";

const ScoreStatsModal = ({ classId, className, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                let result = null;

                if (classAPI && typeof classAPI.getScores === "function") {
                    result = await classAPI.getScores(classId);
                } else if (classAPI && typeof classAPI.getById === "function") {
                    const details = await classAPI.getById(classId);
                    result = details.scores || details.members || [];
                }

                // Fetch leaderboards for lessons and tests so we can build columns
                const [lessonsLb, testsLb] = await Promise.all([
                    adminStatsAPI.getLessonLeaderboards().catch(() => []),
                    adminStatsAPI.getExamLeaderboards().catch(() => []),
                ]);

                // Normalize leaderboard responses: admin API may return { lessons: [...] } or array directly
                const lessonsArr = Array.isArray(lessonsLb?.lessons) ? lessonsLb.lessons : Array.isArray(lessonsLb) ? lessonsLb : [];
                const testsArr = Array.isArray(testsLb?.exams) ? testsLb.exams : Array.isArray(testsLb) ? testsLb : [];

                // Keep original arrays for lookup
                const lessonsAll = lessonsArr || [];
                const testsAll = testsArr || [];

                // Build columns: lessons 1..12 (sorted), then insert Test 1 (if exists),
                // then lessons 13+ (sorted), then remaining tests (Test 2...)
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

                // Insert first test (Test 1) immediately after Bài 12
                if (testsAll.length > 0) {
                    const firstTest = testsAll[0];
                    cols.push({ id: `test-${firstTest.testId}`, label: `Test 1`, source: "test", raw: firstTest });
                }

                // Append lessons after 12
                lessonsAfter12.forEach((l) => {
                    cols.push({ id: `lesson-${l.lessonId}`, label: `Bài ${l.lessonId}`, source: "lesson", raw: l });
                });

                // Append remaining tests (Test 2...)
                if (testsAll.length > 1) {
                    testsAll.slice(1).forEach((t, idx) => {
                        cols.push({ id: `test-${t.testId}`, label: `Test ${idx + 2}`, source: "test", raw: t });
                    });
                }

                // Normalize members list
                let members = [];
                if (Array.isArray(result) && result.length > 0 && result[0].userId) {
                    members = result;
                } else if (result && result.members) {
                    members = result.members;
                } else {
                    // fallback: try classAPI.getMembers
                    members = await classAPI.getMembers(classId).catch(() => []);
                }

                // Build rows: for each member, create scores array aligned with cols
                const rows = (members || []).map((m) => {
                    const userId = m.userId || m.id || m.user?.id;
                    const name = m.name || m.fullName || (m.user && m.user.name) || "";

                    const scores = cols.map((col) => {
                        // find in corresponding leaderboard raw data
                        let entry = null;
                        let avg, attempts;
                        if (col.source === "lesson") {
                            // find lesson object in lessonsAll
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

                    return {
                        userId: userId || `${name}-${Math.random()}`,
                        name,
                        scores,
                    };
                });

                if (mounted) {
                    setColumns(cols);
                    setData(rows);
                }
            } catch (err) {
                console.error(err);
                setError(handleApiError ? handleApiError(err) : "Lỗi khi tải dữ liệu");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [classId]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-24 flex items-start justify-center z-50 p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-8xl max-h-[96vh] overflow-y-auto mx-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100/40 rounded-xl mx-6 mt-6 px-8 py-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Thống kê điểm lớp {className}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={28} /></button>
                </div>

                <div className="p-8 space-y-6">
                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-3 text-slate-600">Đang tải dữ liệu...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
                    )}

                    {!loading && !error && (
                        <div>
                            <div className="mb-4 text-slate-600">Tổng học viên: <span className="font-bold text-purple-600">{data.length}</span></div>
                            <div className="rounded-lg border border-slate-100 bg-white shadow-sm p-4">
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
