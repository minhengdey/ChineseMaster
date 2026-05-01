import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { adminStatsAPI } from "../../services/api"
import { useUserStore } from "../../store/UserStore"
import PageLayout from "../../components/layout/PageLayout"
import { getExamLeaderboardSheetOverride } from "../../utils/adminSheetOverrides"
import {
  WeeklySection,
  LessonSection,
  ExamSection,
  UsersSection,
  AdminHero,
} from "./components"

// Cache + in-flight per tab: chỉ gọi API khi vào tab, mỗi tab chỉ gọi 1 lần (cache)
const _adminTabCache = { lessons: null, exams: null, users: null }
const _adminTabInFlight = { lessons: null, exams: null, users: null }
const _adminWeeklyCache = {}
const _adminWeeklyInFlight = {}

const AdminDashboard = () => {
  const [searchParams] = useSearchParams()
  const [lessons, setLessons] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [exams, setExams] = useState([])
  const [users, setUsers] = useState([])
  const [weeklyRows, setWeeklyRows] = useState([])
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [examsLoading, setExamsLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [weeklyError, setWeeklyError] = useState(null)
  const [weeklyRequested, setWeeklyRequested] = useState(false)
  const [error, setError] = useState(null)

  const user = useUserStore((s) => s.user)
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN"

  const currentView = searchParams.get("tab") || searchParams.get("view") || "weekly"

  // Tab "lesson": chỉ fetch khi vào tab, dùng cache + in-flight
  useEffect(() => {
    if (!isAdmin || currentView !== "lesson") return
    if (_adminTabCache.lessons != null) {
      setLessons(_adminTabCache.lessons)
      if (_adminTabCache.lessons.length > 0) setActiveLesson((prev) => (prev == null ? _adminTabCache.lessons[0].lessonId : prev))
      return
    }
    let mounted = true
    setLessonsLoading(true)
    setError(null)
    const run = async () => {
      if (_adminTabInFlight.lessons) {
        try {
          const list = await _adminTabInFlight.lessons
          if (mounted) {
            setLessons(list ?? [])
            if ((list ?? []).length > 0) setActiveLesson(list[0].lessonId)
          }
        } catch (_) {
          if (mounted) setError("Không thể tải BXH theo bài")
        } finally {
          if (mounted) setLessonsLoading(false)
        }
        return
      }
      _adminTabInFlight.lessons = (async () => {
        try {
          const l = await adminStatsAPI.getLessonLeaderboards()
          const list = Array.isArray(l?.lessons) ? l.lessons : []
          _adminTabCache.lessons = list
          if (mounted) {
            setLessons(list)
            if (list.length > 0) setActiveLesson(list[0].lessonId)
            setError(null)
          }
          return list
        } catch (e) {
          if (mounted) setError(e?.message || "Không thể tải BXH theo bài")
          throw e
        } finally {
          _adminTabInFlight.lessons = null
          if (mounted) setLessonsLoading(false)
        }
      })()
      await _adminTabInFlight.lessons
    }
    run()
    return () => { mounted = false }
  }, [isAdmin, currentView])

  // Tab "test": chỉ fetch khi vào tab
  useEffect(() => {
    if (!isAdmin || currentView !== "test") return
    const sheetExams = getExamLeaderboardSheetOverride()
    if (Array.isArray(sheetExams) && sheetExams.length > 0) {
      setExams(sheetExams)
      setExamsLoading(false)
      return
    }
    if (_adminTabCache.exams != null) {
      setExams(_adminTabCache.exams)
      return
    }
    let mounted = true
    setExamsLoading(true)
    setError(null)
    const run = async () => {
      if (_adminTabInFlight.exams) {
        try {
          const list = await _adminTabInFlight.exams
          if (mounted) setExams(list ?? [])
        } catch (_) {
          if (mounted) setError("Không thể tải BXH bài kiểm tra")
        } finally {
          if (mounted) setExamsLoading(false)
        }
        return
      }
      _adminTabInFlight.exams = (async () => {
        try {
          const e = await adminStatsAPI.getExamLeaderboards()
          const list = Array.isArray(e?.exams) ? e.exams : []
          _adminTabCache.exams = list
          if (mounted) {
            setExams(list)
            setError(null)
          }
          return list
        } catch (e) {
          if (mounted) setError(e?.message || "Không thể tải BXH bài kiểm tra")
          throw e
        } finally {
          _adminTabInFlight.exams = null
          if (mounted) setExamsLoading(false)
        }
      })()
      await _adminTabInFlight.exams
    }
    run()
    return () => { mounted = false }
  }, [isAdmin, currentView])

  // Tab "users": chỉ fetch khi vào tab
  useEffect(() => {
    if (!isAdmin || currentView !== "users") return
    if (_adminTabCache.users != null) {
      setUsers(_adminTabCache.users)
      return
    }
    let mounted = true
    setUsersLoading(true)
    setError(null)
    const run = async () => {
      if (_adminTabInFlight.users) {
        try {
          const list = await _adminTabInFlight.users
          if (mounted) setUsers(list ?? [])
        } catch (_) {
          if (mounted) setError("Không thể tải danh sách users")
        } finally {
          if (mounted) setUsersLoading(false)
        }
        return
      }
      _adminTabInFlight.users = (async () => {
        try {
          const u = await adminStatsAPI.getUsers()
          const list = Array.isArray(u) ? u : []
          _adminTabCache.users = list
          if (mounted) {
            setUsers(list)
            setError(null)
          }
          return list
        } catch (e) {
          if (mounted) setError(e?.message || "Không thể tải danh sách users")
          throw e
        } finally {
          _adminTabInFlight.users = null
          if (mounted) setUsersLoading(false)
        }
      })()
      await _adminTabInFlight.users
    }
    run()
    return () => { mounted = false }
  }, [isAdmin, currentView])

  const fetchWeeklyByRange = async () => {
    if (!dateRange.from || !dateRange.to) {
      setWeeklyRows([])
      return
    }
    const key = `${dateRange.from}_${dateRange.to}`
    if (_adminWeeklyCache[key] != null) {
      setWeeklyRows(_adminWeeklyCache[key])
      setWeeklyRequested(true)
      return
    }
    if (_adminWeeklyInFlight[key]) {
      try {
        const weekData = await _adminWeeklyInFlight[key]
        setWeeklyRows(weekData ?? [])
        setWeeklyRequested(true)
      } catch (_) {
        setWeeklyError("Không thể tải BXH theo khoảng thời gian")
      } finally {
        setWeeklyLoading(false)
      }
      return
    }
    setWeeklyRequested(true)
    setWeeklyLoading(true)
    setWeeklyError(null)
    _adminWeeklyInFlight[key] = (async () => {
      try {
        const w = await adminStatsAPI.getWeeklyLeaderboards(dateRange.from, dateRange.to)
        const weekData = Array.isArray(w?.weeks) ? w.weeks : []
        _adminWeeklyCache[key] = weekData
        setWeeklyRows(weekData)
        return weekData
      } catch (e) {
        setWeeklyRows([])
        setWeeklyError(e?.message || "Không thể tải BXH theo khoảng thời gian")
        throw e
      } finally {
        delete _adminWeeklyInFlight[key]
        setWeeklyLoading(false)
      }
    })()
    await _adminWeeklyInFlight[key]
  }

  const refreshUsers = async () => {
    _adminTabCache.users = null
    _adminTabInFlight.users = null
    setUsersLoading(true)
    try {
      const u = await adminStatsAPI.getUsers()
      const list = Array.isArray(u) ? u : []
      _adminTabCache.users = list
      setUsers(list)
      setError(null)
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách users")
    } finally {
      setUsersLoading(false)
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case "lesson":
        return (
          <LessonSection
            lessons={lessons}
            activeLesson={activeLesson}
            onLessonChange={setActiveLesson}
            loading={lessonsLoading}
          />
        )
      case "test":
        return <ExamSection exams={exams} loading={examsLoading} />
      case "users":
        return <UsersSection users={users} onRefresh={refreshUsers} loading={usersLoading} />
      case "weekly":
      default:
        return (
          <WeeklySection
            weeklyRows={weeklyRows}
            dateRange={dateRange}
            onDateChange={setDateRange}
            onApply={fetchWeeklyByRange}
            isLoading={weeklyLoading}
            error={weeklyError}
            requested={weeklyRequested}
          />
        )
    }
  }

  if (!currentView || currentView === "home") {
    return (
      <PageLayout>
        <AdminHero />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      {renderContent()}
    </PageLayout>
  )
}

export default AdminDashboard
