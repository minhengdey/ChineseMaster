import axios from "axios";
// import "window._env_";
// Base API configuration
const API_BASE_URL = window._env_.VITE_API_BASE_URL;

const apiClient = axios.create({
   baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
   (response) => response,
   (error) => {
      if (error.response?.status === 401) {
         // Token expired or invalid
         localStorage.removeItem("accessToken");
         localStorage.removeItem("refreshToken");
         localStorage.removeItem("user");
         window.location.href = "/";
      }
      return Promise.reject(error);
   }
);
export const userAPI = {
   getProfile: async () => {
      const response = await apiClient.get("/profile");
      return response.data;
   },
};
// Authentication APIs
export const authAPI = {
   register: async (userData) => {
      const response = await apiClient.post("/auth/register", {
         email: userData.email,
         password: userData.password,
         name: userData.username || userData.name,
      });
      return response.data;
   },

   login: async (credentials) => {
      const response = await apiClient.post("/auth/login", {
         email: credentials.email,
         password: credentials.password,
      });

      if (response.data.accessToken) {
         localStorage.setItem("accessToken", response.data.accessToken);

         return { token: response.data.accessToken };
      }

      return response.data;
   },

   logout: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
   },

   verifyToken: async (token) => {
      // If token is passed explicitly, send it in Authorization header;
      // otherwise apiClient will add accessToken from localStorage via interceptor
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient.get("/auth/verify", { headers });
      return response.data;
   },
};

// Lessons APIs
export const lessonsAPI = {
   getAll: async (level = null) => {
      const params = level ? { level } : {};
      const response = await apiClient.get("/lessons", { params });
      return response.data;
   },

   getById: async (id) => {
      const response = await apiClient.get(`/lessons/${id}`);
      return response.data;
   },
};

// Flashcards APIs
export const flashcardsAPI = {
   getAll: async () => {
      const response = await apiClient.get("/flashcards");
      return response.data;
   },

   create: async (flashcardData) => {
      const response = await apiClient.post("/flashcards", {
         hanzi: flashcardData.chinese,
         pinyin: flashcardData.pinyin,
         meaning: flashcardData.vietnamese || flashcardData.meaning,
      });
      return response.data;
   },

   getById: async (id) => {
      const response = await apiClient.get(`/flashcards/${id}`);
      return response.data;
   },

   review: async (id, result) => {
      const response = await apiClient.post(`/flashcards/${id}/review`, {
         result,
      });
      return response.data;
   },
};

// Profile APIs
export const profileAPI = {
   get: async () => {
      const response = await apiClient.get("/profile");
      return response.data;
   },

   update: async (profileData) => {
      const response = await apiClient.post("/profile", profileData);
      return response.data;
   },
};

// Pronunciation/Practice APIs
export const practiceAPI = {
   scoreAudio: async (audioFile, lessonId = null) => {
      const formData = new FormData();
      formData.append("file", audioFile);
      if (lessonId) {
         formData.append("lessonId", lessonId.toString());
      }

      // Do not set Content-Type so the browser can add the multipart boundary automatically.
      // Only pass Authorization header when available.
      const token = localStorage.getItem("accessToken");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await apiClient.post("/practice/score", formData, {
         headers,
      });
      return response.data;
   },
};

// Quiz APIs
export const quizAPI = {
   submit: async (quizData) => {
      const response = await apiClient.post("/quiz/submit", {
         lessonId: quizData.lessonId,
         answers: quizData.answers,
      });
      return response.data;
   },
};

// Content APIs (for curriculum and lessons)
export const contentAPI = {
   // Get all curriculums
   getCurriculums: async () => {
      const response = await apiClient.get("/content/curriculums");
      return response.data;
   },

   // Get curriculum by ID with lessons
   getCurriculumById: async (id) => {
      const response = await apiClient.get(`/content/curriculums/${id}`);
      return response.data;
   },

   // Get lessons of a curriculum
   getCurriculumLessons: async (curriculumId) => {
      const response = await apiClient.get(
         `/content/curriculums/${curriculumId}/lessons`
      );
      return response.data;
   },

   // Get lesson detail with conversations and vocabulary
   getLessonDetail: async (lessonId) => {
      const response = await apiClient.get(`/content/lessons/${lessonId}`);
      return response.data;
   },
};

// Audio APIs
export const audioAPI = {
   getAudioUrl: (filename) => {
      return `${API_BASE_URL}/audio/${filename}`;
   },

   playAudio: (filename) => {
      const audio = new Audio(`${API_BASE_URL}/audio/${filename}`);
      return audio.play();
   },
};

