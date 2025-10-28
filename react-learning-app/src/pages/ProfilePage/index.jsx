"use client"

import { useState, useEffect } from "react"
import { profileAPI, handleApiError, iseStatsAPI, userLessonAPI } from "../../services/api"
import { useUserStore } from "../../store/UserStore"
import WeeklyLeaderboard from "../../components/WeeklyLeaderboard"
import { User, Mail, BarChart3, Volume2, Star, Flame, BookOpen, Lock } from "lucide-react"

const ProfilePage = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false)
  const storeUser = useUserStore((s) => s.user)
  const me = storeUser || user

  // If admin, render a minimal admin-only profile view
  if (me && me.role === "ROLE_ADMIN") {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h1 className="text-2xl font-bold mb-4">Admin Profile</h1>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full avatar-gradient flex items-center justify-center text-white font-bold text-xl">
              {((me.name || me.email || "A").charAt(0) || "A").toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-semibold">{me.name || "Administrator"}</div>
              <div className="text-sm text-slate-600">{me.email}</div>
              <div className="mt-2 inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">ROLE_ADMIN</div>
            </div>
          </div>

          <div className="mt-6 text-sm text-slate-700">
            <p>This account has administrative access to the system. Use the Admin Dashboard to manage users and view statistics.</p>
          </div>
        </div>
      </div>
    )
  }
  // Simplified user model: name, email, password fields
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({ currentPassword: "", confirmPassword: "", general: "" })
  const [statsLoading, setStatsLoading] = useState(true)
  const [weeklyRows, setWeeklyRows] = useState([])
  const [todayStat, setTodayStat] = useState(null)
  const [lessonRows, setLessonRows] = useState([])
  const [testRows, setTestRows] = useState([])
  const [summary, setSummary] = useState({
    lessonsCompleted: 0,
    wordsLearned: 0,
    hskkCount: 0,
  })

  const achievements = [
    {
      id: 1,
      name: "Người mới bắt đầu",
      description: "Hoàn thành bài học đầu tiên",
      icon: Star,
      unlocked: false,
    },
    {
      id: 2,
      name: "Chăm chỉ",
      description: "Học 7 ngày liên tiếp",
      icon: Flame,
      unlocked: false,
    },
    {
      id: 3,
      name: "Từ vựng",
      description: "Học 100 từ mới",
      icon: BookOpen,
      unlocked: false,
    },
    {
      id: 4,
      name: "Phát âm",
      description: "Hoàn thành bài phát âm",
      icon: Volume2,
      unlocked: false,
    },
  ]

  const getVietnamDateIso = (d = new Date()) => {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d)
    } catch (e) {
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0]
    }
  }

  const getVietnamWeekStartIso = (d = new Date()) => {
    try {
      const date = new Date(d)
      // JS getDay: 0=Sun,1=Mon,... convert to Monday-based week start
      const day = date.getDay()
      const diff = (day + 6) % 7
      date.setDate(date.getDate() - diff)
      return getVietnamDateIso(date)
    } catch (e) {
      return getVietnamDateIso(d)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchIseStatsWeekly()

    const handler = (e) => {
      try {
        const detail = e?.detail || {}
        const score = detail.score
        const lessonId = detail.lessonId
        const includeInDaily = detail.includeInDaily

        if (includeInDaily && score) {
          // optimistic update for today's stat
          try {
            const today = getVietnamDateIso()
            setTodayStat((prev) => {
              const prevCount = Number(prev?.count || 0)
              const prevAvg = Number(prev?.avgScore || 0)
              const newCount = prevCount + 1
              const newAvg = Math.round((prevAvg * prevCount + (score.total_score ?? 0)) / newCount)
              return { date: today, avgScore: newAvg, count: newCount }
            })
          } catch (e) {
            // console.debug('optimistic todayStat update failed', e)
          }
        }

        if (lessonId && score) {
          setLessonRows((prev) => {
            const copy = Array.isArray(prev) ? [...prev] : []
            const idx = copy.findIndex((r) => String(r.lessonId) === String(lessonId))
            if (idx === -1) {
              const isVocab = detail?.source === "vocab-practice" || detail?.vocabularyId != null
              copy.push({
                lessonId,
                avgScore: Math.round(score.total_score ?? 0),
                avgWordScore: isVocab ? Math.round(score.total_score ?? 0) : null,
                avgSentenceScore: isVocab ? null : Math.round(score.total_score ?? 0),
                completedFull: false,
                lessonScore: Math.round(score.total_score ?? 0),
                attempts: 1,
              })
            } else {
              const existing = copy[idx]
              const prevAvg = Number(existing.avgScore || 0)
              const prevCount = Number(existing.attempts || 1)
              const newCount = prevCount + 1
              const newAvg = Math.round((prevAvg * prevCount + (score.total_score ?? 0)) / newCount)
              const isVocab = detail?.source === "vocab-practice" || detail?.vocabularyId != null
              let avgWordScore = existing.avgWordScore ?? null
              let avgSentenceScore = existing.avgSentenceScore ?? null
              if (isVocab) {
                const prevW = Number(existing.avgWordScore || 0)
                const prevWCount = Number(existing.wordAttempts || 0)
                const wCount = prevWCount + 1
                const newWAvg = Math.round((prevW * prevWCount + (score.total_score ?? 0)) / wCount)
                avgWordScore = newWAvg
                copy[idx].wordAttempts = wCount
              } else {
                const prevS = Number(existing.avgSentenceScore || 0)
                const prevSCount = Number(existing.sentenceAttempts || 0)
                const sCount = prevSCount + 1
                const newSAvg = Math.round((prevS * prevSCount + (score.total_score ?? 0)) / sCount)
                avgSentenceScore = newSAvg
                copy[idx].sentenceAttempts = sCount
              }
              copy[idx] = { ...existing, avgScore: newAvg, attempts: newCount, avgWordScore, avgSentenceScore }
            }
            return copy
          })
        }
      } catch (err) {
        // console.debug("optimistic stats update failed", err)
      }

      setTimeout(() => fetchIseStatsWeekly(), 1000)
    }

    window.addEventListener("ise:score:submitted", handler)
    return () => window.removeEventListener("ise:score:submitted", handler)
  }, [])

  const fetchIseStatsWeekly = async () => {
    setStatsLoading(true)
    try {
      // fetch weekly rows for lesson summary
      const weekly = await iseStatsAPI.getWeekly()
      setWeeklyRows(Array.isArray(weekly?.rows) ? weekly.rows : [])

      // fetch today's daily stat (avg for today)
      const todayIso = getVietnamDateIso()
      try {
        const daily = await iseStatsAPI.getDaily(todayIso, todayIso)
        const rows = Array.isArray(daily?.rows) ? daily.rows : []
        setTodayStat(rows.length > 0 ? rows[0] : null)
      } catch (e) {
        // console.debug('failed to fetch today daily stat', e)
        setTodayStat(null)
      }
    } catch (e) {
      // console.debug("failed weekly stats", e)
      setWeeklyRows([])
    }

    let enriched = []
    try {
      const lessons = await iseStatsAPI.getLessons()
      const rows = Array.isArray(lessons?.rows) ? lessons.rows : []

      enriched = await Promise.all(
        rows.map(async (r) => {
          try {
            const resp = await userLessonAPI.isCompleted(r.lessonId).catch(() => null)
            const pronounced = await iseStatsAPI.getPronouncedForLesson(r.lessonId).catch(() => null)

            let avgWordScore = null
            let avgSentenceScore = null

            if (pronounced) {
              avgWordScore = pronounced.avgWordScore ?? pronounced.avg_word_score ?? pronounced.avg_word ?? null
              avgSentenceScore =
                pronounced.avgSentenceScore ?? pronounced.avg_sentence_score ?? pronounced.avg_sentence ?? null

              if (avgWordScore != null) {
                const n = Number(avgWordScore)
                avgWordScore = Number.isFinite(n) ? Math.round(n) : null
              }
              if (avgSentenceScore != null) {
                const n = Number(avgSentenceScore)
                avgSentenceScore = Number.isFinite(n) ? Math.round(n) : null
              }

              if (avgWordScore == null && avgSentenceScore == null) {
                let entries = []
                if (Array.isArray(pronounced)) entries = pronounced
                else if (Array.isArray(pronounced.entries)) entries = pronounced.entries
                else if (Array.isArray(pronounced.rows)) entries = pronounced.rows
                else if (Array.isArray(pronounced.data)) entries = pronounced.data

                const vocabMap = new Map()
                const lineMap = new Map()

                for (const e of entries) {
                  if (!e) continue
                  const sc = Number(e.totalScore ?? e.total_score ?? e.score ?? e.total ?? 0)
                  const vid = e.vocabularyId ?? e.vocab_id ?? null
                  const lid = e.lineId ?? e.line_id ?? null
                  if (vid != null) {
                    const key = String(vid)
                    const cur = vocabMap.get(key) || { sum: 0, count: 0 }
                    cur.sum += sc
                    cur.count += 1
                    vocabMap.set(key, cur)
                  }
                  if (lid != null) {
                    const key = String(lid)
                    const cur = lineMap.get(key) || { sum: 0, count: 0 }
                    cur.sum += sc
                    cur.count += 1
                    lineMap.set(key, cur)
                  }
                }

                if (vocabMap.size > 0) {
                  let acc = 0,
                    cnt = 0
                  for (const { sum, count } of vocabMap.values()) {
                    if (count > 0) {
                      acc += sum / count
                      cnt += 1
                    }
                  }
                  if (cnt > 0) avgWordScore = Math.round(acc / cnt)
                }

                if (lineMap.size > 0) {
                  let acc = 0,
                    cnt = 0
                  for (const { sum, count } of lineMap.values()) {
                    if (count > 0) {
                      acc += sum / count
                      cnt += 1
                    }
                  }
                  if (cnt > 0) avgSentenceScore = Math.round(acc / cnt)
                }
              }
            }

            let completedFull = resp?.completed ?? r.completedFull ?? false
            if (resp) {
              const userLines = Number(
                resp.userDistinctLineCount ?? resp.user_distinct_line_count ?? resp.scoredCount ?? 0,
              )
              const userVocabs = Number(resp.userDistinctVocabCount ?? resp.user_distinct_vocab_count ?? 0)
              const totalLinesResp = Number(resp.totalLines ?? resp.total_lines ?? resp.totalLines ?? 0)
              const totalVocabResp = Number(resp.totalVocab ?? resp.total_vocab ?? 0)
              const linesComplete = totalLinesResp === 0 || userLines >= totalLinesResp
              const vocabComplete = totalVocabResp === 0 || userVocabs >= totalVocabResp
              completedFull = linesComplete && vocabComplete
            }

            return {
              ...r,
              completedFull,
              inProgress: resp?.inProgress ?? r.inProgress ?? false,
              avgWordScore,
              avgSentenceScore,
            }
          } catch (e) {
            // console.debug('error enriching lesson', e)
            return r
          }
        }),
      )

      setLessonRows(enriched)
    } catch (e) {
      // console.debug("failed lesson stats", e)
      setLessonRows([])
    }

    let testsRows = []
    try {
      const tests = await iseStatsAPI.getTests()
      testsRows = Array.isArray(tests?.rows) ? tests.rows : []
      setTestRows(testsRows)
    } catch (e) {
      // console.debug("failed test stats", e)
      setTestRows([])
    }

    try {
      const lessonsCompleted = Array.isArray(enriched) ? enriched.filter((r) => r.completedFull).length : 0
      const hskkCount = Array.isArray(testsRows)
        ? testsRows.reduce(
          (acc, r) => acc + (Number(r.attempts) || (Array.isArray(r.entries) ? r.entries.length : 0)),
          0,
        )
        : 0

      let wordsLearned = 0
      try {
        const distinct = await iseStatsAPI.getDistinctVocabForUser().catch(() => null)
        const vids = distinct?.vocabularyIds || distinct?.vocabularyIds || []
        wordsLearned = Array.isArray(vids) ? vids.length : Number(distinct?.count || 0)
      } catch (e) {
        // console.debug("failed to fetch distinct vocab for user", e)
        wordsLearned = 0
      }

      setSummary({ lessonsCompleted, wordsLearned, hskkCount })
    } catch (e) {
      // console.debug("failed to compute profile summary", e)
    }

    setStatsLoading(false)
  }

  const fetchProfile = async () => {
    try {
      const profile = await profileAPI.get()
      setProfileData((prev) => ({
        ...prev,
        name: profile.name || profile.fullName || "",
        email: profile.email || "",
      }))
    } catch (error) {
      // console.error("Error fetching profile:", handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // client-side validations
    setErrors({ currentPassword: "", confirmPassword: "", general: "" })
    if (!profileData.currentPassword) {
      setErrors((s) => ({ ...s, currentPassword: "Vui lòng nhập mật khẩu hiện tại" }))
      return
    }

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setErrors((s) => ({ ...s, confirmPassword: "Mật khẩu mới và xác nhận không khớp" }))
      return
    }

    try {
      setSaving(true)

      const payload = {
        name: profileData.name,
        email: profileData.email,
        currentPassword: profileData.currentPassword,
      }
      if (profileData.newPassword) payload.newPassword = profileData.newPassword

      const resp = await profileAPI.update(payload)

      // update local UI and global store (if available)
      setIsEditing(false)
      setProfileData((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }))

      try {
        if (resp && resp.user) {
          localStorage.setItem("user", JSON.stringify(resp.user))
          try {
            useUserStore.getState().setUser(resp.user)
          } catch (e) { }
        } else {
          try {
            const raw = localStorage.getItem("user")
            if (raw) {
              const u = JSON.parse(raw)
              u.name = profileData.name
              localStorage.setItem("user", JSON.stringify(u))
              try {
                useUserStore.getState().setUser(u)
              } catch (e) { }
            }
          } catch (e) { }
        }
      } catch (e) { }
    } catch (error) {
      // handle known backend errors by status code and response body
      const status = error?.response?.status
      const data = error?.response?.data
      const errCode = data?.error
      const errMsg = data?.message || handleApiError(error)
      if (status === 403 || errCode === "incorrect_current_password") {
        setErrors((s) => ({ ...s, currentPassword: errMsg || "Mật khẩu hiện tại không đúng" }))
      } else if (status === 400 || errCode === "missing_current_password") {
        setErrors((s) => ({ ...s, currentPassword: errMsg || "Vui lòng nhập mật khẩu hiện tại" }))
      } else {
        setErrors((s) => ({ ...s, general: errMsg || "Có lỗi xảy ra khi cập nhật thông tin" }))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="loading"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="container-max px-4">
        <div className="mb-8 bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-xl text-white shadow-lg slide-in-down flex items-center gap-4">
          <User size={40} />
          <div>
            <h1 className="text-4xl font-bold mb-2">Hồ sơ cá nhân</h1>
            <p className="text-purple-100 text-lg">Quản lý thông tin và theo dõi tiến độ học tập</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="card overflow-hidden card-hover">
              <div className="p-8 text-center border-b border-slate-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex justify-center mb-6">
                  <div className="w-28 h-28 rounded-full avatar-gradient flex items-center justify-center text-white text-5xl font-bold shadow-lg border-4 border-white">
                    {profileData.name?.charAt(0) || profileData.email?.charAt(0) || "U"}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="input-with-icon w-full"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Tên"
                      />
                      <User size={18} className="input-icon-lucide" />
                    </div>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        className="input-with-icon w-full"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Email"
                      />
                      <Mail size={18} className="input-icon-lucide" />
                    </div>

                    <div className="input-wrapper">
                      <input
                        type="password"
                        className="input-with-icon w-full"
                        value={profileData.currentPassword}
                        onChange={(e) => {
                          setProfileData({ ...profileData, currentPassword: e.target.value })
                          setErrors((s) => ({ ...s, currentPassword: "", general: "" }))
                        }}
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                        aria-required="true"
                        aria-describedby="currentPasswordHelp"
                      />
                      <User size={18} className="input-icon-lucide" />
                      {errors.currentPassword ? (
                        <div className="text-xs text-red-600 mt-1">{errors.currentPassword}</div>
                      ) : (
                        <span className="text-red-600">*</span>
                      )}
                    </div>

                    <div className="input-wrapper">
                      <input
                        type="password"
                        className="input-with-icon w-full"
                        value={profileData.newPassword}
                        onChange={(e) => {
                          setProfileData({ ...profileData, newPassword: e.target.value })
                          setErrors((s) => ({ ...s, confirmPassword: "" }))
                        }}
                        placeholder="Mật khẩu mới"
                      />
                      <Lock size={18} className="input-icon-lucide" />
                    </div>

                    {profileData.newPassword && profileData.newPassword.length > 0 && (
                      <div className="input-wrapper">
                        <input
                          type="password"
                          className="input-with-icon w-full"
                          value={profileData.confirmPassword}
                          onChange={(e) => {
                            setProfileData({ ...profileData, confirmPassword: e.target.value })
                            setErrors((s) => ({ ...s, confirmPassword: "" }))
                          }}
                          placeholder="Xác nhận mật khẩu mới"
                        />
                        <Lock size={18} className="input-icon-lucide" />
                        {errors.confirmPassword && <div className="text-xs text-red-600 mt-1">{errors.confirmPassword}</div>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{profileData.name || profileData.email}</h2>
                    <p className="text-sm text-slate-600 mt-2">{profileData.email}</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200 flex gap-2">
                {isEditing ? (
                  <>
                    <button className="btn-secondary flex-1 rounded-lg" onClick={() => setIsEditing(false)}>
                      Hủy
                    </button>
                    <div className="flex-1">
                      {errors.general && <div className="text-sm text-red-600 mb-2">{errors.general}</div>}
                      <button
                        className={`btn-primary w-full rounded-lg ${saving ? "opacity-50" : ""}`}
                        onClick={handleSave}
                        disabled={
                          saving || !profileData.currentPassword || (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword)
                        }
                      >
                        {saving ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </>
                ) : (
                  <button className="btn-primary w-full rounded-lg" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="card overflow-hidden card-hover">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center gap-3">
                <BarChart3 size={28} className="text-purple-600" />
                <h2 className="text-2xl font-bold gradient-text">Thống kê học tập</h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="card p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">Bài Học</div>
                    <div className="text-4xl font-bold text-purple-600">{summary.lessonsCompleted}</div>
                    <div className="text-xs text-purple-600 mt-2 font-semibold">Đã hoàn thành</div>
                  </div>

                  <div className="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">Từ Vựng</div>
                    <div className="text-4xl font-bold text-blue-600">{summary.wordsLearned}</div>
                    <div className="text-xs text-blue-600 mt-2 font-semibold">Đã học</div>
                  </div>

                  <div className="card p-6 text-center bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                    <div className="text-sm font-bold text-cyan-700 mb-2 uppercase tracking-wide">HSKK Sơ Cấp</div>
                    <div className="text-4xl font-bold text-cyan-600">{summary.hskkCount}</div>
                    <div className="text-xs text-cyan-600 mt-2 font-semibold">Đã làm</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden card-hover">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-slate-200 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 size={28} className="text-purple-600" />
                  <h2 className="text-2xl font-bold gradient-text">Đánh giá phát âm</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
                      <div className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                        <BookOpen size={20} />
                        Điểm ngày (Hôm nay)
                      </div>
                      {statsLoading ? (
                        <div className="text-sm text-slate-500">Đang tải...</div>
                      ) : !todayStat ? (
                        <div className="text-sm text-slate-500">Chưa có lượt hôm nay</div>
                      ) : (
                        <div>
                          <div className="flex justify-between text-sm py-3 border-b border-slate-200 last:border-0">
                            <div className="text-slate-600 font-medium">{todayStat.date}</div>
                            <div className="font-bold text-purple-600 text-lg">{todayStat.avgScore}%</div>
                          </div>
                          <div className="text-xs text-slate-500 mt-4 font-semibold">Số lượt: {todayStat.count ?? 0}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-slate-300 bg-slate-50">
                            <th className="text-left py-3 px-3 font-bold text-slate-700">Bài</th>
                            <th className="text-left py-3 px-3 font-bold text-slate-700">Điểm từ</th>
                            <th className="text-left py-3 px-3 font-bold text-slate-700">Điểm câu</th>
                            <th className="text-left py-3 px-3 font-bold text-slate-700">Hoàn thành</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsLoading ? (
                            <tr>
                              <td colSpan={4} className="text-sm text-slate-500 py-4 text-center">
                                Đang tải...
                              </td>
                            </tr>
                          ) : lessonRows.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-sm text-slate-500 py-4 text-center">
                                Không có dữ liệu
                              </td>
                            </tr>
                          ) : (
                            lessonRows.map((r) => (
                              <tr
                                key={r.lessonId}
                                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                              >
                                <td className="py-3 px-3 font-bold text-slate-900">{r.lessonId}</td>
                                <td className="py-3 px-3 text-slate-600 font-semibold">
                                  {r.avgWordScore != null
                                    ? `${r.avgWordScore}%`
                                    : r.avgScore != null
                                      ? `${Math.round(r.avgScore)}%`
                                      : "—"}
                                </td>
                                <td className="py-3 px-3 text-slate-600 font-semibold">
                                  {r.avgSentenceScore != null
                                    ? `${r.avgSentenceScore}%`
                                    : r.avgScore != null
                                      ? `${Math.round(r.avgScore)}%`
                                      : "—"}
                                </td>
                                <td className="py-3 px-3">
                                  {r.completedFull ? (
                                    <span className="text-green-600 font-bold text-lg">✔</span>
                                  ) : (
                                    <span className="text-red-600 font-bold text-lg">✘</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-8 pt-8 border-t-2 border-slate-200">
                      <div className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                        <BarChart3 size={20} />
                        Điểm test (Tổng quan)
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-slate-300 bg-slate-50">
                              <th className="text-left py-3 px-3 font-bold text-slate-700">Test ID</th>
                              <th className="text-left py-3 px-3 font-bold text-slate-700">Trung bình</th>
                              <th className="text-left py-3 px-3 font-bold text-slate-700">Số lần</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statsLoading ? (
                              <tr>
                                <td colSpan={3} className="text-sm text-slate-500 py-4 text-center">
                                  Đang tải...
                                </td>
                              </tr>
                            ) : testRows.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-sm text-slate-500 py-4 text-center">
                                  Không có dữ liệu
                                </td>
                              </tr>
                            ) : (
                              testRows.map((r) => (
                                <tr
                                  key={r.testId}
                                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                  <td className="py-3 px-3 font-bold text-slate-900">{r.testId}</td>
                                  <td className="py-3 px-3 text-slate-600 font-semibold">{r.avgTotal}</td>
                                  <td className="py-3 px-3 text-slate-600 font-semibold">{r.attempts}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <WeeklyLeaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
