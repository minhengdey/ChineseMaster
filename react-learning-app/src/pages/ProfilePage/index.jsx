import React, { useState, useEffect } from "react";
import { profileAPI, handleApiError } from "../../services/api";
import { iseStatsAPI } from "../../services/api";

const ProfilePage = ({ user }) => {
   const [isEditing, setIsEditing] = useState(false);
   const [profileData, setProfileData] = useState({
      email: "",
      fullName: "",
      avatar: "",
      level: "Beginner",
      studyGoal: "30 minutes/day",
      joinDate: "",
   });
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [statsLoading, setStatsLoading] = useState(true);
   const [dailyRows, setDailyRows] = useState([]);
   const [lessonRows, setLessonRows] = useState([]);
   const [testRows, setTestRows] = useState([]);

   useEffect(() => {
      fetchProfile();
      fetchIseStatsToday();

      const handler = (e) => {
         // Optimistically update UI with submitted score data to make profile feel responsive
         try {
            const detail = e?.detail || {};
            const score = detail.score;
            const lessonId = detail.lessonId;
            const includeInDaily = detail.includeInDaily;

            if (includeInDaily && score) {
               const todayStr = new Date().toISOString().split("T")[0];
               // increase or add today's row
               setDailyRows((prev) => {
                  const copy = Array.isArray(prev) ? [...prev] : [];
                  if (copy.length === 0 || copy[0]?.date !== todayStr) {
                     // insert today's row at start
                     copy.unshift({
                        date: todayStr,
                        avgScore: Math.round(score.total_score ?? 0),
                        count: 1,
                     });
                  } else {
                     // update average and count (simple incremental average)
                     const existing = copy[0];
                     const prevAvg = Number(existing.avgScore || 0);
                     const prevCount = Number(existing.count || 0);
                     const newCount = prevCount + 1;
                     const newAvg = Math.round(
                        (prevAvg * prevCount + (score.total_score ?? 0)) /
                           newCount
                     );
                     copy[0] = {
                        ...existing,
                        avgScore: newAvg,
                        count: newCount,
                     };
                  }
                  return copy;
               });
            }

            // update lesson rows if lessonId present
            if (lessonId && score) {
               setLessonRows((prev) => {
                  const copy = Array.isArray(prev) ? [...prev] : [];
                  const idx = copy.findIndex(
                     (r) => String(r.lessonId) === String(lessonId)
                  );
                  if (idx === -1) {
                     copy.push({
                        lessonId,
                        avgScore: Math.round(score.total_score ?? 0),
                        completedFull: false,
                        lessonScore: Math.round(score.total_score ?? 0),
                     });
                  } else {
                     const existing = copy[idx];
                     const prevAvg = Number(existing.avgScore || 0);
                     const prevCount = Number(existing.attempts || 1); // attempts may not be present; fallback to 1
                     const newCount = prevCount + 1;
                     const newAvg = Math.round(
                        (prevAvg * prevCount + (score.total_score ?? 0)) /
                           newCount
                     );
                     copy[idx] = { ...existing, avgScore: newAvg };
                  }
                  return copy;
               });
            }
         } catch (err) {
            console.debug("optimistic stats update failed", err);
         }

         // finally schedule a background refresh to reconcile with server state
         setTimeout(() => fetchIseStatsToday(), 1000);
      };

      window.addEventListener("ise:score:submitted", handler);
      return () => window.removeEventListener("ise:score:submitted", handler);
   }, []);

   const fetchIseStatsToday = async () => {
      setStatsLoading(true);
      try {
         const today = new Date().toISOString().split("T")[0];
         const daily = await iseStatsAPI.getDaily(today, today);
         setDailyRows(Array.isArray(daily?.rows) ? daily.rows : []);
      } catch (e) {
         console.debug("failed daily stats", e);
         setDailyRows([]);
      }
      try {
         const lessons = await iseStatsAPI.getLessons();
         setLessonRows(Array.isArray(lessons?.rows) ? lessons.rows : []);
      } catch (e) {
         console.debug("failed lesson stats", e);
         setLessonRows([]);
      }
      try {
         const tests = await iseStatsAPI.getTests();
         setTestRows(Array.isArray(tests?.rows) ? tests.rows : []);
      } catch (e) {
         console.debug("failed test stats", e);
         setTestRows([]);
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
            level: profile.level || "Beginner",
            studyGoal: profile.studyGoal || "30 minutes/day",
            joinDate:
               profile.joinDate || new Date().toISOString().split("T")[0],
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

   const stats = {
      lessonsCompleted: 0,
      wordsLearned: 0,
      studyStreak: 0,
      totalStudyTime: 0,
      quizScore: 0,
      flashcardsReviewed: 0,
   };

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
            <p className="text-lg text-base-content/70">
               Quản lý thông tin và theo dõi tiến độ học tập
            </p>
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
                                 {profileData.fullName?.charAt(0) ||
                                    profileData.email?.charAt(0) ||
                                    "U"}
                              </div>
                           </div>
                        </div>

                        {isEditing ? (
                           <div className="space-y-3">
                              <input
                                 type="text"
                                 className="input input-bordered w-full"
                                 value={profileData.fullName}
                                 onChange={(e) =>
                                    setProfileData({
                                       ...profileData,
                                       fullName: e.target.value,
                                    })
                                 }
                                 placeholder="Họ và tên"
                              />
                              <input
                                 type="email"
                                 className="input input-bordered w-full"
                                 value={profileData.email}
                                 onChange={(e) =>
                                    setProfileData({
                                       ...profileData,
                                       email: e.target.value,
                                    })
                                 }
                                 placeholder="Email"
                              />
                           </div>
                        ) : (
                           <div>
                              <h2 className="text-2xl font-bold">
                                 {profileData.fullName || profileData.email}
                              </h2>
                              <p className="text-sm text-base-content/60">
                                 {profileData.email}
                              </p>
                           </div>
                        )}
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between">
                           <span className="font-semibold">Cấp độ:</span>
                           <span className="badge badge-primary">
                              {profileData.level}
                           </span>
                        </div>

                        <div className="flex justify-between">
                           <span className="font-semibold">Mục tiêu:</span>
                           <span>{profileData.studyGoal}</span>
                        </div>

                        <div className="flex justify-between">
                           <span className="font-semibold">Tham gia:</span>
                           <span>
                              {new Date(
                                 profileData.joinDate
                              ).toLocaleDateString("vi-VN")}
                           </span>
                        </div>
                     </div>

                     <div className="card-actions justify-center mt-6">
                        {isEditing ? (
                           <div className="space-x-2">
                              <button
                                 className="btn btn-outline"
                                 onClick={() => setIsEditing(false)}
                              >
                                 Hủy
                              </button>
                              <button
                                 className={`btn btn-primary ${
                                    saving ? "loading" : ""
                                 }`}
                                 onClick={handleSave}
                                 disabled={saving}
                              >
                                 {saving ? "Đang lưu..." : "Lưu"}
                              </button>
                           </div>
                        ) : (
                           <button
                              className="btn btn-outline"
                              onClick={() => setIsEditing(true)}
                           >
                              Chỉnh sửa
                           </button>
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
                           <div className="stat-title text-xs">Bài học</div>
                           <div className="stat-value text-primary text-2xl">
                              {stats.lessonsCompleted}
                           </div>
                           <div className="stat-desc text-xs">
                              Đã hoàn thành
                           </div>
                        </div>

                        <div className="stat bg-secondary/10 rounded-lg">
                           <div className="stat-title text-xs">Từ vựng</div>
                           <div className="stat-value text-secondary text-2xl">
                              {stats.wordsLearned}
                           </div>
                           <div className="stat-desc text-xs">Đã học</div>
                        </div>

                        <div className="stat bg-accent/10 rounded-lg">
                           <div className="stat-title text-xs">Chuỗi ngày</div>
                           <div className="stat-value text-accent text-2xl">
                              {stats.studyStreak}
                           </div>
                           <div className="stat-desc text-xs">
                              Học liên tiếp
                           </div>
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
                           <button
                              className={`btn btn-sm btn-ghost ${
                                 statsLoading ? "loading" : ""
                              }`}
                              onClick={fetchIseStatsToday}
                           >
                              Refresh
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="col-span-1">
                           <div className="card p-3">
                              <div className="font-semibold mb-2">
                                 Điểm ngày (Hôm nay)
                              </div>
                              {statsLoading ? (
                                 <div className="text-sm text-gray-500">
                                    Đang tải...
                                 </div>
                              ) : dailyRows.length === 0 ? (
                                 <div className="text-sm text-gray-500">
                                    Chưa có lượt hôm nay
                                 </div>
                              ) : (
                                 <div>
                                    {dailyRows.map((r) => (
                                       <div
                                          key={r.date}
                                          className="flex justify-between text-sm py-1"
                                       >
                                          <div>{r.date}</div>
                                          <div className="font-medium">
                                             {r.avgScore}%
                                          </div>
                                       </div>
                                    ))}
                                    <div className="text-xs text-base-content/60 mt-2">
                                       Số lượt: {dailyRows[0]?.count ?? 0}
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="col-span-2">
                           <div className="overflow-x-auto">
                              <table className="table w-full">
                                 <thead>
                                    <tr>
                                       <th>Bài</th>
                                       <th>Điểm trung bình</th>
                                       <th>Hoàn thành</th>
                                       <th>Điểm bài</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {statsLoading ? (
                                       <tr>
                                          <td
                                             colSpan={5}
                                             className="text-sm text-gray-500"
                                          >
                                             Đang tải...
                                          </td>
                                       </tr>
                                    ) : lessonRows.length === 0 ? (
                                       <tr>
                                          <td
                                             colSpan={4}
                                             className="text-sm text-gray-500"
                                          >
                                             Không có dữ liệu
                                          </td>
                                       </tr>
                                    ) : (
                                       lessonRows.map((r) => (
                                          <tr key={r.lessonId}>
                                             <td>{r.lessonId}</td>
                                             <td>{r.avgScore}</td>
                                             <td>
                                                {r.completedFull ? "✔" : "✘"}
                                             </td>
                                             <td>{r.lessonScore}</td>
                                          </tr>
                                       ))
                                    )}
                                 </tbody>
                              </table>
                           </div>

                           <div className="mt-4">
                              <div className="font-semibold mb-2">
                                 Điểm test (Tổng quan)
                              </div>
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
                                             <td
                                                colSpan={3}
                                                className="text-sm text-gray-500"
                                             >
                                                Đang tải...
                                             </td>
                                          </tr>
                                       ) : testRows.length === 0 ? (
                                          <tr>
                                             <td
                                                colSpan={3}
                                                className="text-sm text-gray-500"
                                             >
                                                Không có dữ liệu
                                             </td>
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

               {/* Achievements */}
               <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                     <h2 className="card-title mb-4">🏆 Thành tích</h2>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievements.map((achievement) => (
                           <div
                              key={achievement.id}
                              className={`card shadow ${
                                 achievement.unlocked
                                    ? "bg-success/10 border border-success/20"
                                    : "bg-base-200 opacity-60"
                              }`}
                           >
                              <div className="card-body py-4">
                                 <div className="flex items-center space-x-3">
                                    <div className="text-3xl">
                                       {achievement.icon}
                                    </div>
                                    <div className="flex-1">
                                       <h3 className="font-bold text-sm">
                                          {achievement.name}
                                       </h3>
                                       <p className="text-xs text-base-content/70">
                                          {achievement.description}
                                       </p>
                                    </div>
                                 </div>
                              </div>

                              <h2 className="text-xl font-semibold">
                                 {profileData.fullName || profileData.email}
                              </h2>

                              <div className="mt-4">
                                 {!isEditing && (
                                    <button
                                       className="btn btn-sm btn-outline"
                                       onClick={() => setIsEditing(true)}
                                    >
                                       Chỉnh sửa
                                    </button>
                                 )}
                              </div>

                              {/* Right column - details */}
                              <main className="md:w-8/12 p-6">
                                 {isEditing ? (
                                    <div className="space-y-4">
                                       <div>
                                          <label className="text-sm text-base-content/70">
                                             Họ và tên
                                          </label>
                                          <input
                                             type="text"
                                             className="input input-bordered w-full mt-1"
                                             value={profileData.fullName}
                                             onChange={(e) =>
                                                setProfileData({
                                                   ...profileData,
                                                   fullName: e.target.value,
                                                })
                                             }
                                             placeholder="Họ và tên"
                                          />
                                       </div>

                                       <div>
                                          <label className="text-sm text-base-content/70">
                                             Email
                                          </label>
                                          <input
                                             type="email"
                                             className="input input-bordered w-full mt-1"
                                             value={profileData.email}
                                             onChange={(e) =>
                                                setProfileData({
                                                   ...profileData,
                                                   email: e.target.value,
                                                })
                                             }
                                             placeholder="Email"
                                          />
                                       </div>

                                       <div className="flex justify-end gap-3">
                                          <button
                                             className="btn btn-ghost"
                                             onClick={() => setIsEditing(false)}
                                          >
                                             Hủy
                                          </button>
                                          <button
                                             className={`btn btn-primary ${
                                                saving ? "loading" : ""
                                             }`}
                                             onClick={handleSave}
                                             disabled={saving}
                                          >
                                             {saving ? "Đang lưu..." : "Lưu"}
                                          </button>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                       {profileData.level && (
                                          <div className="flex items-center justify-between px-2 py-3 bg-base-200 rounded">
                                             <span className="text-sm text-base-content/70">
                                                Cấp độ
                                             </span>
                                             <span className="badge badge-primary">
                                                {profileData.level}
                                             </span>
                                          </div>
                                       )}

                                       {profileData.studyGoal && (
                                          <div className="flex items-center justify-between px-2 py-3 bg-base-200 rounded">
                                             <span className="text-sm text-base-content/70">
                                                Mục tiêu
                                             </span>
                                             <span className="text-sm">
                                                {profileData.studyGoal}
                                             </span>
                                          </div>
                                       )}

                                       {profileData.joinDate && (
                                          <div className="flex items-center justify-between px-2 py-3 bg-base-200 rounded">
                                             <span className="text-sm text-base-content/70">
                                                Tham gia
                                             </span>
                                             <span className="text-sm">
                                                {new Date(
                                                   profileData.joinDate
                                                ).toLocaleDateString("vi-VN")}
                                             </span>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </main>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ProfilePage;