// ISE (pronunciation scoring) APIs
export const iseAPI = {
   // scoreSentence should post multipart/form-data matching backend signature
   // Supports optional parts: scoreCategory, lessonId, testId, includeInDaily, sessionDate, durationSeconds, numSentences
   scoreSentence: async ({
      text,
      audioFile,
      sub = "ise",
      ent = "cn_vip",
      scoreCategory,
      lessonId,
      testId,
      includeInDaily,
      sessionDate,
      durationSeconds,
      numSentences,
   }) => {
      try {
         const formData = new FormData();
         // required parts
         // Append text parts as Blobs with explicit text/plain content type so Spring's @RequestPart can convert them
         formData.append(
            "text",
            new Blob([text ?? ""], { type: "text/plain;charset=UTF-8" })
         );
         formData.append("audio", audioFile);
         formData.append(
            "sub",
            new Blob([sub ?? ""], { type: "text/plain;charset=UTF-8" })
         );
         formData.append(
            "ent",
            new Blob([ent ?? ""], { type: "text/plain;charset=UTF-8" })
         );

         // optional parts - only append when provided (not null/undefined)
         if (scoreCategory != null)
            formData.append(
               "scoreCategory",
               new Blob([String(scoreCategory)], {
                  type: "text/plain;charset=UTF-8",
               })
            );
         if (lessonId != null)
            formData.append(
               "lessonId",
               new Blob([String(lessonId)], {
                  type: "text/plain;charset=UTF-8",
               })
            );
         if (testId != null)
            formData.append(
               "testId",
               new Blob([String(testId)], { type: "text/plain;charset=UTF-8" })
            );
         if (includeInDaily != null)
            formData.append(
               "includeInDaily",
               new Blob([String(includeInDaily)], {
                  type: "text/plain;charset=UTF-8",
               })
            );
         if (sessionDate != null)
            formData.append(
               "sessionDate",
               new Blob([String(sessionDate)], {
                  type: "text/plain;charset=UTF-8",
               })
            );
         if (durationSeconds != null)
            formData.append(
               "durationSeconds",
               new Blob([String(durationSeconds)], {
                  type: "text/plain;charset=UTF-8",
               })
            );
         if (numSentences != null)
            formData.append(
               "numSentences",
               new Blob([String(numSentences)], {
                  type: "text/plain;charset=UTF-8",
               })
            );

         // Debug: log FormData parts (key and type) to help server-side troubleshooting
         try {
            for (const entry of formData.entries()) {
               const [k, v] = entry;
               if (v instanceof File) {
                  console.debug(
                     "[iseAPI] formData entry:",
                     k,
                     "File",
                     v.name,
                     v.type,
                     v.size
                  );
               } else if (v instanceof Blob) {
                  console.debug("[iseAPI] formData entry:", k, "Blob", v.type);
               } else {
                  console.debug("[iseAPI] formData entry:", k, typeof v, v);
               }
            }
         } catch (e) {
            console.debug("[iseAPI] formData debug failed", e);
         }

         // Do not set Content-Type so the browser can add the multipart boundary automatically.
         // Only pass Authorization header when available.
         const token = localStorage.getItem("accessToken");
         const headers = {};
         if (token) headers.Authorization = `Bearer ${token}`;

         const response = await apiClient.post("/ise/score", formData, {
            headers,
         });

         return response.data;
      } catch (error) {
         console.error("ISE API Error:", error);
         throw new Error(
            error.response?.data?.message ||
               error.message ||
               "Không thể đánh giá phát âm. Vui lòng kiểm tra kết nối mạng và thử lại."
         );
      }
   },

   // NEW: scoreWord for vocabulary using the new IseWordController
   scoreWord: async ({ text, audioFile }) => {
      try {
         const formData = new FormData();
         formData.append("text", text);

         // Ensure audioFile has proper name and type
         const audioFileWithName = new File([audioFile], "recording.webm", {
            type: audioFile.type || "audio/webm",
         });
         formData.append("audio", audioFileWithName);

         console.log("Sending to ISE Word API:", {
            text: text,
            audioFileName: audioFileWithName.name,
            audioSize: audioFileWithName.size,
            audioType: audioFileWithName.type,
            endpoint: "/ise/score/word",
         });

         const response = await apiClient.post("/ise/score/word", formData, {
            headers: {
               "Content-Type": "multipart/form-data",
            },
         });

         // IseWordController returns JSON string, parse it
         let result = response.data;
         if (typeof result === "string") {
            try {
               result = JSON.parse(result);
            } catch (parseError) {
               console.warn(
                  "Failed to parse ISE Word response as JSON:",
                  parseError
               );
               return { raw_response: result };
            }
         }

         console.log("ISE Word API result:", result);
         return result;
      } catch (error) {
         console.error("ISE Word API Error:", error);

         // Extract meaningful error message
         let errorMessage = "Không thể đánh giá phát âm từ vựng.";

         if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
         } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
         } else if (error.message) {
            errorMessage = error.message;
         }

         // Handle specific ISE API errors
         if (errorMessage.includes("48195") || errorMessage.includes("8195")) {
            errorMessage =
               "Từ này có thể quá phức tạp để đánh giá. Hãy thử nói rõ ràng hơn.";
         }

         throw new Error(errorMessage);
      }
   },
};

// ISE stats for frontend displays (daily/lesson/test summaries)
export const iseStatsAPI = {
   getDaily: async (fromIsoDate, toIsoDate) => {
      const params = {};
      if (fromIsoDate) params.from = fromIsoDate;
      if (toIsoDate) params.to = toIsoDate;
      const response = await apiClient.get("/ise/stats/daily", { params });
      return response.data;
   },
   getLessons: async () => {
      const response = await apiClient.get("/ise/stats/lessons");
      return response.data;
   },
   getTests: async () => {
      const response = await apiClient.get("/ise/stats/tests");
      return response.data;
   },
};

// Migration/content helper APIs
export const migrationAPI = {
   getConversationLinesByLesson: async (lessonId) => {
      if (!lessonId) {
         const response = await apiClient.get(
            "/migration/conversationLineByLessionId"
         );
         return response.data;
      }
      const response = await apiClient.get(
         `/migration/conversationLineByLessionId/${lessonId}`
      );
      return response.data;
   },
};

// Helper function to handle API errors
export const handleApiError = (error) => {
   if (error.response?.data?.error) {
      return error.response.data.error;
   }
   if (error.message) {
      return error.message;
   }
   return "Đã xảy ra lỗi không xác định";
};

export default apiClient;
