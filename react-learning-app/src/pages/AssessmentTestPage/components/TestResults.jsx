"use client"

import { useState, useEffect } from "react"
import { Button } from "../../AssessmentsListPage/ui/button"
import { Badge } from "./ui/badge"

const TestResults = ({ sectionResults, assessment, assessmentId, onSubmit, onBack, viewMode = false }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const calculateTotalScore = () => {
        const sections = ["thanh-mau", "van-mau", "thanh-dieu", "cau"]
        const validScores = sections
            .map((section) => sectionResults[section]?.averageScore ?? 0)
            .filter((score) => score !== null && score !== undefined)

        if (validScores.length === 0) return 0
        return validScores.reduce((a, b) => a + b, 0) / validScores.length
    }

    const getSectionResult = (sectionName) => {
        return sectionResults[sectionName]
    }

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)
            setError(null)

            const totalScore = calculateTotalScore()
            const finalResults = {
                assessmentId,
                totalScore,
                sections: sectionResults,
                completedAt: new Date().toISOString(),
            }

            await onSubmit(finalResults)
        } catch (err) {
            console.error("Error submitting test:", err)
            setError("Không thể nộp bài kiểm tra. Vui lòng thử lại.")
            setIsSubmitting(false)
        }
    }

    const totalScore = calculateTotalScore()
    const sections = [
        {
            key: "thanh-mau",
            name: "THANH MẪU",
            icon: "🎵",
            borderColor: "border-blue-200",
            textColor: "text-blue-900",
            bgColor: "bg-blue-600",
            bgLight: "bg-blue-50",
        },
        {
            key: "van-mau",
            name: "VẬN MẪU",
            icon: "🎤",
            borderColor: "border-green-200",
            textColor: "text-green-900",
            bgColor: "bg-green-600",
            bgLight: "bg-green-50",
        },
        {
            key: "thanh-dieu",
            name: "THANH ĐIỆU",
            icon: "🎶",
            borderColor: "border-amber-200",
            textColor: "text-amber-900",
            bgColor: "bg-amber-600",
            bgLight: "bg-amber-50",
        },
        {
            key: "cau",
            name: "CÂU",
            icon: "💬",
            borderColor: "border-purple-200",
            textColor: "text-purple-900",
            bgColor: "bg-purple-600",
            bgLight: "bg-purple-50",
        },
    ]

    const getScoreColor = (score) => {
        if (score >= 85) return "text-green-600"
        if (score >= 70) return "text-blue-600"
        if (score >= 50) return "text-amber-600"
        return "text-red-600"
    }

    const getScoreBadgeClass = (score) => {
        if (score >= 85) return "badge-success"
        if (score >= 70) return "badge-info"
        if (score >= 50) return "badge-warning"
        return "badge-error"
    }

    const getScoreEvaluation = (score) => {
        if (score >= 90) return "Xuất sắc! 🌟"
        if (score >= 80) return "Rất tốt! ⭐"
        if (score >= 70) return "Tốt 👍"
        if (score >= 60) return "Bình thường 👌"
        if (score >= 50) return "Cần cải thiện 📚"
        return "Cần luyện tập thêm 💪"
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 text-[200px] leading-none">📊</div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <span className="text-4xl">📊</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-1">Kết Quả Kiểm Tra</h1>
                            <p className="text-purple-100">{assessment?.title || "Bài Kiểm Tra"}</p>
                        </div>
                    </div>
                    {viewMode && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-sm font-semibold">Kết quả đã lưu</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Overall Score Card */}
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-2xl shadow-xl p-10 border-2 border-blue-200 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-10 -mr-32 -mt-32"></div>
                <div className="text-center relative z-10">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">🏆 Điểm Tổng</h2>
                    <div className="relative inline-block">
                        <div className="text-8xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                            {totalScore.toFixed(1)}
                        </div>
                        <div className="absolute -top-2 -right-12 text-4xl">
                            {totalScore >= 90 ? "🌟" : totalScore >= 80 ? "⭐" : totalScore >= 70 ? "👍" : "📚"}
                        </div>
                    </div>
                    <p className={`text-2xl font-bold mb-6 ${getScoreColor(totalScore)}`}>{getScoreEvaluation(totalScore)}</p>
                </div>
            </div>

            {/* Section Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {sections.map(({ key, name, icon, borderColor, textColor, bgColor, bgLight }) => {
                    const sectionResult = getSectionResult(key)
                    const score = sectionResult?.averageScore ?? 0
                    const itemCount = sectionResult?.items?.length ?? 0
                    const completedCount = sectionResult?.items?.filter((item) => item.score !== null)?.length ?? 0

                    return (
                        <div
                            key={key}
                            className={`bg-white rounded-xl shadow-lg p-6 border-2 ${borderColor} hover:shadow-xl transition-all duration-300`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{icon}</span>
                                    <h3 className={`text-lg font-bold ${textColor}`}>{name}</h3>
                                </div>
                                <Badge variant={getScoreBadgeClass(score)}>{score.toFixed(1)}</Badge>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600 font-medium">Tiến độ hoàn thành</span>
                                        <span className="font-bold text-slate-900">
                                            {completedCount}/{itemCount}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`${bgColor} h-3 rounded-full transition-all duration-500`}
                                            style={{
                                                width: `${itemCount > 0 ? (completedCount / itemCount) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {sectionResult?.items && sectionResult.items.length > 0 && (
                                    <div className={`${bgLight} rounded-lg p-4 mt-4 max-h-56 overflow-y-auto border ${borderColor}`}>
                                        <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Chi tiết điểm</p>
                                        <div className="space-y-2">
                                            {sectionResult.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm bg-white rounded px-3 py-2">
                                                    <span className="text-slate-700 flex-1">
                                                        <span className="font-semibold text-slate-900">{idx + 1}.</span> {item.text}
                                                    </span>
                                                    <span className={`font-bold ml-3 ${getScoreColor(item.score || 0)}`}>
                                                        {item.score?.toFixed(1) || 0}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">📈 Thống Kê</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sections.map(({ key, name }) => {
                        const result = getSectionResult(key)
                        return (
                            <div key={key} className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600 mb-2">{name}</p>
                                <p className="text-2xl font-bold text-slate-900">{result?.averageScore?.toFixed(2) || 0}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                    <span>{error}</span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
                {viewMode ? (
                    <>
                        <Button className="flex-1 py-3 text-lg" onClick={onBack}>
                            ← Quay lại danh sách
                        </Button>
                    </>
                ) : (
                    <>
                        <Button className="flex-1 py-3 text-lg" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Đang nộp..." : "✔️ Nộp Kết Quả & Quay Lại"}
                        </Button>
                        <Button
                            className="flex-1 py-3 text-lg bg-transparent"
                            variant="outline"
                            onClick={onBack}
                            disabled={isSubmitting}
                        >
                            🔄 Làm Lại
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

export default TestResults
