"use client"

import { useState, useEffect, useRef } from "react"
import { createRecorder, computeSha256Hex, playBlobSafely } from "../../../utils/audioUtils"
import { iseAPI } from "../../../services/api"
import { Button } from "../../AssessmentsListPage/ui/button"

const TestSection = ({ section, assessmentId, testData, assessment, onComplete, onCancel }) => {
    const [items, setItems] = useState([])
    const [currentItemIndex, setCurrentItemIndex] = useState(0)
    const [itemScores, setItemScores] = useState([])
    const [itemAttempts, setItemAttempts] = useState([]) // Track attempts per item
    const [currentAttemptCount, setCurrentAttemptCount] = useState(0) // Current item attempt count (0-2)
    const [currentAttemptResult, setCurrentAttemptResult] = useState(null) // Display result after scoring
    const [loading, setLoading] = useState(true)
    const [recordingState, setRecordingState] = useState("idle") // idle, recording, analyzing
    const [audioBlob, setAudioBlob] = useState(null)
    const [sectionScore, setSectionScore] = useState(null)
    const [allItemsCompleted, setAllItemsCompleted] = useState(false)
    const [error, setError] = useState(null)
    const mediaRecorderRef = useRef(null)

    // Initialize section items based on section type
    useEffect(() => {
        const loadSectionItems = () => {
            try {
                let sectionItems = []

                if (section === "thanh-mau" && testData?.thanhMau) {
                    sectionItems = testData.thanhMau.map((item) => ({
                        id: item.id,
                        type: "word",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        vocabularyId: item.vocabularyId || item.id,
                        externalId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                    }))
                } else if (section === "van-mau" && testData?.vanMau) {
                    sectionItems = testData.vanMau.map((item) => ({
                        id: item.id,
                        type: "word",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        vocabularyId: item.vocabularyId || item.id,
                        externalId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                    }))
                } else if (section === "thanh-dieu" && testData?.thanhDieu) {
                    sectionItems = testData.thanhDieu.map((item) => ({
                        id: item.id,
                        type: "word",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        vocabularyId: item.vocabularyId || item.id,
                        externalId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                    }))
                } else if (section === "cau" && testData?.sentences) {
                    sectionItems = testData.sentences.map((item) => ({
                        id: item.id,
                        type: "sentence",
                        text: item.content,
                        pinyin: item.pinyin,
                        meaning: item.meaning,
                        lineId: item.externalId || item.id,
                        audioPublicId: item.audioPublicId,
                    }))
                }

                setItems(sectionItems)
                setItemScores(new Array(sectionItems.length).fill(null))
                setItemAttempts(new Array(sectionItems.length).fill(null).map(() => []))
                setLoading(false)
            } catch (err) {
                console.error("Error loading section items:", err)
                setError("Không thể tải dữ liệu phần kiểm tra")
                setLoading(false)
            }
        }

        loadSectionItems()
    }, [section, testData])

    const currentItem = items[currentItemIndex]

    const startRecording = async () => {
        setRecordingState("recording")
        setAudioBlob(null)
        setError(null)

        try {
            const rec = await createRecorder({ mimeType: "audio/webm;codecs=opus" })
            mediaRecorderRef.current = rec
            await rec.start()
        } catch (err) {
            console.error("Error starting recording:", err)
            setError("Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.")
            setRecordingState("idle")
        }
    }

    const stopRecording = async () => {
        if (!mediaRecorderRef.current) return

        setRecordingState("analyzing")

        try {
            const rec = mediaRecorderRef.current
            const { blob, stream } = await rec.stop()

            try {
                if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop())
            } catch (e) {
                /* ignore */
            }

            setAudioBlob(blob)
            // Auto-submit after recording
            setTimeout(() => submitRecording(blob), 150)
        } catch (err) {
            console.error("Error stopping recording:", err)
            setError("Không thể hoàn tất ghi âm. Vui lòng thử lại.")
            setRecordingState("idle")
        }
    }

    const submitRecording = async (blob) => {
        if (!blob) {
            setError("Không có file âm thanh để phân tích")
            setRecordingState("idle")
            return
        }

        if (!currentItem) {
            setError("Không tìm thấy mục kiểm tra")
            setRecordingState("idle")
            return
        }

        try {
            const mime = blob.type || "audio/webm"
            const size = blob.size
            const sha256 = await computeSha256Hex(blob)
            const textToAnalyze = currentItem.text

            let result

            if (currentItem.type === "word") {
                // Score word
                const payload = {
                    text: textToAnalyze,
                    audioFile: blob,
                    mimeType: mime,
                    size: String(size),
                    sha256,
                }
                if (currentItem.vocabularyId) payload.vocabularyId = String(currentItem.vocabularyId)
                if (assessmentId) payload.testId = String(assessmentId)
                if (section) payload.scoreCategory = String(section)

                result = await iseAPI.scoreWord(payload)
            } else if (currentItem.type === "sentence") {
                // Score sentence
                const payload = {
                    text: textToAnalyze,
                    audioFile: blob,
                    mimeType: mime,
                    size: String(size),
                    sha256,
                }
                if (assessmentId) payload.testId = String(assessmentId)
                if (currentItem.lineId) payload.lineId = String(currentItem.lineId)
                if (section) payload.scoreCategory = String(section)

                result = await iseAPI.scoreSentence(payload)
            }

            if (result && result.require_retry) {
                setError(result.message || "Ghi âm không đủ rõ. Vui lòng ghi lại và thử lại.")
                setRecordingState("idle")
                return
            }

            // Extract score from result
            const score = extractScore(result)
            const updatedScores = [...itemScores]
            updatedScores[currentItemIndex] = score
            setItemScores(updatedScores)

            // Store attempt details
            const updatedAttempts = [...itemAttempts]
            if (!updatedAttempts[currentItemIndex]) updatedAttempts[currentItemIndex] = []
            updatedAttempts[currentItemIndex].push({
                attemptNumber: currentAttemptCount + 1,
                score: score,
                result: result,
            })
            setItemAttempts(updatedAttempts)

            // Show result display
            setCurrentAttemptResult({
                attemptNumber: currentAttemptCount + 1,
                score: score,
                result: result,
            })
            setRecordingState("idle")
        } catch (err) {
            console.error("Error submitting recording:", err)
            setError(err.message || "Không thể đánh giá phát âm. Vui lòng thử lại.")
            setRecordingState("idle")
        }
    }

    const extractScore = (result) => {
        // Extract score from ISE response
        if (!result) return 0

        const raw = result.raw_response ?? result
        if (typeof raw === "object") {
            const sent = raw.sentence || {}
            return sent.total_score ?? raw.total_score ?? raw.totalScore ?? 0
        }
        return 0
    }

    const moveToNextItem = () => {
        setCurrentAttemptCount(0)
        setCurrentAttemptResult(null)
        setAudioBlob(null)
        setError(null)
        setRecordingState("idle")

        if (currentItemIndex < items.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1)
        } else {
            // Section complete
            const avgScore = itemScores.filter((s) => s !== null).reduce((a, b) => a + b, 0) / itemScores.filter((s) => s !== null).length
            setSectionScore(avgScore)
            setAllItemsCompleted(true)
        }
    }

    const handleSkipItem = () => {
        const updatedScores = [...itemScores]
        updatedScores[currentItemIndex] = 0
        setItemScores(updatedScores)
        moveToNextItem()
    }

    const playRecordedAudio = () => {
        if (audioBlob) {
            playBlobSafely(audioBlob).catch((err) => {
                console.error("Error playing audio:", err)
                setError("Không thể phát âm thanh đã ghi")
            })
        }
    }

    const handleCompleteSection = () => {
        if (sectionScore !== null) {
            onComplete(section, {
                section,
                scores: itemScores,
                averageScore: sectionScore,
                items: items.map((item, idx) => ({
                    ...item,
                    score: itemScores[idx],
                })),
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600 mb-4">Không có mục kiểm tra cho phần này</p>
                <Button onClick={onCancel} className="btn btn-primary">
                    Quay lại
                </Button>
            </div>
        )
    }

    const getSectionTitle = () => {
        const titles = {
            "thanh-mau": "A - THANH MẪU",
            "van-mau": "B - VẬN MẪU",
            "thanh-dieu": "C - THANH ĐIỆU",
            cau: "D - CÂU",
        }
        return titles[section] || section
    }

    const getSectionIcon = () => {
        const icons = {
            "thanh-mau": "🎵",
            "van-mau": "🎤",
            "thanh-dieu": "🎶",
            cau: "💬",
        }
        return icons[section] || "📝"
    }

    const getScoreBadgeColor = (score) => {
        if (score === null || score === undefined) return "badge-neutral"
        if (score >= 85) return "badge-success"
        if (score >= 70) return "badge-info"
        if (score >= 50) return "badge-warning"
        return "badge-error"
    }

    const getScoreLabel = (score) => {
        if (score === null || score === undefined) return "Chưa chấm"
        if (score >= 85) return "Tốt"
        if (score >= 70) return "Khá"
        if (score >= 50) return "Trung bình"
        return "Yếu"
    }

    if (allItemsCompleted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">{getSectionTitle()}</h2>
                        <p className="text-2xl font-bold text-blue-600 mb-4">Điểm: {sectionScore?.toFixed(2) || 0}</p>
                        <p className="text-slate-600 mb-8">Bạn đã hoàn thành phần kiểm tra này!</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-slate-900 mb-4">Chi tiết điểm:</h3>
                        <div className="space-y-2">
                            {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200"
                                >
                                    <span className="text-slate-700">
                                        {idx + 1}. {item.text} {item.pinyin && `(${item.pinyin})`}
                                    </span>
                                    <span className="font-bold text-blue-600">{itemScores[idx]?.toFixed(2) || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleCompleteSection} className="btn btn-primary w-full">
                        ➜ Tiếp tục phần tiếp theo
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-lg">
                <h2 className="text-3xl font-bold mb-2">
                    {getSectionIcon()} {getSectionTitle()}
                </h2>
                <p className="text-blue-100">
                    Mục {currentItemIndex + 1} / {items.length}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                {currentItem && (
                    <div className="mb-8">
                        <div className="text-center mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-4xl font-bold text-slate-900">{currentItem.text}</div>
                                {itemScores[currentItemIndex] !== null && (
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`badge badge-lg ${getScoreBadgeColor(itemScores[currentItemIndex])}`}>
                                            {itemScores[currentItemIndex]?.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-slate-600">{getScoreLabel(itemScores[currentItemIndex])}</span>
                                    </div>
                                )}
                            </div>
                            {currentItem.pinyin && <div className="text-xl text-blue-600 mb-2">{currentItem.pinyin}</div>}
                            {currentItem.meaning && <div className="text-slate-600">{currentItem.meaning}</div>}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Result Display Modal */}
                        {currentAttemptResult && (
                            <div className="mb-8 p-6 bg-gradient-to-b from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-md">
                                <div className="text-center mb-6">
                                    <div className="text-5xl mb-3 font-bold text-blue-600">
                                        {currentAttemptResult.score?.toFixed(1) || 0}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">Lần thử: {currentAttemptResult.attemptNumber} / 3</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {getScoreLabel(currentAttemptResult.score)}
                                    </p>
                                </div>

                                {currentAttemptResult.result && (
                                    <div className="space-y-3 mb-6">
                                        {/* Fluency Score */}
                                        {currentAttemptResult.result.fluency !== undefined && (
                                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                                <span className="text-slate-700 font-medium">Độ trôi chảy:</span>
                                                <span className="font-bold text-cyan-600">
                                                    {currentAttemptResult.result.fluency?.toFixed(1) || 0}
                                                </span>
                                            </div>
                                        )}

                                        {/* Completeness Score */}
                                        {currentAttemptResult.result.completeness !== undefined && (
                                            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                                <span className="text-slate-700 font-medium">Độ hoàn chỉnh:</span>
                                                <span className="font-bold text-cyan-600">
                                                    {currentAttemptResult.result.completeness?.toFixed(1) || 0}
                                                </span>
                                            </div>
                                        )}

                                        {/* Wrong Words */}
                                        {currentAttemptResult.result.wrong_words && currentAttemptResult.result.wrong_words.length > 0 && (
                                            <div className="p-3 bg-white rounded-lg">
                                                <p className="text-sm text-slate-700 font-medium mb-2">Từ sai:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentAttemptResult.result.wrong_words.map((word, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                                            {word}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    {currentAttemptCount < 2 && (
                                        <Button
                                            onClick={() => {
                                                setCurrentAttemptCount(currentAttemptCount + 1)
                                                setCurrentAttemptResult(null)
                                                setAudioBlob(null)
                                                setError(null)
                                                setRecordingState("idle")
                                            }}
                                            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600"
                                        >
                                            🔄 Thử lại ({3 - currentAttemptCount - 1} lần còn lại)
                                        </Button>
                                    )}
                                    <Button
                                        onClick={moveToNextItem}
                                        className="flex-1 py-3"
                                    >
                                        {currentAttemptCount === 2 ? "✓ Xác nhận" : "➜ Tiếp theo"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Recording Section (hidden when showing results) */}
                        {!currentAttemptResult && (
                            <>
                                {audioBlob && recordingState !== "analyzing" && (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <Button onClick={playRecordedAudio} className="w-full" variant="secondary">
                                            🔊 Nghe lại bản ghi
                                        </Button>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 mb-8">
                                    {recordingState === "idle" && !audioBlob && (
                                        <Button onClick={startRecording} className="w-full py-4 text-lg" variant="primary">
                                            🎤 Bắt đầu ghi âm
                                        </Button>
                                    )}

                                    {recordingState === "recording" && (
                                        <Button
                                            onClick={stopRecording}
                                            className="w-full py-4 text-lg animate-pulse bg-red-600 hover:bg-red-700"
                                            variant="danger"
                                        >
                                            🔴 Đang thu âm... (Bấm để dừng)
                                        </Button>
                                    )}

                                    {recordingState === "analyzing" && (
                                        <Button disabled className="w-full py-4 text-lg opacity-50">
                                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mr-2"></div>
                                            Đang phân tích...
                                        </Button>
                                    )}

                                    {audioBlob && recordingState === "idle" && (
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => {
                                                    setAudioBlob(null)
                                                    setError(null)
                                                    setRecordingState("idle")
                                                }}
                                                className="flex-1 py-3 bg-transparent"
                                                variant="outline"
                                            >
                                                🔄 Ghi lại
                                            </Button>
                                            <Button
                                                onClick={handleSkipItem}
                                                className="flex-1 py-3 bg-transparent"
                                                variant="outline"
                                            >
                                                ⏭️ Bỏ qua
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="mt-8 bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-700">Tiến độ:</span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {itemScores.filter((s) => s !== null).length} / {items.length}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(itemScores.filter((s) => s !== null).length / items.length) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <Button onClick={onCancel} className="w-full bg-transparent" variant="outline">
                    ✕ Hủy và quay lại danh sách
                </Button>
            </div>
        </div>
    )
}

export default TestSection
