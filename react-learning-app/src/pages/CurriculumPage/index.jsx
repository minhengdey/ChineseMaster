"use client"

import { useState, useEffect } from "react"
import { contentAPI, handleApiError } from "../../services/api"
import CurriculumList from "./components/CurriculumList"
import { BookOpen } from "lucide-react"

const CurriculumPage = () => {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);
  const [curriculums, setCurriculums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurriculums()
  }, [])

  const fetchCurriculums = async () => {
    try {
      const data = await contentAPI.getCurriculums()
      setCurriculums(data)
    } catch (error) {
      console.error("Error fetching curriculums:", handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="loading"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 slide-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <BookOpen size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Bài học</h1>
          </div>
          <p className="text-lg text-slate-600">Chọn bài học phù hợp để bắt đầu hành trình học tiếng Trung của bạn</p>
        </div>

        <CurriculumList curriculums={curriculums} />
      </div>
    </div>
  )
}

export default CurriculumPage
