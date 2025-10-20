import React, { useState, useEffect } from "react";
import { profileAPI, handleApiError, iseStatsAPI, userLessonAPI } from "../../services/api";
import DailyLeaderboard from '../../components/DailyLeaderboard';

const ProfilePage = ({ user }) => {
   const [isEditing, setIsEditing] = useState(false);
   const [profileData, setProfileData] = useState({
      email: "",
      fullName: "",
      avatar: "",
      level: "Sơ Cấp",
      studyGoal: "30 phút/ngày",
      joinDate: "",
   });
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [statsLoading, setStatsLoading] = useState(true);
   const [dailyRows, setDailyRows] = useState([]);
   const [lessonRows, setLessonRows] = useState([]);
   const [testRows, setTestRows] = useState([]);
   const [summary, setSummary] = useState({
      lessonsCompleted: 0,
      wordsLearned: 0,
      hskkCount: 0,
   });

   const achievements = [
      {
         id: 1,
         name: "Người mới bắt đầu",
         description: "Hoàn thành bài học đầu tiên",
         icon: "🌟",
         unlocked: false,
      },
      {
         id: 2,
         name: "Chăm chỉ",
         description: "Học 7 ngày liên tiếp",
         icon: "🔥",
         unlocked: false,
      },
      {
         id: 3,
         name: "Từ vựng",
         description: "Học 100 từ mới",
         icon: "📚",
         unlocked: false,
      },
      {
         id: 4,
         name: "Phát âm",
         description: "Hoàn thành bài phát âm",
         icon: "🔊",
         unlocked: false,
      },
   ];

   // Helper: get date string 'YYYY-MM-DD' in Vietnam timezone (Asia/Ho_Chi_Minh)
   const getVietnamDateIso = (d = new Date()) => {
      try {
         return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
      } catch (e) {
         return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      }
   };

   useEffect(() => {
      fetchProfile();
      fetchIseStatsToday();

      const handler = (e) => {
         try {
            const detail = e?.detail || {};
            const score = detail.score;
            const lessonId = detail.lessonId;
            const includeInDaily = detail.includeInDaily;

            if (includeInDaily && score) {
               const todayStr = getVietnamDateIso();
               setDailyRows((prev) => {
                  const copy = Array.isArray(prev) ? [...prev] : [];
                  if (copy.length === 0 || copy[0]?.date !== todayStr) {
                     copy.unshift({ date: todayStr, avgScore: Math.round(score.total_score ?? 0), count: 1 });
                  } else {
                     const existing = copy[0];
                     const prevAvg = Number(existing.avgScore || 0);
                     const prevCount = Number(existing.count || 0);
                     const newCount = prevCount + 1;
                     const newAvg = Math.round((prevAvg * prevCount + (score.total_score ?? 0)) / newCount);
                     copy[0] = { ...existing, avgScore: newAvg, count: newCount };
                  }
                  return copy;
               });
            }

            if (lessonId && score) {
               setLessonRows((prev) => {
                  const copy = Array.isArray(prev) ? [...prev] : [];
                  const idx = copy.findIndex((r) => String(r.lessonId) === String(lessonId));
                  if (idx === -1) {
                     // initialize avgWordScore and avgSentenceScore heuristically from payload
                     const isVocab = detail?.source === 'vocab-practice' || (detail?.vocabularyId != null);
                     copy.push({ lessonId, avgScore: Math.round(score.total_score ?? 0), avgWordScore: isVocab ? Math.round(score.total_score ?? 0) : null, avgSentenceScore: isVocab ? null : Math.round(score.total_score ?? 0), completedFull: false, lessonScore: Math.round(score.total_score ?? 0), attempts: 1 });
                  } else {
                     const existing = copy[idx];
                     const prevAvg = Number(existing.avgScore || 0);
                     const prevCount = Number(existing.attempts || 1);
                     const newCount = prevCount + 1;
                     const newAvg = Math.round((prevAvg * prevCount + (score.total_score ?? 0)) / newCount);
                     // update word/sentence averages if we can guess the item type
                     const isVocab = detail?.source === 'vocab-practice' || (detail?.vocabularyId != null);
                     let avgWordScore = existing.avgWordScore ?? null;
                     let avgSentenceScore = existing.avgSentenceScore ?? null;
                     if (isVocab) {
                        // update avgWordScore
                        const prevW = Number(existing.avgWordScore || 0);
                        const prevWCount = Number(existing.wordAttempts || 0);
                        const wCount = prevWCount + 1;
                        const newWAvg = Math.round((prevW * prevWCount + (score.total_score ?? 0)) / wCount);
                        avgWordScore = newWAvg;
                        copy[idx].wordAttempts = wCount;
                     } else {
                        const prevS = Number(existing.avgSentenceScore || 0);
                        const prevSCount = Number(existing.sentenceAttempts || 0);
                        const sCount = prevSCount + 1;
                        const newSAvg = Math.round((prevS * prevSCount + (score.total_score ?? 0)) / sCount);
                        avgSentenceScore = newSAvg;
                        copy[idx].sentenceAttempts = sCount;
                     }
                     copy[idx] = { ...existing, avgScore: newAvg, attempts: newCount, avgWordScore, avgSentenceScore };
                  }
                  return copy;
               });
            }
         } catch (err) {
            console.debug("optimistic stats update failed", err);
         }

         // reconcile with server state shortly after optimistic update
         setTimeout(() => fetchIseStatsToday(), 1000);
      };

      window.addEventListener("ise:score:submitted", handler);
      return () => window.removeEventListener("ise:score:submitted", handler);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const fetchIseStatsToday = async () => {
      setStatsLoading(true);
      try {
         const today = getVietnamDateIso();
         const daily = await iseStatsAPI.getDaily(today, today);
         setDailyRows(Array.isArray(daily?.rows) ? daily.rows : []);
      } catch (e) {
         console.debug("failed daily stats", e);
         setDailyRows([]);
      }

      let enriched = [];
      try {
         const lessons = await iseStatsAPI.getLessons();
         console.debug("fetched lessons stats", lessons);
         const rows = Array.isArray(lessons?.rows) ? lessons.rows : [];

         // For each lesson, fetch completion state and pronounced entries (ise_lesson_entry) to compute
         // average vocabulary score and average sentence score.
         enriched = await Promise.all(
            rows.map(async (r) => {
               try {
                  const resp = await userLessonAPI.isCompleted(r.lessonId).catch(() => null);
                  // pronounce entries API returns entries with fields { lessonId, lineId, vocabularyId, totalScore }
                  const pronounced = await iseStatsAPI.getPronouncedForLesson(r.lessonId).catch(() => null);

                  // tolerate multiple shapes returned by the backend:
                  // - an object with .entries (array of entry objects)
                  // - an object with .rows or .data (array)
                  // - an array directly
                  // - an object that already includes aggregated averages (avgWordScore / avg_word_score / avg_sentence_score)
                  let avgWordScore = null;
                  let avgSentenceScore = null;

                  if (pronounced) {
                     // prefer already-aggregated values if present
                     avgWordScore = pronounced.avgWordScore ?? pronounced.avg_word_score ?? pronounced.avg_word ?? null;
                     avgSentenceScore = pronounced.avgSentenceScore ?? pronounced.avg_sentence_score ?? pronounced.avg_sentence ?? null;

                     // if aggregated values are strings or numbers, normalize to integer percent
                     if (avgWordScore != null) {
                        const n = Number(avgWordScore);
                        avgWordScore = Number.isFinite(n) ? Math.round(n) : null;
                     }
                     if (avgSentenceScore != null) {
                        const n = Number(avgSentenceScore);
                        avgSentenceScore = Number.isFinite(n) ? Math.round(n) : null;
                     }

                     // if aggregated not provided, try to extract raw entries array
                     if (avgWordScore == null && avgSentenceScore == null) {
                        let entries = [];
                        if (Array.isArray(pronounced)) entries = pronounced;
                        else if (Array.isArray(pronounced.entries)) entries = pronounced.entries;
                        else if (Array.isArray(pronounced.rows)) entries = pronounced.rows;
                        else if (Array.isArray(pronounced.data)) entries = pronounced.data;

                        // Group scores by vocabularyId and by lineId. For each distinct id compute the
                        // average score across attempts, then average those per-item averages.
                        const vocabMap = new Map(); // id -> { sum, count }
                        const lineMap = new Map();

                        for (const e of entries) {
                           if (!e) continue;
                           const sc = Number(e.totalScore ?? e.total_score ?? e.score ?? e.total ?? 0);
                           const vid = e.vocabularyId ?? e.vocab_id ?? null;
                           const lid = e.lineId ?? e.line_id ?? null;
                           if (vid != null) {
                              const key = String(vid);
                              const cur = vocabMap.get(key) || { sum: 0, count: 0 };
                              cur.sum += sc;
                              cur.count += 1;
                              vocabMap.set(key, cur);
                           }
                           if (lid != null) {
                              const key = String(lid);
                              const cur = lineMap.get(key) || { sum: 0, count: 0 };
                              cur.sum += sc;
                              cur.count += 1;
                              lineMap.set(key, cur);
                           }
                        }

                        // compute per-item averages then mean across items
                        if (vocabMap.size > 0) {
                           let acc = 0, cnt = 0;
                           for (const { sum, count } of vocabMap.values()) {
                              if (count > 0) {
                                 acc += sum / count;
                                 cnt += 1;
                              }
                           }
                           if (cnt > 0) avgWordScore = Math.round(acc / cnt);
                        }

                        if (lineMap.size > 0) {
                           let acc = 0, cnt = 0;
                           for (const { sum, count } of lineMap.values()) {
                              if (count > 0) {
                                 acc += sum / count;
                                 cnt += 1;
                              }
                           }
                           if (cnt > 0) avgSentenceScore = Math.round(acc / cnt);
                        }
                     }
                  }

                  // New backend response includes counts: userDistinctLineCount, userDistinctVocabCount, totalLines, totalVocab
                  let completedFull = resp?.completed ?? r.completedFull ?? false;
                  if (resp) {
                     const userLines = Number(resp.userDistinctLineCount ?? resp.user_distinct_line_count ?? resp.scoredCount ?? 0);
                     const userVocabs = Number(resp.userDistinctVocabCount ?? resp.user_distinct_vocab_count ?? 0);
                     const totalLinesResp = Number(resp.totalLines ?? resp.total_lines ?? resp.totalLines ?? 0);
                     const totalVocabResp = Number(resp.totalVocab ?? resp.total_vocab ?? 0);
                     const linesComplete = (totalLinesResp === 0) || (userLines >= totalLinesResp);
                     const vocabComplete = (totalVocabResp === 0) || (userVocabs >= totalVocabResp);
                     completedFull = linesComplete && vocabComplete;
                  }

                  return { ...r, completedFull, inProgress: resp?.inProgress ?? r.inProgress ?? false, avgWordScore, avgSentenceScore };
               } catch (e) {
                  return r;
               }
            })
         );

         setLessonRows(enriched);
      } catch (e) {
         console.debug("failed lesson stats", e);
         setLessonRows([]);
      }

      let testsRows = [];
      try {
         const tests = await iseStatsAPI.getTests();
         testsRows = Array.isArray(tests?.rows) ? tests.rows : [];
         setTestRows(testsRows);
      } catch (e) {
         console.debug("failed test stats", e);
         setTestRows([]);
      }

      // Compute summary
      try {
         const lessonsCompleted = Array.isArray(enriched) ? enriched.filter((r) => r.completedFull).length : 0;
         const hskkCount = Array.isArray(testsRows) ? testsRows.reduce((acc, r) => acc + (Number(r.attempts) || (Array.isArray(r.entries) ? r.entries.length : 0)), 0) : 0;

         // Compute distinct vocabulary across all user attempts (SELECT DISTINCT vocabulary_id FROM ise_score)
         let wordsLearned = 0;
         try {
            const distinct = await iseStatsAPI.getDistinctVocabForUser().catch(() => null);
            const vids = distinct?.vocabularyIds || distinct?.vocabularyIds || [];
            wordsLearned = Array.isArray(vids) ? vids.length : Number(distinct?.count || 0);
         } catch (e) {
            console.debug('failed to fetch distinct vocab for user', e);
            wordsLearned = 0;
         }

         setSummary({ lessonsCompleted, wordsLearned, hskkCount });
      } catch (e) {
         console.debug('failed to compute profile summary', e);
      }

      setStatsLoading(false);
   };

   const fetchProfile = async () => {
      try {
         const profile = await profileAPI.get();
         setProfileData({
            email: profile.email || "",
            fullName: profile.fullName || "",
            avatar: profile.avatar || "",
            level: profile.level || "Sơ cấp",
            studyGoal: profile.studyGoal || "30 minutes/day",
            joinDate: profile.joinDate || getVietnamDateIso(),
         });
      } catch (error) {
         console.error("Error fetching profile:", handleApiError(error));
      } finally {
         setLoading(false);
      }
   };

   const handleSave = async () => {
      try {
         setSaving(true);
         await profileAPI.update(profileData);
         setIsEditing(false);
      } catch (error) {
         console.error("Error updating profile:", handleApiError(error));
         alert("Có lỗi xảy ra khi cập nhật thông tin");
      } finally {
         setSaving(false);
      }
   };

   if (loading) {
      return (
         <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-64">
               <span className="loading loading-spinner loading-lg"></span>
            </div>
         </div>
      );
   }

   return (
      <div className="container mx-auto px-4 py-8">
         {/* Header */}
         <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">👤 Hồ sơ cá nhân</h1>
            <p className="text-lg text-base-content/70">Quản lý thông tin và theo dõi tiến độ học tập</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-1">
               <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                     <div className="text-center mb-6">
                        <div className="avatar mb-4">
                           <div className="w-24 rounded-full bg-primary text-primary-content">
                              <div className="flex items-center justify-center w-full h-full text-4xl">
                                 {profileData.fullName?.charAt(0) || profileData.email?.charAt(0) || "U"}
                              </div>
                           </div>
                        </div>

                        {isEditing ? (
                           <div className="space-y-3">
                              <input type="text" className="input input-bordered w-full" value={profileData.fullName} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} placeholder="Họ và tên" />
                              <input type="email" className="input input-bordered w-full" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} placeholder="Email" />
                           </div>
                        ) : (
                           <div>
                              <h2 className="text-2xl font-bold">{profileData.fullName || profileData.email}</h2>
                              <p className="text-sm text-base-content/60">{profileData.email}</p>
                           </div>
                        )}
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="font-semibold">Cấp độ:</span>
                           <span className="badge badge-primary">{profileData.level}</span>
                        </div>

                        <div className="flex justify-between">
                           <span className="font-semibold">Mục tiêu:</span>
                           <span>{profileData.studyGoal}</span>
                        </div>

                        <div className="flex justify-between">
                           <span className="font-semibold">Tham gia:</span>
                           <span>{new Date(profileData.joinDate).toLocaleDateString("vi-VN")}</span>
                        </div>
                     </div>

                     <div className="card-actions justify-center mt-6">
                        {isEditing ? (
                           <div className="space-x-2">
                              <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Hủy</button>
                              <button className={`btn btn-primary ${saving ? "loading" : ""}`} onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
                           </div>
                        ) : (
                           <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Stats and Achievements */}
            <div className="lg:col-span-2 space-y-8">
               {/* Study Stats */}
               <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                     <h2 className="card-title mb-4">📊 Thống kê học tập</h2>

                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="stat bg-primary/10 rounded-lg">
                           <div className="stat-title text-xs">Bài Học</div>
                           <div className="stat-value text-primary text-2xl">{summary.lessonsCompleted}</div>
                           <div className="stat-desc text-xs">Đã hoàn thành</div>
                        </div>

                        <div className="stat bg-secondary/10 rounded-lg">
                           <div className="stat-title text-xs">Từ Vựng</div>
                           <div className="stat-value text-secondary text-2xl">{summary.wordsLearned}</div>
                           <div className="stat-desc text-xs">Đã học</div>
                        </div>

                        <div className="stat bg-accent/10 rounded-lg">
                           <div className="stat-title text-xs">HSKK Sơ Cấp</div>
                           <div className="stat-value text-accent text-2xl">{summary.hskkCount}</div>
                           <div className="stat-desc text-xs">Đã làm</div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* ISE Pronunciation Stats (Daily / Lessons / Tests) */}
               <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                     <div className="flex items-start justify-between">
                        <h2 className="card-title mb-2">🔊 Đánh giá phát âm</h2>
                        <div className="space-x-2">
                           <button className={`btn btn-sm btn-ghost ${statsLoading ? "loading" : ""}`} onClick={fetchIseStatsToday}>Refresh</button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="col-span-1">
                           <div className="grid gap-3">
                              <div className="card p-3">
                                 <div className="font-semibold mb-2">Điểm ngày (Hôm nay)</div>
                                 {statsLoading ? (
                                    <div className="text-sm text-gray-500">Đang tải...</div>
                                 ) : dailyRows.length === 0 ? (
                                    <div className="text-sm text-gray-500">Chưa có lượt hôm nay</div>
                                 ) : (
                                    <div>
                                       {dailyRows.map((r) => (
                                          <div key={r.date} className="flex justify-between text-sm py-1">
                                             <div>{r.date}</div>
                                             <div className="font-medium">{r.avgScore}%</div>
                                          </div>
                                       ))}
                                       <div className="text-xs text-base-content/60 mt-2">Số lượt: {dailyRows[0]?.count ?? 0}</div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        <div className="col-span-2">
                           <div className="overflow-x-auto">
                              <table className="table w-full">
                                 <thead>
                                    <tr>
                                       <th>Bài</th>
                                       <th>Điểm trung bình từ</th>
                                       <th>Điểm trung bình câu</th>
                                       <th>Hoàn thành</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {statsLoading ? (
                                       <tr>
                                          <td colSpan={4} className="text-sm text-gray-500">Đang tải...</td>
                                       </tr>
                                    ) : lessonRows.length === 0 ? (
                                       <tr>
                                          <td colSpan={4} className="text-sm text-gray-500">Không có dữ liệu</td>
                                       </tr>
                                    ) : (
                                       lessonRows.map((r) => (
                                          <tr key={r.lessonId}>
                                             <td className="font-medium">{r.lessonId}</td>
                                             <td>{(r.avgWordScore != null ? `${r.avgWordScore}%` : (r.avgScore != null ? `${Math.round(r.avgScore)}%` : '—'))}</td>
                                             <td>{(r.avgSentenceScore != null ? `${r.avgSentenceScore}%` : (r.avgScore != null ? `${Math.round(r.avgScore)}%` : '—'))}</td>
                                             <td>{r.completedFull ? "✔" : "✘"}</td>
                                          </tr>
                                       ))
                                    )}
                                 </tbody>
                              </table>
                           </div>

                           <div className="mt-4">
                              <div className="font-semibold mb-2">Điểm test (Tổng quan)</div>
                              <div className="overflow-x-auto">
                                 <table className="table w-full">
                                    <thead>
                                       <tr>
                                          <th>Test ID</th>
                                          <th>Trung bình</th>
                                          <th>Số lần</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {statsLoading ? (
                                          <tr>
                                             <td colSpan={3} className="text-sm text-gray-500">Đang tải...</td>
                                          </tr>
                                       ) : testRows.length === 0 ? (
                                          <tr>
                                             <td colSpan={3} className="text-sm text-gray-500">Không có dữ liệu</td>
                                          </tr>
                                       ) : (
                                          testRows.map((r) => (
                                             <tr key={r.testId}>
                                                <td>{r.testId}</td>
                                                <td>{r.avgTotal}</td>
                                                <td>{r.attempts}</td>
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

               {/* Place Daily Leaderboard here as requested */}
               <div className="mb-4">
                  <DailyLeaderboard />
               </div>

            </div>
         </div>
      </div>
   );
};

export default ProfilePage;
