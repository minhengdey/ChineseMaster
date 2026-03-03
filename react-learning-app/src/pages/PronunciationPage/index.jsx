"use client"

import { useState, useEffect, useCallback } from "react"
import { contentAPI } from "../../services/api"
import SentencePronunciationResult from "../LessonDetailPage/components/SentencePronunciationResult"
import PageLayout from "../../components/layout/PageLayout"
import {
  PronunciationHero,
  SearchControls,
  VocabularyCard,
  PaginationBar,
} from "./components"

const LESSONS_PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300
const MIN_SEARCH_LENGTH = 2

// Dedupe Strict Mode double-invocation: one fetch per (mode, query, page).
const _lastFetchKey = { value: null }

const flattenVocabFromLessonDetails = (lessonDetails) => {
  const list = []
  ;(lessonDetails || []).forEach((lesson) => {
    ;(lesson.vocabularies || []).forEach((v) => {
      list.push({
        ...v,
        lessonId: lesson.id,
        lessonTitle: lesson.title ?? lesson.name,
        curriculumId: lesson.curriculumId ?? null,
      })
    })
  })
  return list
}

const PronunciationPage = () => {
  const [vocabList, setVocabList] = useState([])
  const [vocabLoading, setVocabLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [showPinyin, setShowPinyin] = useState(true)
  const [pronunciationResult, setPronunciationResult] = useState(null)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [showPronunciationResult, setShowPronunciationResult] = useState(false)
  const [activeItemKey, setActiveItemKey] = useState(null)

  const isSearchMode = debouncedQuery.length >= MIN_SEARCH_LENGTH

  // Debounce search input; reset to page 1 when query changes
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery((searchTerm || "").trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchTerm])

  const fetchData = useCallback(async () => {
    setVocabLoading(true)
    try {
      if (isSearchMode) {
        const result = await contentAPI.searchVocabulary(
          debouncedQuery,
          page - 1,
          LESSONS_PAGE_SIZE
        )
        setVocabList(result.content ?? [])
        setTotalPages(Math.max(1, result.totalPages))
        setTotalElements(result.totalElements ?? 0)
      } else {
        const result = await contentAPI.getLessonDetailsBatchPaginated(
          page - 1,
          LESSONS_PAGE_SIZE
        )
        const list = flattenVocabFromLessonDetails(result.content)
        setVocabList(list)
        setTotalPages(Math.max(1, result.totalPages))
        setTotalElements(result.totalElements ?? 0)
      }
    } catch {
      setVocabList([])
    } finally {
      setVocabLoading(false)
    }
  }, [debouncedQuery, page, isSearchMode])

  useEffect(() => {
    const key = isSearchMode
      ? `search:${debouncedQuery}:${page}`
      : `browse:${page}`
    if (_lastFetchKey.value === key) {
      _lastFetchKey.value = null
      return
    }
    _lastFetchKey.value = key
    fetchData()
  }, [debouncedQuery, page, isSearchMode, fetchData])

  const handleRefresh = useCallback(() => {
    setPage(1)
  }, [])

  return (
    <PageLayout>
      <PronunciationHero />

      <SearchControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={handleRefresh}
        showPinyin={showPinyin}
        onTogglePinyin={() => setShowPinyin((s) => !s)}
      />

      {vocabLoading ? (
        <div className="min-h-48 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-purple-500" />
        </div>
      ) : vocabList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-slate-600 font-medium">
            {isSearchMode && debouncedQuery
              ? `Không tìm thấy từ vựng cho "${debouncedQuery}".`
              : "Không tìm thấy từ vựng."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vocabList.map((item) => (
              <VocabularyCard
                key={item.id || item.word + item.pinyin}
                item={item}
                showPinyin={showPinyin}
                onStartRecording={() => {
                  setShowPronunciationResult(false)
                  setPronunciationResult(null)
                  setRecordedAudio(null)
                  setActiveItemKey(`word-${item.externalId || item.id}`)
                }}
                onScore={(result, audioBlob) => {
                  setPronunciationResult(result)
                  setRecordedAudio(audioBlob)
                  setActiveItemKey(`word-${item.externalId || item.id}`)
                  setShowPronunciationResult(true)
                }}
              />
            ))}
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={totalElements}
            onPageChange={setPage}
          />
        </>
      )}

      {showPronunciationResult && pronunciationResult && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/30">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
            <SentencePronunciationResult
              result={pronunciationResult}
              recordedAudio={recordedAudio}
              sentenceText={
                activeItemKey?.startsWith("word-")
                  ? (vocabList.find((v) => `word-${v.externalId || v.id}` === activeItemKey) || {}).word
                  : null
              }
              onClose={() => {
                setShowPronunciationResult(false)
                setPronunciationResult(null)
                setRecordedAudio(null)
                setActiveItemKey(null)
              }}
            />
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default PronunciationPage
