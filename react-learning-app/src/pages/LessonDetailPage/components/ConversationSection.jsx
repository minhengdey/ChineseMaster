"use client"

import { useState, useEffect } from "react"
import AudioPlayer from "./AudioPlayer"
import SentenceRecordingButton from "./SentenceRecordingButton"
import SentencePronunciationResult from "./SentencePronunciationResult"
import { hasLetters } from "../../../utils/textUtils"

const ConversationSection = ({ conversations = [], lessonId, highlightedLineIds = [], refreshPronounced }) => {
  const [expandedSection, setExpandedSection] = useState(null)
  const [pronunciationResult, setPronunciationResult] = useState(null)
  const [showPronunciationResult, setShowPronunciationResult] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [activeLineId, setActiveLineId] = useState(null)
  const [localHighlightedLineIds, setLocalHighlightedLineIds] = useState(() =>
    Array.isArray(highlightedLineIds) ? highlightedLineIds.map(String) : [],
  )
  const [showPinyin, setShowPinyin] = useState(true)

  // Sync from parent (single source: parent fetches pronounced once)
  useEffect(() => {
    if (Array.isArray(highlightedLineIds) && highlightedLineIds.length >= 0) {
      setLocalHighlightedLineIds(highlightedLineIds.map(String))
    }
  }, [lessonId, highlightedLineIds])

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index)
  }

  const handlePronunciationScore = async (result, audioBlob, returnedLineId, internalLineId, externalLineId) => {
    // returnedLineId may be externalId or internal id depending on recorder logic.
    // internalLineId is numeric internal id; externalLineId is the stable external id from content DTO.
    // console.log("handlePronunciationScore ids:", { returnedLineId, internalLineId, externalLineId })
    setPronunciationResult(result)
    setRecordedAudio(audioBlob)
    // Use externalLineId as active id for highlighting/result-panel so comparisons match line.externalId
    const activeId =
      externalLineId != null
        ? String(externalLineId)
        : returnedLineId != null
          ? String(returnedLineId)
          : internalLineId != null
            ? String(internalLineId)
            : null
    setActiveLineId(activeId)
    setShowPronunciationResult(true)

    // Immediately add this line's external id to local highlighted list so UI updates instantly
    try {
      const idStr =
        externalLineId != null
          ? String(externalLineId)
          : returnedLineId != null
            ? String(returnedLineId)
            : internalLineId != null
              ? String(internalLineId)
              : null
      if (idStr) {
        setLocalHighlightedLineIds((prev) => {
          if (!prev || !Array.isArray(prev)) return [idStr]
          if (prev.map(String).includes(idStr)) return prev
          return [...prev, idStr]
        })
      }
    } catch (e) {
      // console.warn("Failed to append to localHighlightedLineIds", e)
    }

    // Refresh pronounced stats so highlighting/progress updates live
    try {
      if (typeof refreshPronounced === "function") {
        await refreshPronounced()
      }
    } catch (e) {
      // console.warn("Failed to refresh pronounced after score:", e)
    }
  }

  const handleStartRecording = (lineId) => {
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowPronunciationResult(false)
    setPronunciationResult(null)
    setRecordedAudio(null)
    setActiveLineId(lineId)
  }

  const closePronunciationResult = () => {
    setShowPronunciationResult(false)
    setPronunciationResult(null)
    setRecordedAudio(null)
    setActiveLineId(null)
  }

  // Filter out conversations and lines that have no letters in their main display text
  const visibleConversations = (conversations || [])
    .map((c) => ({ ...c, visibleLines: (c.lines || []).filter((line) => hasLetters(line?.zh || line?.zhText || line?.pinyin || line?.text || "")) }))
    .filter((c) => Array.isArray(c.visibleLines) && c.visibleLines.length > 0)

  if (!visibleConversations || visibleConversations.length === 0) {
    return (
      <div className="text-center py-14 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
          💬
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Chưa có hội thoại nào</h3>
        <p className="text-slate-600">Nội dung hội thoại sẽ được cập nhật sớm.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-pink-600 bg-pink-50 border border-pink-200 hover:bg-pink-100 hover:border-pink-300 transition-colors"
          onClick={() => setShowPinyin((s) => !s)}
        >
          {showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
        </button>
      </div>
      {visibleConversations.map((conversation, index) => (
        <div
          key={conversation.id ?? index}
          className="rounded-2xl bg-gradient-to-br from-white to-violet-50/80 border border-violet-200/80 shadow-sm overflow-hidden"
        >
          <div className="p-5 sm:p-6 lg:p-8">
            <div
              className="flex justify-between items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity -m-1 p-1 rounded-xl"
              onClick={() => toggleSection(index)}
            >
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                Bài khóa {conversation.order}: {conversation.section}
              </h3>
              <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">
                {expandedSection === index ? "▼" : "▶"}
              </span>
            </div>

            {(conversation.vnTranslation || conversation.vn) && (
              <p className="mt-3 text-slate-600 italic text-sm sm:text-base">
                {conversation.vnTranslation || conversation.vn}
              </p>
            )}

            {expandedSection === index && (
              <div className="mt-6 space-y-4">
                {conversation.visibleLines?.map((line) => {
                  const effectiveHighlighted =
                    localHighlightedLineIds && localHighlightedLineIds.length
                      ? localHighlightedLineIds
                      : highlightedLineIds || []
                  const highlightedSet = new Set((effectiveHighlighted || []).map(String))
                  const isHighlighted =
                    highlightedSet.has(String(line.externalId)) || highlightedSet.has(String(line.id))

                  return (
                    <div
                      key={line.externalId ?? line.id}
                      className={`p-5 sm:p-6 rounded-xl transition-all ${isHighlighted
                        ? "bg-emerald-50/90 border-2 border-emerald-300 shadow-sm"
                        : "bg-slate-50 border border-slate-200"
                        }`}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                        <span className="font-semibold text-violet-700 text-sm sm:text-base">
                          {line.speaker}
                        </span>

                        <div className="flex gap-2 flex-shrink-0">
                          {(line.audioUrl || line.audioAsset) && (
                            <AudioPlayer audioUrl={line.audioUrl} audioAsset={line.audioAsset} />
                          )}

                          <SentenceRecordingButton
                            text={line.pinyin}
                            hanzi={line.zh || line.zhText}
                            lineId={line.externalId}
                            onScore={(result, audioBlob, returnedLineId) =>
                              handlePronunciationScore(result, audioBlob, returnedLineId, line.id, line.externalId)
                            }
                            onStartRecording={() => handleStartRecording(line.externalId)}
                            size="xs"
                            lessonId={lessonId}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <div className="text-xl sm:text-2xl font-bold text-slate-800">
                          {line.zh || line.zhText}
                        </div>
                        {showPinyin && (
                          <div className="text-base text-slate-600">{line.pinyin}</div>
                        )}
                        <div className="text-slate-600 italic text-sm sm:text-base">
                          {line.vn || line.vnTranslation}
                        </div>
                      </div>

                      {showPronunciationResult && String(activeLineId) === String(line.externalId) && (
                        <div className="mt-5 pt-4 border-t border-slate-200">
                          <SentencePronunciationResult
                            result={pronunciationResult}
                            recordedAudio={recordedAudio}
                            onClose={closePronunciationResult}
                            sentenceText={
                              line.zh || line.zhText || line.pinyin || line.text || line.conversationLine || ""
                            }
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ConversationSection
