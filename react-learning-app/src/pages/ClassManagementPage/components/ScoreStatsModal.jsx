import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import ScoreTable from "./ScoreTable";
import { classAPI, adminStatsAPI, handleApiError } from "../../../services/api";
import { getClassScoreSheetOverride } from "../../../utils/adminSheetOverrides";

const _scoreStatsModalInFlight = {};

const toPercentDisplay = (value) => {
    if (value == null || value === "") return null;
    if (String(value).trim() === "/") return "/";
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    const percent = n <= 1 ? n * 100 : n;
    const rounded = Math.round(percent * 100) / 100;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toString();
    return `${text}%`;
};

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
            const sheetOverride = getClassScoreSheetOverride(className);
            if (sheetOverride) {
                if (mounted) {
                    setData(sheetOverride.data ?? []);
                    setColumns(sheetOverride.columns ?? []);
                    setError(null);
                    setLoading(false);
                }
                return;
            }

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
                                display: toPercentDisplay(avg),
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
    }, [classId, className]);

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
