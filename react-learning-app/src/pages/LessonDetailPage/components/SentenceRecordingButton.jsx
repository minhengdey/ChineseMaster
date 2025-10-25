"use client"

import { useState, useRef } from "react"
import { iseAPI } from "../../../services/api"
import { createRecorder, computeSha256Hex, playBlobSafely } from "../../../utils/audioUtils"

const SentenceRecordingButton = ({ text, hanzi, lessonId, lineId, onScore, onStartRecording, size = "sm" }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const startRecording = async () => {
    setError(null)
    setAudioBlob(null)
    setIsAnalyzing(false)

    if (onStartRecording) onStartRecording()

    try {
      const rec = await createRecorder({ mimeType: "audio/webm;codecs=opus" })
      mediaRecorderRef.current = rec // object with start/stop
      chunksRef.current = []
      streamRef.current = rec.stream
      await rec.start()
      setIsRecording(true)
    } catch (error) {
      // console.error("Error starting recording:", error)
      setError("Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.")
      setIsRecording(false)
    }
  }

  const stopRecording = async () => {
    // Use our recorder wrapper (mediaRecorderRef) presence as the signal to stop.
    if (!mediaRecorderRef.current) return

    setIsRecording(false)
    try {
      const rec = mediaRecorderRef.current
      const { blob, stream } = await rec.stop()
      try {
        if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop())
      } catch (e) { }
      setAudioBlob(blob)
      // Auto analyze shortly after finalization
      setTimeout(() => submitForAnalysisWithBlob(blob), 150)
    } catch (err) {
      // console.error("Error during finalize:", err)
      setError("Không thể hoàn tất ghi âm. Vui lòng thử lại.")
    }
  }

  const submitForAnalysisWithBlob = async (blob) => {
    if (!blob) {
      setError("Không có file âm thanh để phân tích")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Sử dụng hanzi nếu có, nếu không thì dùng text
      const textToAnalyze = hanzi || text

      if (!textToAnalyze) {
        throw new Error("Không có text để phân tích")
      }

      // console.log("Auto-analyzing sentence:", textToAnalyze)
      // console.log("Audio blob type:", blob.type)
      // console.log("Audio blob size:", blob.size)

      // Add helpful metadata: mime, size, sha256
      const mime = blob.type || "audio/webm"
      const size = blob.size
      const sha256 = await computeSha256Hex(blob)

      const payload = {
        text: textToAnalyze,
        audioFile: blob,
        mimeType: mime,
        size: String(size),
        sha256,
      }
      if (lessonId !== undefined && lessonId !== null) payload.lessonId = lessonId
      if (lineId !== undefined && lineId !== null) payload.lineId = String(lineId)

      const result = await iseAPI.scoreSentence(payload)

      // console.log("Analysis result:", result)

      if (result && result.success !== false && onScore) {
        onScore(result, blob, lineId)
      } else {
        setError(result?.error || result?.message || "Không thể đánh giá phát âm. Vui lòng thử lại.")
      }
    } catch (error) {
      // console.error("Error analyzing audio:", error)
      setError(error.message || "Không thể đánh giá phát âm. Vui lòng kiểm tra kết nối mạng và thử lại.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const submitForAnalysis = async () => {
    return submitForAnalysisWithBlob(audioBlob)
  }

  const playRecordedAudio = () => {
    if (audioBlob) {
      playBlobSafely(audioBlob).catch((error) => {
        // console.error("Error playing audio:", error)
        setError("Không thể phát âm thanh đã ghi")
      })
    }
  }

  const retry = () => {
    setAudioBlob(null)
    setError(null)
    setIsAnalyzing(false)
  }

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "btn-xs text-xs"
      case "sm":
        return "btn-sm text-sm"
      case "md":
        return "btn-md"
      case "lg":
        return "btn-lg text-lg"
      default:
        return "btn-sm text-sm"
    }
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="alert alert-error bg-rose-100 border border-rose-300 text-rose-800 shadow-md">
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button className={`btn btn-warning btn-accent-custom ${getSizeClasses()}`} onClick={retry}>
          🔄 Thử lại
        </button>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <button className={`btn btn-accent-custom ${getSizeClasses()}`} disabled>
        <span className="loading loading-spinner loading-xs"></span>
        Đang phân tích...
      </button>
    )
  }

  if (isRecording) {
    return (
      <button className={`btn btn-danger-custom shadow-lg ${getSizeClasses()}`} onClick={stopRecording}>
        🔴 Đang thu âm... Bấm để dừng
      </button>
    )
  }

  return (
    <button className={`btn btn-primary-custom shadow-md ${getSizeClasses()}`} onClick={startRecording} title="Bắt đầu ghi âm để luyện phát âm">
      🎤 Luyện phát âm
    </button>
  )
}

export default SentenceRecordingButton
