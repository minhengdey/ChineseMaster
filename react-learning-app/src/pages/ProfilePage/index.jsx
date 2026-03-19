"use client"

import { useState, useEffect } from "react"
import { profileAPI, handleApiError, iseStatsAPI, userLessonAPI } from "../../services/api"
import { useUserStore } from "../../store/UserStore"
import PageLayout from "../../components/layout/PageLayout"
import WeeklyLeaderboard from "../../components/WeeklyLeaderboard"
import { ProfileHeader, ProfileInfoCard, StatsSummaryCard, PronunciationStatsCard } from "./components"

const _profileDataInFlight = { promise: null }
const _profileIseStatsInFlight = { promise: null }

const ProfilePage = ({ user: userProp }) => {
  const storeUser = useUserStore((s) => s.user)
  const user = storeUser || userProp
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(() => ({
    name: storeUser?.name ?? "",
    email: storeUser?.email ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }))
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
    let mounted = true
    const runProfile = async () => {
      if (_profileDataInFlight.promise) {
        try {
          const d = await _profileDataInFlight.promise
          if (mounted && d) {
            setProfileData((prev) => ({ ...prev, name: d.name ?? prev.name, email: d.email ?? prev.email }))
          }
        } catch (_) {}
        if (mounted) setLoading(false)
        return
      }
      _profileDataInFlight.promise = (async () => {
        try {
          const profile = await profileAPI.get()
          const name = profile.name || profile.fullName || ""
          const email = profile.email || ""
          if (mounted) {
            setProfileData((prev) => ({ ...prev, name, email }))
          }
          return { name, email }
        } catch (error) {
          throw error
        } finally {
          _profileDataInFlight.promise = null
          if (mounted) setLoading(false)
        }
      })()
      await _profileDataInFlight.promise
    }
    const runIseStats = async () => {
      if (_profileIseStatsInFlight.promise) {
        try {
          const c = await _profileIseStatsInFlight.promise
          if (mounted && c) {
            setWeeklyRows(c.weeklyRows ?? [])
            setTodayStat(c.todayStat ?? null)
            setLessonRows(c.lessonRows ?? [])
            setTestRows(c.testRows ?? [])
            setSummary(c.summary ?? { lessonsCompleted: 0, wordsLearned: 0, hskkCount: 0 })
          }
        } catch (_) {}
        if (mounted) setStatsLoading(false)
        return
      }
      _profileIseStatsInFlight.promise = (async () => {
        try {
          return await fetchIseStatsWeekly()
        } finally {
          _profileIseStatsInFlight.promise = null
          if (mounted) setStatsLoading(false)
        }
      })()
      await _profileIseStatsInFlight.promise
    }
    runProfile()
    runIseStats()

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
    return () => {
      mounted = false
      window.removeEventListener("ise:score:submitted", handler)
    }
  }, [])

  const fetchIseStatsWeekly = async () => {
    setStatsLoading(true)
    let cachedWeekly = []
    let cachedToday = null
    try {
      const weekly = await iseStatsAPI.getWeekly()
      const wr = Array.isArray(weekly?.rows) ? weekly.rows : []
      setWeeklyRows(wr)
      cachedWeekly = wr
      const todayIso = getVietnamDateIso()
      try {
        const daily = await iseStatsAPI.getDaily(todayIso, todayIso)
        const rows = Array.isArray(daily?.rows) ? daily.rows : []
        cachedToday = rows.length > 0 ? rows[0] : null
        setTodayStat(cachedToday)
      } catch (e) {
        setTodayStat(null)
      }
    } catch (e) {
      setWeeklyRows([])
    }

    let enriched = []
    try {
      const lessons = await iseStatsAPI.getLessons()
      const rows = Array.isArray(lessons?.rows) ? lessons.rows : []
      const lessonIds = rows.map((r) => r.lessonId).filter((id) => id != null)
      const [completionBatch, pronouncedBatch] =
        lessonIds.length > 0
          ? await Promise.all([
              userLessonAPI.getCompletionBatch(lessonIds),
              iseStatsAPI.getPronouncedForLessonsBatch(lessonIds),
            ])
          : [{}, {}]

      enriched = rows.map((r) => {
        try {
          const resp = completionBatch[String(r.lessonId)] ?? null
          const pronounced = pronouncedBatch[String(r.lessonId)] ?? null

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
            if (avgWordScore == null || avgSentenceScore == null) {
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
                let acc = 0
                let cnt = 0
                for (const { sum, count } of vocabMap.values()) {
                  if (count > 0) {
                    acc += sum / count
                    cnt += 1
                  }
                }
                if (cnt > 0 && avgWordScore == null) avgWordScore = Math.round(acc / cnt)
              }
              if (lineMap.size > 0) {
                let acc = 0
                let cnt = 0
                for (const { sum, count } of lineMap.values()) {
                  if (count > 0) {
                    acc += sum / count
                    cnt += 1
                  }
                }
                if (cnt > 0 && avgSentenceScore == null) avgSentenceScore = Math.round(acc / cnt)
              }
            }
          }

          let completedFull = resp?.completed ?? r.completedFull ?? false
          if (resp) {
            const userLines = Number(
              resp.userDistinctLineCount ?? resp.user_distinct_line_count ?? resp.scoredCount ?? 0,
            )
            const userVocabs = Number(resp.userDistinctVocabCount ?? resp.user_distinct_vocab_count ?? 0)
            const totalLinesResp = Number(resp.totalLines ?? resp.total_lines ?? 0)
            const totalVocabResp = Number(resp.totalVocab ?? resp.total_vocab ?? 0)
            const linesComplete = totalLinesResp === 0 || userLines >= totalLinesResp
            const vocabComplete = totalVocabResp === 0 || userVocabs >= totalVocabResp
            completedFull = linesComplete && vocabComplete
          }
          const finalAvgSentenceScore =
            avgSentenceScore != null ? avgSentenceScore : avgWordScore != null ? 0 : null
          return {
            ...r,
            completedFull,
            inProgress: resp?.inProgress ?? r.inProgress ?? false,
            avgWordScore,
            avgSentenceScore: finalAvgSentenceScore,
          }
        } catch (e) {
          return r
        }
      })

      setLessonRows(enriched)
    } catch (e) {
      setLessonRows([])
      enriched = []
    }

    let testsRows = []
    try {
      const tests = await iseStatsAPI.getTests()
      testsRows = Array.isArray(tests?.rows) ? tests.rows : []
      setTestRows(testsRows)
    } catch (e) {
      setTestRows([])
    }

    let summaryData = { lessonsCompleted: 0, wordsLearned: 0, hskkCount: 0 }
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
        wordsLearned = 0
      }

      summaryData = { lessonsCompleted, wordsLearned, hskkCount }
      setSummary(summaryData)
    } catch (e) {
      // ignore
    }

    setStatsLoading(false)
    return {
      weeklyRows: cachedWeekly,
      todayStat: cachedToday,
      lessonRows: enriched,
      testRows: testsRows,
      summary: summaryData,
    }
  }

  const fetchProfile = async () => {
    try {
      const profile = await profileAPI.get()
      const name = profile.name || profile.fullName || ""
      const email = profile.email || ""
      setProfileData((prev) => ({
        ...prev,
        name,
        email,
      }))
      _profileDataCache.data = { name, email }
      _profileDataCache.ts = Date.now()
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

      // No localStorage - just update in-memory store
      try {
        if (resp && resp.user) {
          try {
            useUserStore.getState().setUser(resp.user)
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
      <PageLayout>
        <div className="min-h-48 flex items-center justify-center">
          <div className="loading w-10 h-10 border-2 border-slate-200 border-t-violet-500 rounded-full" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        <ProfileHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProfileInfoCard
              profileData={profileData}
              isEditing={isEditing}
              errors={errors}
              saving={saving}
              onProfileChange={setProfileData}
              onErrorsChange={setErrors}
              onSetEditing={setIsEditing}
              onSave={handleSave}
            />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <StatsSummaryCard summary={summary} />

            <PronunciationStatsCard
              todayStat={todayStat}
              lessonRows={lessonRows}
              testRows={testRows}
              statsLoading={statsLoading}
            />

            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3">Bảng xếp hạng tuần</h2>
              <WeeklyLeaderboard />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default ProfilePage
