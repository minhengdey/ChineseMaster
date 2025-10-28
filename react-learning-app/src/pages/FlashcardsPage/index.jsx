"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { contentAPI } from "../../services/api"
import { Search, X, Layers, BookOpen } from "lucide-react"

const FlashcardsIndex = () => {
  const [curriculums, setCurriculums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await contentAPI.getCurriculums()
        if (!mounted) return
        setCurriculums(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error("Failed to load curriculums", e)
        setError("Không thể tải bài học")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return curriculums
    return curriculums.filter(
      (c) => (c.title || c.name || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q),
    )
  }, [curriculums, query])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="container-max px-4">
        <div className="mb-8 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 rounded-3xl p-8 text-white shadow-lg animate-fade-in flex items-center gap-3">
          <Layers size={40} />
          <div>
            <h1 className="text-4xl font-bold mb-2">Flash Cards</h1>
            <p className="text-purple-100">Chọn khóa học để bắt đầu ôn tập bằng flashcards</p>
          </div>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="search-input-wrapper">
              <input
                type="search"
                placeholder="Tìm khóa học..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
              />
              <Search size={18} className="search-icon-lucide" />
              {query && (
                <button className="input-clear-btn" onClick={() => setQuery("")}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Layers size={80} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Không có khóa học nào</h3>
            <p className="text-slate-600">Thử thay đổi từ khóa tìm kiếm hoặc quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((c) => (
              <Link key={c.id} to={`/flashcards/${c.id}`} className="group">
                <div className="card overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col bg-white border border-slate-200 hover:border-purple-300 card-hover">
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50 flex-1">
                    <h3 className="card-title text-lg text-slate-900 group-hover:text-purple-600 transition-colors">
                      {c.title || c.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{c.description || ""}</p>
                  </div>

                  <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
                    <span className="text-xs text-slate-500 font-semibold">{c.lessons?.length ?? "-"} bài</span>
                    <button className="btn-accent-custom btn-sm">Mở →</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const FlashcardsCurriculum = () => {
  const { curriculumId } = useParams()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await contentAPI.getCurriculumById(curriculumId)
        if (!mounted) return
        setLessons(Array.isArray(data?.lessons) ? data.lessons : [])
      } catch (e) {
        console.error("Failed to load curriculum", e)
        setError("Không thể tải danh sách bài")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (curriculumId) load()
    return () => {
      mounted = false
    }
  }, [curriculumId])

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bài trong khóa học</h1>
            <p className="text-slate-600 mt-1">Chọn bài để luyện tập</p>
          </div>
          <Link to="/flashcards" className="btn btn-ghost">
            ← Quay lại
          </Link>
        </div>

        {error && (
          <div className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl">
            {error}
          </div>
        )}

        {lessons.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={80} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">Không có bài nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lessons.map((l) => (
              <Link key={l.id} to={`/flashcard/${curriculumId}/lesson/${l.id}`} className="group">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 card-hover hover:border-purple-300">
                  <div className="p-4 bg-gradient-to-r from-white to-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                          {l.title || l.name}
                        </div>
                        <div className="text-sm text-slate-600 mt-1 truncate">{l.description || ""}</div>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold whitespace-nowrap ml-2 bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-1 rounded-full">
                        {l.cardsCount ? `${l.cardsCount} thẻ` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FlashcardsIndex
