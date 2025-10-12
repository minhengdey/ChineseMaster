import React, { useState, useEffect } from "react";
import { profileAPI, handleApiError } from "../../services/api";

const ProfilePage = () => {
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

   useEffect(() => {
      fetchProfile();
   }, []);

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
      <div className="container mx-auto max-w-4xl px-4 py-12">
         {/* Header */}
         <div className="mb-6">
            <h1 className="text-3xl font-semibold text-primary mb-1">
               Hồ sơ cá nhân
            </h1>
            <p className="text-sm text-base-content/60">
               Quản lý thông tin và theo dõi tiến độ học tập
            </p>
         </div>

         <div className="bg-base-100 shadow-lg rounded-lg overflow-hidden">
            <div className="md:flex">
               {/* Left column - avatar */}
               <aside className="md:w-4/12 p-6 flex flex-col items-center text-center bg-gradient-to-b from-primary/10 to-transparent">
                  <div className="avatar mb-4">
                     <div className="w-24 h-24 rounded-full mx-auto bg-primary text-primary-content shadow-inner ring-2 ring-primary/20">
                        <div className="flex items-center justify-center w-full h-full text-3xl">
                           {profileData.fullName?.charAt(0) ||
                              profileData.email?.charAt(0) ||
                              "U"}
                        </div>
                     </div>
                  </div>

                  <h2 className="text-xl font-semibold">
                     {profileData.fullName || profileData.email}
                  </h2>
                  {profileData.email && (
                     <p className="text-xs text-base-content/60">
                        {profileData.email}
                     </p>
                  )}

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
               </aside>

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
         </div>
      </div>
   );
};

export default ProfilePage;
