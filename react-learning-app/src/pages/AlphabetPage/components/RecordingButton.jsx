"use client"

import { useState, useRef } from "react"
import { iseAPI } from "../../../services/api"
import { createRecorder, computeSha256Hex, playBlobSafely } from "../../../utils/audioUtils"
import { Mic, RotateCcw } from "lucide-react"

const RecordingButton = ({ text, hanzi, onScore, onStartRecording, size = "xs" }) => {
  // If the reference character/text contains no letters (digits/punctuation only), do not render the recording UI.
  const ref = (hanzi || text || "").trim();
  try {
    if (ref && !/\p{L}/u.test(ref)) return null;
  } catch (e) {
    if (ref && !/[A-Za-z]/.test(ref)) return null;
  }
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const recorderRef = useRef(null)

  const startRecording = async () => {
    setError(null)
    setAudioBlob(null)
    setIsAnalyzing(false)
    if (onStartRecording) onStartRecording()
    try {
      const rec = await createRecorder({
        mimeType: "audio/webm;codecs=opus",
      })
      recorderRef.current = rec
      await rec.start()
      setIsRecording(true)
    } catch (e) {
      // console.error("startRecording failed", e)
      setError("Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.")
    }
  }

  const stopRecording = async () => {
    setIsRecording(false)
    try {
      if (!recorderRef.current) return
      const rec = recorderRef.current
      const { blob, stream } = await rec.stop()
      try {
        if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop())
      } catch (e) { }
      setAudioBlob(blob)
      setTimeout(() => submitForAnalysisWithBlob(blob), 150)
    } catch (e) {
      // console.error("stopRecording error", e)
      setError("Không thể hoàn tất ghi âm. Vui lòng thử lại.")
    }
  }

  const submitForAnalysisWithBlob = async (blob) => {
    if (!blob) {
      setError("Không có file âm thanh để phân tích")
      return
    }
    if (!hanzi) {
      setError("Không có ký tự để đánh giá")
      return
    }
    if (blob.size === 0) {
      setError("File âm thanh trống. Vui lòng thu âm lại.")
      return
    }
    if (blob.size > 5 * 1024 * 1024) {
      setError("File âm thanh quá lớn. Vui lòng thu âm ngắn hơn.")
      return
    }
    setIsAnalyzing(true)
    setError(null)
    try {
      const textToAnalyze = hanzi
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

      const result = await iseAPI.scoreWord(payload)

      if (result && result.require_retry) {
        setError(result.message || "Ghi âm không đủ rõ. Vui lòng ghi lại và thử lại.")
        return
      }

      const raw = result?.raw_response ?? result

      // Normalize result similar to existing logic in file
      // Normalize into a predictable shape that SentencePronunciationResult expects.
      let normalized = raw
      if (typeof raw === "object") {
        const sent = raw.sentence || {}
        // pull raw arrays
        const rawWords = raw.words ?? sent.words ?? []
        const rawPhonemes = raw.phonemes ?? sent.phonemes ?? []

        // normalize words: ensure common keys exist for SentencePronunciationResult
        const wordsArr = (Array.isArray(rawWords) ? rawWords : []).map((w) => {
          const overall = w?.overall ?? w?.total_score ?? w?.totalScore ?? w?.pronunciation ?? w?.score ?? w?.pronunciationScore ?? null
          const pronunciation = w?.pronunciation ?? w?.overall ?? w?.score ?? null
          return {
            ...w,
            overall: overall != null ? Number(overall) : null,
            pronunciation: pronunciation != null ? Number(pronunciation) : null,
            duration: w?.duration ?? w?.time_len ?? w?.timeLen ?? null,
            phonemes: w?.phonemes ?? w?.phones ?? w?.phoneme_list ?? w?.phonemeList ?? null,
            initial_score: w?.initial_score ?? w?.initialScore ?? null,
            final_score: w?.final_score ?? w?.finalScore ?? null,
            tone_score: w?.tone_score ?? w?.toneScore ?? null,
          }
        })

        // normalize phonemes
        const phonemesArr = (Array.isArray(rawPhonemes) ? rawPhonemes : []).map((p) => ({
          ...p,
          phoneme: p?.phoneme ?? p?.phone ?? null,
          phoneme_display: p?.phoneme_display ?? p?.phonemeDisplay ?? null,
          score: p?.score ?? p?.pronunciation ?? null,
          mono_tone: p?.mono_tone ?? p?.monoTone ?? null,
        }))

        const sentenceObj = {
          total_score: sent.total_score ?? raw.total_score ?? raw.totalScore ?? raw.overall ?? null,
          fluency: sent.fluency ?? raw.fluency ?? null,
          completeness: sent.completeness ?? raw.completeness ?? null,
          pronunciation: sent.pronunciation ?? raw.pronunciation ?? null,
          tone: sent.tone ?? raw.tone ?? null,
          wrong_words: sent.wrong_words ?? raw.wrong_words ?? raw.wrongWords ?? [],
          sid: sent.sid ?? raw.sid ?? null,
          status: sent.status ?? raw.status ?? null,
          raw_xml: sent.raw_xml ?? raw.raw_xml ?? null,
          words: wordsArr,
          phonemes: phonemesArr,
          is_rejected: sent.is_rejected ?? raw.is_rejected ?? false,
          except_info: sent.except_info ?? raw.except_info ?? null,
          warning: sent.warning ?? raw.warning ?? null,
        }

        // Mirror important fields at top-level as well so caller code that checks either
        // `result.sentence` or `result` finds consistent data.
        normalized = {
          sentence: sentenceObj,
          words: wordsArr,
          phonemes: phonemesArr,
          total_score: sentenceObj.total_score,
          fluency: sentenceObj.fluency,
          completeness: sentenceObj.completeness,
          pronunciation: sentenceObj.pronunciation,
          tone: sentenceObj.tone,
        }
      }

      onScore && onScore(normalized, blob)
    } catch (err) {
      // console.error("submitForAnalysisWithBlob error", err)
      setError(err.message || "Không thể đánh giá phát âm. Vui lòng thử lại.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const playRecordedAudio = () => {
    if (!audioBlob) return
    playBlobSafely(audioBlob).catch((err) => {
      // console.error("playback error", err)
      setError("Không thể phát âm thanh đã ghi")
    })
  }

  const retry = () => {
    setAudioBlob(null)
    setError(null)
    setIsAnalyzing(false)
  }

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "px-3 py-2 text-xs"
      case "sm":
        return "px-4 py-2 text-sm"
      case "md":
        return "px-5 py-2.5 text-base"
      case "lg":
        return "px-6 py-3 text-lg"
      default:
        return "px-3 py-2 text-xs"
    }
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 text-rose-700 p-4 shadow-sm transition-all duration-300">
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          className={`rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 ${getSizeClasses()}`}
          onClick={retry}
        >
          <RotateCcw size={16} className="inline mr-2" />
          Thử lại
        </button>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <button
        className={`rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium transition-all duration-300 shadow-md ${getSizeClasses()}`}
        disabled
      >
        <span className="loading loading-spinner loading-xs mr-2"></span>
        Đang phân tích...
      </button>
    )
  }

  if (isRecording) {
    return (
      <button
        className={`rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl ${getSizeClasses()}`}
        onClick={stopRecording}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
          Đang thu âm...
        </div>
      </button>
    )
  }

  return (
    <button
      className={`rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 ${getSizeClasses()}`}
      onClick={startRecording}
      title="Bắt đầu ghi âm để luyện phát âm"
    >
      <Mic size={18} />
    </button>
  )
}

export default RecordingButton

