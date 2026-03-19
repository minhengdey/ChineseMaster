"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { Trophy, CheckCircle } from "lucide-react"

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

    const getSectionResult = (sectionName) => sectionResults[sectionName]

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)
            setError(null)
            const totalScore = calculateTotalScore()
            await onSubmit({
                assessmentId,
                totalScore,
                sections: sectionResults,
                completedAt: new Date().toISOString(),
            })
        } catch (err) {
            console.error("Error submitting test:", err)
            setError("Không thể nộp bài kiểm tra. Vui lòng thử lại.")
            setIsSubmitting(false)
        }
    }

    const totalScore = calculateTotalScore()
    const sections = [
        { key: "thanh-mau", name: "Thanh mẫu", icon: "🎵", accent: "blue" },
        { key: "van-mau", name: "Vận mẫu", icon: "🎤", accent: "emerald" },
        { key: "thanh-dieu", name: "Thanh điệu", icon: "🎶", accent: "amber" },
        { key: "cau", name: "Câu", icon: "💬", accent: "violet" },
    ]

    const getScoreColor = (score) => {
        if (score >= 85) return "text-emerald-600"
        if (score >= 70) return "text-violet-600"
        if (score >= 50) return "text-amber-600"
        return "text-red-600"
    }

    const getScoreBgClass = (score) => {
        if (score >= 85) return "bg-emerald-100 text-emerald-800 border-emerald-200"
        if (score >= 70) return "bg-violet-100 text-violet-800 border-violet-200"
        if (score >= 50) return "bg-amber-100 text-amber-800 border-amber-200"
        return "bg-red-100 text-red-800 border-red-200"
    }

    const getScoreEvaluation = (score) => {
        if (score >= 90) return "Xuất sắc!"
        if (score >= 80) return "Rất tốt!"
        if (score >= 70) return "Tốt"
        if (score >= 60) return "Bình thường"
        if (score >= 50) return "Cần cải thiện"
        return "Cần luyện tập thêm"
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-purple-500 p-6 sm:p-8 text-white shadow-xl shadow-pink-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold mb-1">Kết quả kiểm tra</h1>
                        <p className="text-white/90 text-sm sm:text-base">{assessment?.title || "Bài kiểm tra"}</p>
                        {viewMode && (
                            <span className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-white/20 border border-white/30 text-sm font-semibold">
                                <CheckCircle className="w-4 h-4" aria-hidden />
                                Kết quả đã lưu
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-violet-50 p-6 sm:p-8 mb-6 sm:mb-8">
                <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Điểm tổng</h2>
                    <div className="inline-block">
                        <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                            {totalScore.toFixed(1)}
                        </div>
                        <p className={`text-lg font-semibold mt-2 ${getScoreColor(totalScore)}`}>
                            {getScoreEvaluation(totalScore)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6 sm:mb-8">
                {sections.map(({ key, name, icon }) => {
                    const sectionResult = getSectionResult(key)
                    const score = sectionResult?.averageScore ?? 0
                    const itemCount = sectionResult?.items?.length ?? 0
                    const completedCount = sectionResult?.items?.filter((item) => item.score !== null)?.length ?? 0

                    return (
                        <div
                            key={key}
                            className="bg-white rounded-2xl border border-pink-100 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-pink-200 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl" aria-hidden>{icon}</span>
                                    <h3 className="text-base font-bold text-slate-800">{name}</h3>
                                </div>
                                <span className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${getScoreBgClass(score)}`}>
                                    {score.toFixed(1)}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 font-medium">Tiến độ</span>
                                    <span className="font-semibold text-slate-800">{completedCount}/{itemCount}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-500"
                                        style={{ width: itemCount > 0 ? `${(completedCount / itemCount) * 100}%` : 0 }}
                                    />
                                </div>
                            </div>
                            {sectionResult?.items?.length > 0 && (
                                <div className="mt-4 rounded-xl bg-pink-50/50 border border-pink-100 p-3 max-h-40 overflow-y-auto">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Chi tiết điểm</p>
                                    <div className="space-y-1.5">
                                        {sectionResult.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm bg-white rounded-lg px-3 py-2 border border-slate-100">
                                                <span className="text-slate-700 truncate flex-1 mr-2">
                                                    <span className="font-semibold text-slate-800">{idx + 1}.</span> {item.text}
                                                </span>
                                                <span className={`font-bold flex-shrink-0 ${getScoreColor(item.score || 0)}`}>
                                                    {(item.score ?? 0).toFixed(1)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="bg-white rounded-2xl border border-pink-100 p-5 sm:p-6 shadow-sm mb-6 sm:mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Thống kê từng phần</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {sections.map(({ key, name }) => {
                        const result = getSectionResult(key)
                        return (
                            <div key={key} className="text-center p-4 rounded-xl bg-pink-50/70 border border-pink-100">
                                <p className="text-xs font-medium text-slate-600 mb-1">{name}</p>
                                <p className="text-xl font-bold text-slate-800">{(result?.averageScore ?? 0).toFixed(1)}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                {viewMode ? (
                    <Button
                        onClick={onBack}
                        className="rounded-xl min-h-[48px] font-semibold bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0"
                    >
                        Quay lại danh sách
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl min-h-[48px] font-semibold bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0"
                        >
                            {isSubmitting ? "Đang nộp..." : "Nộp kết quả & quay lại"}
                        </Button>
                        <Button
                            onClick={onBack}
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl min-h-[48px] font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-100 bg-transparent"
                            variant="outline"
                        >
                            Làm lại
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

export default TestResults
