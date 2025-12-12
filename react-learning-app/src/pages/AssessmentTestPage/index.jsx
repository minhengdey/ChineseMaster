"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { assessmentAPI } from "../../services/api"
import TestSection from "./components/TestSection"
import TestResults from "./components/TestResults"
import { Button } from "./components/ui/button"

const AssessmentTestPage = () => {
    const { assessmentId } = useParams()
    const navigate = useNavigate()

    const [assessment, setAssessment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentSection, setCurrentSection] = useState("intro")
    const [sectionResults, setSectionResults] = useState({
        "thanh-mau": null,
        "van-mau": null,
        "thanh-dieu": null,
        cau: null,
    })
    const [testStarted, setTestStarted] = useState(false)
    const [testData, setTestData] = useState(null)
    const [viewMode, setViewMode] = useState(false)

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                setLoading(true)
                const assessmentData = await assessmentAPI.getAssessmentById(assessmentId)
                setAssessment(assessmentData)

                if (assessmentData?.testData) {
                    setTestData(assessmentData.testData)
                } else {
                    throw new Error("Assessment data không hợp lệ")
                }

                if (assessmentData?.completed && assessmentData?.lastResult) {
                    setViewMode(true)
                    setSectionResults(
                        assessmentData.lastResult.sections || {
                            "thanh-mau": null,
                            "van-mau": null,
                            "thanh-dieu": null,
                            cau: null,
                        },
                    )
                    setTestStarted(true)
                    setCurrentSection("results")
                }

                setError(null)
            } catch (err) {
                console.error("Error loading assessment:", err)
                setError("Không thể tải bài kiểm tra. Vui lòng thử lại.")
            } finally {
                setLoading(false)
            }
        }

        if (assessmentId) {
            fetchAssessment()
        }
    }, [assessmentId])

    const handleStartTest = () => {
        setTestStarted(true)
        setCurrentSection("thanh-mau")
    }

    const handleSectionComplete = (sectionName, result) => {
        setSectionResults((prev) => ({
            ...prev,
            [sectionName]: result,
        }))

        const sections = ["thanh-mau", "van-mau", "thanh-dieu", "cau"]
        const currentIndex = sections.indexOf(sectionName)

        if (currentIndex < sections.length - 1) {
            setCurrentSection(sections[currentIndex + 1])
        } else {
            setCurrentSection("results")
        }
    }

    const handleBackToIntro = () => {
        if (viewMode) {
            navigate("/assessments")
            return
        }

        setTestStarted(false)
        setCurrentSection("intro")
        setSectionResults({
            "thanh-mau": null,
            "van-mau": null,
            "thanh-dieu": null,
            cau: null,
        })
    }

    const handleCancelTest = () => {
        navigate("/assessments")
    }

    const handleSubmitTest = async (finalResults) => {
        try {
            // finalResults from TestResults already contains sections and totalScore
            const payload = {
                assessmentId: String(assessmentId),
                totalScore: finalResults.totalScore,
                sections: finalResults.sections,
                durationSeconds: finalResults.durationSeconds || null,
                timestamp: finalResults.completedAt || new Date().toISOString(),
            }

            await assessmentAPI.submitTest(assessmentId, payload)
            navigate("/assessments", {
                state: { testCompleted: true, results: finalResults },
            })
        } catch (err) {
            console.error("Error submitting test:", err)
            setError("Không thể nộp bài kiểm tra. Vui lòng thử lại.")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Đang tải...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-900">{error}</h2>
                    <Button onClick={() => window.location.reload()}>Thử lại</Button>
                </div>
            </div>
        )
    }

    if (!assessment || !testData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                <div className="text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-900">Không tìm thấy bài kiểm tra</h2>
                    <Button onClick={() => navigate("/assessments")}>Quay lại danh sách</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {!testStarted ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <span className="text-4xl">📋</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold mb-1">Bài Kiểm Tra Toàn Diện</h1>
                                    <p className="text-purple-100">Kiểm tra kỹ năng phát âm qua 4 phần</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">{assessment?.title || "Bài Kiểm Tra"}</h2>
                            {assessment?.description && <p className="text-slate-600 mb-8 text-lg">{assessment.description}</p>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {[
                                    {
                                        label: "A",
                                        title: "THANH MẪU",
                                        desc: "Luyện tập phát âm các thanh mẫu cơ bản",
                                        color: "from-blue-50 to-blue-100 border-blue-200",
                                        textColor: "text-blue-900 bg-blue-500",
                                    },
                                    {
                                        label: "B",
                                        title: "VẬN MẪU",
                                        desc: "Luyện tập vận dụng trong từng từ vựng",
                                        color: "from-green-50 to-green-100 border-green-200",
                                        textColor: "text-green-900 bg-green-500",
                                    },
                                    {
                                        label: "C",
                                        title: "THANH ĐIỆU",
                                        desc: "Luyện tập thanh điệu chính xác",
                                        color: "from-amber-50 to-amber-100 border-amber-200",
                                        textColor: "text-amber-900 bg-amber-500",
                                    },
                                    {
                                        label: "D",
                                        title: "CÂU",
                                        desc: "Phát âm câu hoàn chỉnh",
                                        color: "from-purple-50 to-purple-100 border-purple-200",
                                        textColor: "text-purple-900 bg-purple-500",
                                    },
                                ].map((section) => (
                                    <div
                                        key={section.label}
                                        className={`flex items-start gap-4 p-5 bg-gradient-to-br ${section.color} rounded-xl border-2 hover:shadow-md transition-shadow`}
                                    >
                                        <div
                                            className={`flex-shrink-0 w-12 h-12 ${section.textColor} text-white rounded-lg flex items-center justify-center font-bold text-xl`}
                                        >
                                            {section.label}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold ${section.textColor} text-lg mb-1`}>{section.title}</h3>
                                            <p className={`text-sm ${section.textColor} opacity-75`}>{section.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 mb-8 border border-slate-200">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">ℹ️</span>
                                    <div>
                                        <p className="font-semibold text-slate-900 mb-1">Cách tính điểm</p>
                                        <p className="text-sm text-slate-700">
                                            Tổng điểm = (Điểm phần A + Điểm phần B + Điểm phần C + Điểm phần D) / 4
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button className="flex-1 text-lg py-3" onClick={handleStartTest}>
                                    ▶ Bắt đầu kiểm tra
                                </Button>
                                <Button className="flex-1 text-lg py-3 bg-transparent" variant="outline" onClick={handleBackToIntro}>
                                    ← Quay lại
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : currentSection === "results" ? (
                    <TestResults
                        sectionResults={sectionResults}
                        assessment={assessment}
                        assessmentId={assessmentId}
                        onSubmit={handleSubmitTest}
                        onBack={handleBackToIntro}
                        viewMode={viewMode}
                    />
                ) : (
                    <TestSection
                        section={currentSection}
                        assessmentId={assessmentId}
                        testData={testData}
                        assessment={assessment}
                        onComplete={handleSectionComplete}
                        onCancel={handleCancelTest}
                    />
                )}
            </div>
        </div>
    )
}

export default AssessmentTestPage
