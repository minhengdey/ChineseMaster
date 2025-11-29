"use client"

import { useState, useEffect } from "react"
import AudioPlayer from "./AudioPlayer"
import WordRecordingButton from "./WordRecordingButton"
import SentencePronunciationResult from "./SentencePronunciationResult"
import { iseStatsAPI } from "../../../services/api"
import { hasLetters } from "../../../utils/textUtils"

const VocabularySection = ({
  vocabularies,
  highlightedVocabularyIds = [],
  refreshPronounced,
  lessonId,
  showPinyin = true,
}) => {
  const [localShowPinyin, setLocalShowPinyin] = useState(showPinyin)
  const [pronunciationResult, setPronunciationResult] = useState(null)
  const [showPronunciationResult, setShowPronunciationResult] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState(null)
  // activeItemKey is a string like 'word-<id>' or 'example-<id>' to support both word and example recordings
  const [activeItemKey, setActiveItemKey] = useState(null)
  // local highlighted vocabulary ids (stringified) to update UI instantly after scoring
  const [localHighlightedVocabularyIds, setLocalHighlightedVocabularyIds] = useState([])

  // Debug: print highlighted IDs received from backend so we can verify matching
  if (process.env.NODE_ENV !== "production") {
    try {
      // console.debug(
      //   "[VocabularySection] highlightedVocabularyIds (from API):",
      //   highlightedVocabularyIds,
      //   "local:",
      //   localHighlightedVocabularyIds,
      // )
    } catch (e) {
      // ignore
    }
  }

  // Debug: log when localHighlightedVocabularyIds changes
  useEffect(() => {
    // console.log("[VocabularySection] localHighlightedVocabularyIds changed:", localHighlightedVocabularyIds)
  }, [localHighlightedVocabularyIds])

  // Fetch pronounced stats for this lesson (vocabulary ids) so server-side practiced words
  // are highlighted on initial render — mirrors ConversationSection behavior.
  useEffect(() => {
    let mounted = true
    const fetchPronounced = async () => {
      if (!lessonId) return
      try {
        const stats = await iseStatsAPI.getPronouncedForLesson(lessonId)
        // stats may contain vocabularyIds (array) or entries; prefer aggregated vocabularyIds
        const ids =
          stats && Array.isArray(stats.vocabularyIds) && stats.vocabularyIds.length
            ? stats.vocabularyIds.map(String)
            : Array.isArray(stats.entries)
              ? stats.entries.map((e) => String(e.vocabularyId || e.wordId || e.vocabulary || e.id)).filter(Boolean)
              : []
        if (mounted) setLocalHighlightedVocabularyIds(ids)
      } catch (e) {
        // console.warn("Failed to fetch pronounced stats for lesson", lessonId, e)
      }
    }

    fetchPronounced()
    return () => {
      mounted = false
    }
  }, [lessonId])

  const handlePronunciationScore = async (result, audioBlob, returnedKey, internalKey) => {
    // returnedKey may be something like 'word-<externalId>' or undefined; internalKey is 'word-<internalId>' constructed by the caller
    const keyToUse = internalKey != null ? internalKey : returnedKey
    setPronunciationResult(result)
    setRecordedAudio(audioBlob)
    setActiveItemKey(keyToUse)
    setShowPronunciationResult(true)

    // Immediately add this vocabulary id to local highlighted list so UI updates instantly
    try {
      // Do not add example recordings to the highlighted list. Example keys are prefixed with 'example-'.
      if (String(keyToUse).startsWith("example-")) {
        // skip highlighting for example pronunciations
      } else {
        // Extract external ID from the vocabulary being practiced
        // We need to find the vocabulary object to get its externalId
        const vocabularyId = (keyToUse || "").toString().split("-")[1]
        if (vocabularyId) {
          // Find the vocabulary object to get its externalId
          const vocabulary = vocabularies?.find(v => String(v.id) === String(vocabularyId))
          if (vocabulary && vocabulary.externalId) {
            const externalIdStr = String(vocabulary.externalId)
            // console.log("[VocabularySection] Adding to highlighted:", externalIdStr, "from vocabulary:", vocabulary)
            setLocalHighlightedVocabularyIds((prev) => {
              if (!prev || !Array.isArray(prev)) return [externalIdStr]
              if (prev.map(String).includes(externalIdStr)) return prev
              return [...prev, externalIdStr]
            })
          } else {
            // console.warn("[VocabularySection] Could not find vocabulary for ID:", vocabularyId)
          }
        }
      }
    } catch (e) {
      // console.warn("Failed to append to localHighlightedVocabularyIds", e)
    }

    try {
      if (typeof refreshPronounced === "function") {
        // console.log("[VocabularySection] Calling refreshPronounced...")
        await refreshPronounced()
        // console.log("[VocabularySection] refreshPronounced completed")
      }
    } catch (e) {
      // console.warn("Failed to refresh pronounced after word score:", e)
    }
  }

  const handleStartRecording = (itemKey) => {
    // Xóa kết quả cũ khi bắt đầu thu âm mới
    setShowPronunciationResult(false)
    setPronunciationResult(null)
    setRecordedAudio(null)
    setActiveItemKey(itemKey)
  }
  const getScoreClass = (score) => {
    if (score == null) return null
    const s = Number(score)
    if (isNaN(s)) return null
    if (s >= 80) return "success"
    if (s >= 60) return "warning"
    return "error"
  }

  const extractScoreForActive = (vocabulary) => {
    // If the current active item matches this vocabulary, try to extract a numeric score
    if (!pronunciationResult) return null
    const key = activeItemKey || ""
    if (String(key) !== `word-${vocabulary.id}` && !String(key).startsWith(`word-`)) return null

    // Try a few common paths for the score
    const res = pronunciationResult
    const sent = res?.sentence || res || {}
    const total = sent?.total_score ?? sent?.totalScore ?? res?.total_score ?? res?.totalScore ?? null
    if (total != null) return Number(total)
    // Try extracting from per-word entries if present (safe checks)
    const words = res?.words ?? res?.wordList ?? []
    if (Array.isArray(words) && words.length > 0) {
      const first = words[0] || {}
      const wscore = first?.overall ?? first?.pronunciation ?? first?.score ?? first?.pronunciationScore ?? null
      if (wscore != null) return Number(wscore)
    }
    return null
  }

  const closePronunciationResult = () => {
    setShowPronunciationResult(false)
    setPronunciationResult(null)
    setRecordedAudio(null)
    setActiveItemKey(null)
  }
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "danh từ":
        return "badge-primary"
      case "động từ":
        return "badge-secondary"
      case "tính từ":
        return "badge-accent"
      case "cụm từ":
        return "badge-info"
      case "trạng từ":
        return "badge-warning"
      default:
        return "badge-neutral"
    }
  }

  const renderVocabulary = (vocabulary) => {
    // Follow ConversationSection's pattern: prefer local highlighted ids when available,
    // otherwise fall back to server-provided highlightedVocabularyIds. Build a Set of string ids
    // and accept matches against either externalId or internal id.
    const effectiveHighlighted =
      localHighlightedVocabularyIds && localHighlightedVocabularyIds.length
        ? localHighlightedVocabularyIds
        : highlightedVocabularyIds || []
    // Build a set of normalized ids (strings) and accept matches against externalId
    const highlightedSet = new Set((effectiveHighlighted || []).map(String))
    const isHighlighted = highlightedSet.has(String(vocabulary.externalId))
    // Debug per-vocabulary (mirrors ConversationSection debug pattern)
    if (process.env.NODE_ENV !== "production") {
      try {
        // console.debug(`[VocabularySection] vocab ${vocabulary.externalId} highlighted?`, isHighlighted)
      } catch (e) { }
    }
    // Extract example fields early so they can be used for both the example block
    // and when showing the pronunciation result for example recordings.
    const exampleText = vocabulary.exampleText ?? vocabulary.example?.zh ?? null
    const examplePinyin = vocabulary.examplePinyin ?? vocabulary.example?.pinyin ?? null
    const exampleVn = vocabulary.exampleVn ?? vocabulary.example?.vn ?? null
    const exampleAudio = vocabulary.exampleAudioUrl ?? vocabulary.example?.audioUrl ?? null
    // Determine score-based class if this active result exists for the card
    const scoreValue = extractScoreForActive(vocabulary)
    const scoreClass = getScoreClass(scoreValue)

    // Simple logic: Practice highlighting or default
    let cardHighlightClass = "border-slate-200 bg-white hover:border-purple-300"

    if (isHighlighted) {
      // Practice highlighting - green gradient background + green border color + shadow
      cardHighlightClass = "!border-green-500 !bg-gradient-to-br !from-green-100 !to-emerald-100 !shadow-md"
    }

    // Debug final card class
    if (process.env.NODE_ENV !== "production") {
      try {
        // console.debug(`[VocabularySection] vocab ${vocabulary.externalId} - isHighlighted:`, isHighlighted, 'cardHighlightClass:', cardHighlightClass)
      } catch (e) { }
    }

    return (
      <div
        key={vocabulary.id}
        className={`card shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${cardHighlightClass}`}
      >
        <div className="card-body p-4">
          <div className="relative mb-3">
            <div className="absolute top-0 right-0 flex gap-2">
              {(vocabulary.audioUrl || vocabulary.audioAsset) && (
                <AudioPlayer audioUrl={vocabulary.audioUrl} audioAsset={vocabulary.audioAsset} size="sm" />
              )}
              <WordRecordingButton
                word={vocabulary.word}
                pinyin={vocabulary.pinyin}
                vocabularyId={vocabulary.externalId}
                lessonId={lessonId}
                onScore={(result, audioBlob, returnedKey) =>
                  handlePronunciationScore(result, audioBlob, returnedKey, `word-${vocabulary.id}`)
                }
                onStartRecording={() => handleStartRecording(`word-${vocabulary.id}`)}
                size="xs"
              />
            </div>
            <div className="w-full text-center py-4">
              {(() => {
                const scoreValue = extractScoreForActive(vocabulary)
                const scoreClass = getScoreClass(scoreValue)
                const practicedButNoScore = isHighlighted && scoreValue == null
                if (scoreValue != null) {
                  return (
                    <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                      {vocabulary.word}
                    </div>
                  )
                }
                if (practicedButNoScore) {
                  return (
                    <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                      {vocabulary.word}
                    </div>
                  )
                }
                return (
                  <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                    {vocabulary.word}
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="space-y-1 text-center">
            {localShowPinyin && (
              (() => {
                const scoreValue = extractScoreForActive(vocabulary)
                const scoreClass = getScoreClass(scoreValue)
                if (scoreValue != null) {
                  return <div className="text-sm text-slate-600 mt-1">{vocabulary.pinyin}</div>
                }
                // For practiced items we no longer change the pinyin text color; the card frame/background
                // provides the practiced highlight. Keep pinyin text neutral.
                return <div className="text-sm text-slate-600 mt-1">{vocabulary.pinyin}</div>
              })()
            )}

            {vocabulary.type && (
              <div
                className={`mx-auto badge badge-sm bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200`}
              >
                {vocabulary.type}
              </div>
            )}

            <div className="text-lg text-slate-700 font-medium">{vocabulary.meaning}</div>
          </div>

          {/* Example sentence for this vocabulary (normalized fields or legacy example) */}
          {(() => {
            const hasExample = exampleText || examplePinyin || exampleVn || exampleAudio
            if (!hasExample) return null

            return (
              <div className="mt-2 pt-2 border-t">
                <div className="text-sm text-base-content/70 mb-1 text-center">Ví dụ</div>
                <div className="text-lg font-medium text-center">{exampleText}</div>
                {localShowPinyin && examplePinyin && (
                  <div className="text-sm text-base-content/70 text-center">{examplePinyin}</div>
                )}
                {exampleVn && <div className="text-sm text-base-content/70 text-center">{exampleVn}</div>}
                {exampleAudio && (
                  <div className="mt-2">
                    <AudioPlayer audioUrl={exampleAudio} size="sm" />
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <WordRecordingButton
                    word={exampleText || vocabulary.word}
                    pinyin={examplePinyin || vocabulary.pinyin}
                    /* Do not pass vocabularyId or lessonId for example pronunciations.
                       Example assessments are transient: they should not be persisted
                       to the DB nor mark the word as practiced/highlighted. */
                    onScore={(result, audioBlob, returnedKey) =>
                      handlePronunciationScore(result, audioBlob, returnedKey, `example-${vocabulary.id}`)
                    }
                    onStartRecording={() => handleStartRecording(`example-${vocabulary.id}`)}
                    size="xs"
                  />
                </div>
              </div>
            )
          })()}

          {/* Hiển thị kết quả đánh giá phát âm cho word này */}
          {showPronunciationResult &&
            (String(activeItemKey) === `word-${vocabulary.id}` ||
              String(activeItemKey) === `example-${vocabulary.id}`) && (
              <SentencePronunciationResult
                result={pronunciationResult}
                recordedAudio={recordedAudio}
                onClose={closePronunciationResult}
                sentenceText={
                  String(activeItemKey) === `example-${vocabulary.id}`
                    ? exampleText || vocabulary.word
                    : vocabulary.word
                }
              />
            )}
        </div>
      </div>
    )
  }

  // Filter out vocabulary items whose main display text (word or example) contains no letters
  const visibleVocabularies = (vocabularies || []).filter((v) =>
    hasLetters(v?.word || v?.exampleText || "")
  )

  if (!visibleVocabularies || visibleVocabularies.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          Chưa có từ vựng nào
        </h3>
        <p className="text-slate-600">Từ vựng sẽ được cập nhật sớm.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
          onClick={() => setLocalShowPinyin((s) => !s)}
        >
          {localShowPinyin ? "👁️ Ẩn pinyin" : "👁️ Hiện pinyin"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{visibleVocabularies.map(renderVocabulary)}</div>
    </div>
  )
}

export default VocabularySection
