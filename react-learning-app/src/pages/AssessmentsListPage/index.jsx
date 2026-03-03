"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { assessmentAPI } from "../../services/api"
import { Button } from "@/components/ui"
import PageLayout from "../../components/layout/PageLayout"
import {
  PageHeader,
  FilterTabs,
  AssessmentCard,
  StartAssessmentModal,
} from "./components"

const _assessmentsListInFlight = { promise: null }

const AssessmentsListPage = () => {
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")
  const [showStartModal, setShowStartModal] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState(null)

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      const data = await assessmentAPI.getAllAssessments()
      const normalized = (data || []).map((a) => ({
        ...a,
        id: a?.id != null ? String(a.id) : a.id,
      }))
      setAssessments(normalized)
      setError(null)
    } catch (err) {
      setError("Không thể tải danh sách bài kiểm tra")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const run = async () => {
      if (_assessmentsListInFlight.promise) {
        try {
          const list = await _assessmentsListInFlight.promise
          if (mounted) {
            setAssessments(Array.isArray(list) ? list : [])
            setError(null)
          }
        } catch (err) {
          if (mounted) setError("Không thể tải danh sách bài kiểm tra")
        } finally {
          if (mounted) setLoading(false)
        }
        return
      }
      _assessmentsListInFlight.promise = (async () => {
        try {
          const data = await assessmentAPI.getAllAssessments()
          const normalized = (data || []).map((a) => ({
            ...a,
            id: a?.id != null ? String(a.id) : a.id,
          }))
          if (mounted) {
            setAssessments(normalized)
            setError(null)
          }
          return normalized
        } catch (err) {
          if (mounted) setError("Không thể tải danh sách bài kiểm tra")
          throw err
        } finally {
          _assessmentsListInFlight.promise = null
          if (mounted) setLoading(false)
        }
      })()
      await _assessmentsListInFlight.promise
    }
    run()
    return () => { mounted = false }
  }, [])

  const getFilteredAssessments = () => {
    if (filter === "all") return assessments
    if (filter === "completed") return assessments.filter((a) => a.completed)
    if (filter === "pending") return assessments.filter((a) => !a.completed)
    return assessments
  }

  const handleStartAssessment = (assessment) => {
    setSelectedAssessment(assessment)
    setShowStartModal(true)
  }

  const handleConfirmStart = () => {
    if (selectedAssessment) navigate(`/assessment/${selectedAssessment.id}`)
    setShowStartModal(false)
    setSelectedAssessment(null)
  }

  const completedCount = assessments.filter((a) => a.completed).length
  const pendingCount = assessments.filter((a) => !a.completed).length

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-48 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <div className="min-h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">{error}</h2>
            <Button onClick={fetchAssessments} className="rounded-xl">Thử lại</Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  const filteredAssessments = getFilteredAssessments()

  return (
    <PageLayout>
      <PageHeader
        total={assessments.length}
        completed={completedCount}
        pending={pendingCount}
      />

      <FilterTabs
        filter={filter}
        onFilterChange={setFilter}
        total={assessments.length}
        completed={completedCount}
        pending={pendingCount}
      />

      {filteredAssessments.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Chưa có bài kiểm tra</h3>
          <p className="text-slate-500">Các bài kiểm tra sẽ xuất hiện ở đây</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onStart={handleStartAssessment}
            />
          ))}
        </div>
      )}

      {showStartModal && selectedAssessment && (
        <StartAssessmentModal
          assessment={selectedAssessment}
          onConfirm={handleConfirmStart}
          onCancel={() => {
            setShowStartModal(false)
            setSelectedAssessment(null)
          }}
        />
      )}
    </PageLayout>
  )
}

export default AssessmentsListPage
