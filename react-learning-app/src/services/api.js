import axios from "axios";
// import "window._env_";
// Base API configuration (fallback-safe)
const API_BASE_URL =
   typeof window !== "undefined" &&
      window._env_ &&
      window._env_.VITE_API_BASE_URL
      ? window._env_.VITE_API_BASE_URL
      : import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8080/api";

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

      // Backend now returns { accessToken, expiresIn, user: { id, email, name } }
      if (response.data?.accessToken) {
         localStorage.setItem("accessToken", response.data.accessToken);
         if (response.data.user) {
            try {
               localStorage.setItem("user", JSON.stringify(response.data.user));
            } catch (e) {
               console.warn('Failed to save user to localStorage', e);
            }
         }
         return { token: response.data.accessToken, user: response.data.user };
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
      if (lessonId == null || lessonId === "") {
         // Defensive: avoid sending requests like /content/lessons/undefined to the server
         throw new Error("getLessonDetail requires a valid lessonId");
      }
      const response = await apiClient.get(`/content/lessons/${lessonId}`);
      return response.data;
   },
};

// Audio APIs
export const audioAPI = {
   // Resolve an audio URL from either a full URL or a backend filename.
   // If `filename` is already an absolute URL, return it (after normalizing known typos).
   // Otherwise, build a URL using the API base path.
   getAudioUrl: (filename) => {
      if (!filename) return null;
      try {
         if (
            typeof filename === "string" &&
            (filename.startsWith("http://") || filename.startsWith("https://"))
         ) {
            // Fix a common path typo observed in some cloudinary assets
            return filename.replace("/curriculumn/", "/curriculum/");
         }
      } catch (e) {
         // fallthrough to default behavior
      }
      return `${API_BASE_URL}/audio/${filename}`;
   },

   playAudio: (filename) => {
      const url = audioAPI.getAudioUrl(filename);
      if (!url)
         return Promise.reject(new Error("no audio filename/url provided"));
      const audio = new Audio(url);
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
      lineId,
      vocabularyId,
      source,
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
         if (lineId != null)
            formData.append(
               "lineId",
               new Blob([String(lineId)], { type: "text/plain;charset=UTF-8" })
            );
         if (vocabularyId != null)
            formData.append(
               "vocabularyId",
               new Blob([String(vocabularyId)], { type: "text/plain;charset=UTF-8" })
            );
         if (source != null)
            formData.append(
               "source",
               new Blob([String(source)], { type: "text/plain;charset=UTF-8" })
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

         console.log("ISE sentence analysis result (raw):", response.data);

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
   scoreWord: async ({ text, audioFile, vocabularyId, lessonId }) => {
      try {
         const formData = new FormData();
         formData.append("text", text);

         // Ensure audioFile has proper name and type
         const audioFileWithName = new File([audioFile], "recording.webm", {
            type: audioFile.type || "audio/webm",
         });
         formData.append("audio", audioFileWithName);
         // attach vocabularyId and lessonId when present so backend can attribute attempt
         if (vocabularyId != null) {
            formData.append(
               "vocabularyId",
               new Blob([String(vocabularyId)], {
                  type: "text/plain;charset=UTF-8",
               })
            );
         }
         if (lessonId != null) {
            formData.append(
               "lessonId",
               new Blob([String(lessonId)], {
                  type: "text/plain;charset=UTF-8",
               })
            );
         }

         console.log("Sending to ISE Word API:", {
            text: text,
            audioFileName: audioFileWithName.name,
            audioSize: audioFileWithName.size,
            audioType: audioFileWithName.type,
            endpoint: "/ise/score",
         });

         // Debug: list FormData entries (helps verify the file object and parts the browser will send)
         try {
            for (const entry of formData.entries()) {
               const [k, v] = entry;
               if (v instanceof File) {
                  console.debug(
                     "[iseAPI.scoreWord] formData entry:",
                     k,
                     "File",
                     v.name,
                     v.type,
                     v.size
                  );
               } else if (v instanceof Blob) {
                  console.debug(
                     "[iseAPI.scoreWord] formData entry:",
                     k,
                     "Blob",
                     v.type
                  );
               } else {
                  console.debug(
                     "[iseAPI.scoreWord] formData entry:",
                     k,
                     typeof v,
                     v
                  );
               }
            }
         } catch (e) {
            console.debug("[iseAPI.scoreWord] formData debug failed", e);
         }

         const response = await apiClient.post("/ise/score", formData);

         // IseWordController may return different shapes:
         // - a JSON string
         // - an object like { result: { ... } } or { data: { ... } }
         // - an array [ {...} ]
         // Normalize into a consistent scoring object when possible.
         let result = response.data;

         // If it's a string, try to parse it as JSON
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

         // If wrapped in { result: ... } or { data: ... }, unwrap it
         if (result && typeof result === "object") {
            if (result.result && typeof result.result === "object") {
               result = result.result;
            } else if (result.data && typeof result.data === "object") {
               result = result.data;
            }
         }

         // If it's an array, take the first element
         if (Array.isArray(result)) {
            result = result.length > 0 ? result[0] : { raw_response: [] };
         }

         // Build a normalized object exactly like scoreSentence normalization
         if (result && typeof result === "object") {
            const sent = result.sentence || {};
            const normalized = {
               total_score:
                  sent.total_score ??
                  result.total_score ??
                  result.totalScore ??
                  result.overall ??
                  null,
               fluency:
                  sent.fluency ?? result.fluency ?? result.fluencyScore ?? null,
               completeness:
                  sent.completeness ??
                  result.completeness ??
                  result.completenessScore ??
                  null,
               wrong_words:
                  sent.wrong_words ??
                  result.wrong_words ??
                  result.wrongWords ??
                  result.wrong ??
                  [],
               sid: sent.sid ?? result.sid ?? null,
               status: sent.status ?? result.status ?? null,
               raw_xml:
                  sent.raw_xml ??
                  result.raw_xml ??
                  result.rawXml ??
                  result.rawXML ??
                  null,
               words: result.words ?? sent.words ?? [],
            };
            return normalized;
         }

         // Fallback: return as-is if structure unknown
         return { raw_response: result };
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
   getPronouncedForLesson: async (lessonId) => {
      const response = await apiClient.get("/ise/stats/pronounced", {
         params: { lessonId },
      });
      return response.data;
   },
   getDistinctVocabForUser: async () => {
      const response = await apiClient.get('/ise/stats/distinct-vocab');
      return response.data;
   },
   // Leaderboard endpoints (optional on backend)
   getLeaderboardDaily: async () => {
      const response = await apiClient.get('/ise/stats/leaderboard/daily');
      return response.data;
   },
   getLeaderboardByLesson: async (lessonId) => {
      const params = {};
      if (lessonId != null) params.lessonId = lessonId;
      const response = await apiClient.get('/ise/stats/leaderboard/lesson', { params });
      return response.data;
   },
};

// Pronunciation guide lookup (uses backend /api/pronunciation endpoints)
export const pronunciationAPI = {
   // New unified lookup endpoint. Pass `q` which may be an initial, final or tone.
   lookup: async (q) => {
      if (!q) return null;
      try {
         const response = await apiClient.get("/pronunciation", {
            params: { q },
         });
         return response.data;
      } catch (err) {
         if (err.response && err.response.status === 404) return null;
         throw err;
      }
   },

   // Backwards-compatible wrappers (optional)
   getByInitial: async (initial) => {
      return pronunciationAPI.lookup(initial);
   },
   getByFinal: async (finalText) => {
      return pronunciationAPI.lookup(finalText);
   },
   getByTone: async (name) => {
      return pronunciationAPI.lookup(name);
   },
};

export const userLessonAPI = {
   complete: async (lessonId, completed) => {
      const response = await apiClient.post(
         `/user-lessons/${lessonId}/complete`,
         { params: { completed } }
      );
      return response.data;
   },
   getUserLesson: async (lessonId) => {
      const response = await apiClient.get(`/user-lessons/${lessonId}`);
      return response.data;
   },
   isCompleted: async (lessonId) => {
      const response = await apiClient.get(
         `/user-lessons/${lessonId}/isCompleted`
      );
      return response.data;
   },
};

// Migration/content helper APIs
export const migrationAPI = {
   getConversationLinesByLesson: async (lessonId) => {
      // Some deployments use a misspelled path "Lession". Try both gracefully.
      const paths = !lessonId
         ? [
            "/migration/conversationLineByLessonId",
            "/migration/conversationLineByLessionId",
         ]
         : [
            `/migration/conversationLineByLessonId/${lessonId}`,
            `/migration/conversationLineByLessionId/${lessonId}`,
         ];

      let lastError;
      for (const p of paths) {
         try {
            const response = await apiClient.get(p);
            return response.data;
         } catch (e) {
            lastError = e;
            // try next path
         }
      }
      throw lastError || new Error("Không thể lấy dữ liệu hội thoại từ server");
   },
};

// Helper function to handle API errors
export const handleApiError = (error) => {
   // Prefer structured server error messages when available
   const respData = error.response?.data
   const serverMessage = respData?.error ?? respData?.message ?? respData
   // Handle common known backend messages and normalize for UI
   try {
      const msgStr = typeof serverMessage === "string" ? serverMessage : JSON.stringify(serverMessage)
      if (/email already exists/i.test(msgStr)) {
         return "Email đã tồn tại. Vui lòng dùng email khác hoặc đăng nhập.";
      }
      if (serverMessage) return serverMessage
   } catch (e) {
      // fallthrough
   }

   // Fallback to the error.message (axios/network) or a generic message
   if (error.message) {
      return error.message;
   }
   return "Đã xảy ra lỗi không xác định";
};

export default apiClient;
