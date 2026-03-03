import axios from "axios";
import { ROUTES } from "../constants/routes";
// import "window._env_";
// Base API configuration (runtime override from public/env-config.js)
// Priority: runtime `window._env_.VITE_API_URL` -> `window._env_.REACT_APP_API_URL` -> import.meta env -> fallback to relative `/api`
// Use relative `/api` so frontend calls like `fetch('/api/login')` or axios to `/auth/login` go through the same origin proxy/router.
const API_BASE_URL =
   typeof window !== "undefined" &&
      window._env_ &&
      (window._env_.VITE_API_URL || window._env_.REACT_APP_API_URL)
      ? (window._env_.VITE_API_URL || window._env_.REACT_APP_API_URL)
      : import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_URL || "https://chinese-master-be-f5emhxc7c5dwd7d2.southeastasia-01.azurewebsites.net/api";

// const API_BASE_URL = "http://localhost:8080/api";

const AUTH_PATHS = {
   LOGIN: "/auth/login",
   REGISTER: "/auth/register",
   REFRESH: "/auth/refresh",
   LOGOUT: "/auth/logout",
   VERIFY: "/auth/verify",
};

const LOGIN_ROUTE = ROUTES.LOGIN;

const isAuthPath = (url, path) => {
   if (!url) return false;
   const normalized = url.replace(API_BASE_URL, "").split("?")[0];
   return normalized === path || normalized.endsWith(path);
};

const isRefreshRequest = (config) => Boolean(config?.skipAuthRefresh);
const isRetriedRequest = (config) => Boolean(config?._retried);

/**
 * Axios client with 401 handling:
 * - On 401: call refresh once (queue concurrent requests), then retry failed requests.
 * - On 401/403 from refresh: clear session via logout API and redirect to /login.
 * - Login/register 401 are not retried; 403 on normal requests are not refreshed.
 */
const apiClient = axios.create({
   baseURL: API_BASE_URL,
   withCredentials: true,
});

let refreshPromise = null;
const failedQueue = [];
let isRedirecting = false;

const forceLogout = () => {
   if (isRedirecting) return;
   isRedirecting = true;
   apiCache.invalidateAll();
   apiClient.post(AUTH_PATHS.LOGOUT, null, { skipAuthRefresh: true }).catch(() => {}).finally(() => {
      if (typeof window !== "undefined") {
         window.location.href = LOGIN_ROUTE;
      }
   });
};

const callRefresh = () => {
   return apiClient.post(AUTH_PATHS.REFRESH, null, { skipAuthRefresh: true });
};

const processQueue = (error, token = null) => {
   failedQueue.forEach((promise) => {
      if (error) {
         promise.reject(error);
      } else {
         promise.resolve(token);
      }
   });
   failedQueue.length = 0;
};

apiClient.interceptors.response.use(
   (response) => response,
   async (error) => {
      const status = error.response?.status;
      const config = error.config;
      if (!config) return Promise.reject(error);

      if (status === 403 && !isRefreshRequest(config)) {
         return Promise.reject(error);
      }
      if (status !== 401 && status !== 403) {
         return Promise.reject(error);
      }

      if (isRefreshRequest(config)) {
         processQueue(error, null);
         refreshPromise = null;
         forceLogout();
         return Promise.reject(error);
      }

      if (isRetriedRequest(config)) {
         forceLogout();
         return Promise.reject(error);
      }

      if (
         isAuthPath(config?.url, AUTH_PATHS.LOGIN) ||
         isAuthPath(config?.url, AUTH_PATHS.REGISTER) ||
         isAuthPath(config?.url, AUTH_PATHS.VERIFY) ||
         isAuthPath(config?.url, AUTH_PATHS.LOGOUT)
      ) {
         return Promise.reject(error);
      }

      if (isAuthPath(config?.url, AUTH_PATHS.REFRESH)) {
         processQueue(error, null);
         refreshPromise = null;
         forceLogout();
         return Promise.reject(error);
      }

      const queuePromise = new Promise((resolve, reject) => {
         failedQueue.push({ resolve, reject });
      });

      if (refreshPromise === null) {
         refreshPromise = callRefresh()
            .then(() => {
               processQueue(null, true);
               refreshPromise = null;
            })
            .catch((refreshError) => {
               processQueue(refreshError ?? error, null);
               refreshPromise = null;
               forceLogout();
            });
      }

      return queuePromise.then(() => {
         config._retried = true;
         return apiClient.request(config);
      }).catch((err) => Promise.reject(err));
   }
);

// In-memory cache to reduce duplicate API calls (TTL in ms)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = {
   profile: null,
   profileTs: 0,
   curriculums: null,
   curriculumsTs: 0,
   curriculumLessons: Object.create(null), // { [curriculumId]: { data, ts } }
   lessons: Object.create(null), // { [lessonId]: { data, ts } }
   leaderboardWeekly: null,
   leaderboardWeeklyTs: 0,
};
export const apiCache = {
   invalidateProfile: () => {
      cache.profile = null;
      cache.profileTs = 0;
   },
   invalidateCurriculums: () => {
      cache.curriculums = null;
      cache.curriculumsTs = 0;
      Object.keys(cache.curriculumLessons || {}).forEach((k) => delete cache.curriculumLessons[k]);
   },
   invalidateLesson: (id) => {
      if (id != null) delete cache.lessons[String(id)];
   },
   invalidateAll: () => {
      cache.profile = null;
      cache.profileTs = 0;
      cache.curriculums = null;
      cache.curriculumsTs = 0;
      cache.leaderboardWeekly = null;
      cache.leaderboardWeeklyTs = 0;
      Object.keys(cache.lessons).forEach((k) => delete cache.lessons[k]);
      Object.keys(cache.curriculumLessons || {}).forEach((k) => delete cache.curriculumLessons[k]);
   },
};

const inFlight = Object.create(null);

const getProfileFresh = async () => {
   const response = await apiClient.get("/profile");
   return response.data;
};

export const userAPI = {
   getProfile: async (bypassCache = false) => {
      if (!bypassCache && cache.profile != null && Date.now() - cache.profileTs < CACHE_TTL) {
         return cache.profile;
      }
      const key = "profile";
      if (!inFlight[key]) {
         inFlight[key] = getProfileFresh()
            .then((data) => {
               cache.profile = data;
               cache.profileTs = Date.now();
               return data;
            })
            .finally(() => {
               delete inFlight[key];
            });
      }
      return inFlight[key];
   },
};
// Authentication APIs (paths aligned with backend /api/auth/*)
export const authAPI = {
   register: async (userData) => {
      const response = await apiClient.post(AUTH_PATHS.REGISTER, {
         email: userData.email,
         password: userData.password,
         name: userData.username || userData.name,
      });
      return response.data;
   },

   login: async (credentials) => {
      const response = await apiClient.post(AUTH_PATHS.LOGIN, {
         email: credentials.email,
         password: credentials.password,
      });
      // Backend returns { user } and sets accessToken + refreshToken httpOnly cookies
      return response.data;
   },

   logout: async () => {
      try {
         await apiClient.post(AUTH_PATHS.LOGOUT);
      } catch (e) {
         console.warn("Failed to call logout API", e);
      } finally {
         apiCache.invalidateAll();
      }
   },

   verifyToken: async () => {
      // Backend /auth/verify expects Bearer header; for cookie-based auth use userAPI.getProfile()
      const response = await apiClient.get(AUTH_PATHS.VERIFY);
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

// Profile APIs (get uses same cache as userAPI.getProfile)
export const profileAPI = {
   get: async (bypassCache = false) => {
      if (!bypassCache && cache.profile != null && Date.now() - cache.profileTs < CACHE_TTL) {
         return cache.profile;
      }
      const data = await getProfileFresh();
      cache.profile = data;
      cache.profileTs = Date.now();
      return data;
   },

   update: async (profileData) => {
      const response = await apiClient.post("/profile", profileData);
      apiCache.invalidateProfile();
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
      // Token is automatically sent via cookie (withCredentials: true)
      const response = await apiClient.post("/practice/score", formData);
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

const CONTENT_PATHS = {
   CURRICULUMS: "/content/curriculums",
   CURRICULUMS_SUMMARY: "/content/curriculums/summary",
   CURRICULUM_BY_ID: (id) => `/content/curriculums/${id}`,
   CURRICULUM_LESSONS: (id) => `/content/curriculums/${id}/lessons`,
   LESSON_BY_ID: (id) => `/content/lessons/${id}`,
   LESSONS_BATCH: "/content/lessons/batch",
   VOCABULARY_SEARCH: "/content/vocabulary/search",
};

// Content APIs (for curriculum and lessons) with cache to reduce duplicate calls
export const contentAPI = {
   getCurriculums: async (bypassCache = false) => {
      if (!bypassCache && cache.curriculums != null && Date.now() - cache.curriculumsTs < CACHE_TTL) {
         return cache.curriculums;
      }
      const key = "curriculums";
      if (!inFlight[key]) {
         inFlight[key] = apiClient.get(CONTENT_PATHS.CURRICULUMS)
            .then((res) => {
               cache.curriculums = res.data;
               cache.curriculumsTs = Date.now();
               return res.data;
            })
            .finally(() => { delete inFlight[key]; });
      }
      return inFlight[key];
   },

   /** Curriculums with lessonCount (one API call for list page). */
   getCurriculumsSummary: async (bypassCache = false) => {
      if (!bypassCache && cache.curriculums != null && Date.now() - cache.curriculumsTs < CACHE_TTL) {
         return cache.curriculums;
      }
      const key = "curriculumsSummary";
      if (!inFlight[key]) {
         inFlight[key] = apiClient.get(CONTENT_PATHS.CURRICULUMS_SUMMARY)
            .then((res) => {
               cache.curriculums = res.data;
               cache.curriculumsTs = Date.now();
               return res.data;
            })
            .finally(() => { delete inFlight[key]; });
      }
      return inFlight[key];
   },

   getCurriculumById: async (id) => {
      const response = await apiClient.get(CONTENT_PATHS.CURRICULUM_BY_ID(id));
      return response.data;
   },

   getCurriculumLessons: async (curriculumId, bypassCache = false) => {
      if (curriculumId == null) return [];
      const key = String(curriculumId);
      const entry = cache.curriculumLessons[key];
      if (!bypassCache && entry && Date.now() - entry.ts < CACHE_TTL) {
         return entry.data;
      }
      const flightKey = `curriculumLessons:${key}`;
      if (!inFlight[flightKey]) {
         inFlight[flightKey] = apiClient.get(CONTENT_PATHS.CURRICULUM_LESSONS(curriculumId))
            .then((res) => {
               cache.curriculumLessons[key] = { data: res.data, ts: Date.now() };
               return res.data;
            })
            .finally(() => { delete inFlight[flightKey]; });
      }
      return inFlight[flightKey];
   },

   getLessonDetail: async (lessonId, bypassCache = false) => {
      if (lessonId == null || lessonId === "") {
         throw new Error("getLessonDetail requires a valid lessonId");
      }
      const key = String(lessonId);
      const entry = cache.lessons[key];
      if (!bypassCache && entry && Date.now() - entry.ts < CACHE_TTL) {
         return entry.data;
      }
      const response = await apiClient.get(CONTENT_PATHS.LESSON_BY_ID(lessonId));
      cache.lessons[key] = { data: response.data, ts: Date.now() };
      return response.data;
   },

   /**
    * Search vocabulary (word, pinyin, meaning, example). BE requires q length >= 2.
    * Returns { content, totalElements, totalPages, number, size }.
    */
   searchVocabulary: async (q, page = 0, size = 24) => {
      const response = await apiClient.get(CONTENT_PATHS.VOCABULARY_SEARCH, {
         params: { q: q || "", page, size },
      });
      const data = response.data || {};
      return {
         content: data.content || [],
         totalElements: data.totalElements ?? 0,
         totalPages: data.totalPages ?? 0,
         number: data.number ?? page,
         size: data.size ?? size,
      };
   },

   /** Paginated batch from BE: GET /content/lessons/batch?page=0&size=24 */
   getLessonDetailsBatchPaginated: async (page = 0, size = 24) => {
      const response = await apiClient.get(CONTENT_PATHS.LESSONS_BATCH, {
         params: { page, size },
      });
      const data = response.data || {};
      const list = data.content || [];
      list.forEach((detail) => {
         if (detail && detail.id != null) {
            const key = String(detail.id);
            cache.lessons[key] = { data: detail, ts: Date.now() };
         }
      });
      return {
         content: list,
         totalElements: data.totalElements ?? list.length,
         totalPages: data.totalPages ?? 1,
         number: data.number ?? page,
         size: data.size ?? size,
      };
   },

   /** Legacy: batch by ids (BE supports ids param for backward compatibility). */
   getLessonDetailsBatch: async (ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
      const response = await apiClient.get(`${CONTENT_PATHS.LESSONS_BATCH}?${query}`);
      const data = response.data || {};
      const list = Array.isArray(data) ? data : (data.content || []);
      list.forEach((detail) => {
         if (detail && detail.id != null) {
            const key = String(detail.id);
            cache.lessons[key] = { data: detail, ts: Date.now() };
         }
      });
      return list;
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
      questionId,
      includeInDaily,
      sessionDate,
      durationSeconds,
      numSentences,
   }) => {
      try {
         const formData = new FormData();
         // required parts
         formData.append("text", text ?? "");

         // Ensure the audio part includes a filename (some mobile browsers/webviews omit it for plain Blob)
         try {
            let audioPart = audioFile;
            if (typeof File !== "undefined" && audioFile instanceof Blob && !(audioFile instanceof File)) {
               audioPart = new File([audioFile], "recording.webm", { type: audioFile.type || "audio/webm" });
            }
            formData.append("audio", audioPart);
         } catch (e) {
            // fallback: append as-is
            formData.append("audio", audioFile);
         }

         // append simple string parts for compatibility across mobile WebViews
         formData.append("sub", String(sub ?? ""));
         formData.append("ent", String(ent ?? ""));

         // optional parts - append as plain strings for better compatibility on mobile
         if (scoreCategory != null) formData.append("scoreCategory", String(scoreCategory));
         if (lessonId != null) formData.append("lessonId", String(lessonId));
         if (lineId != null) formData.append("lineId", String(lineId));
         if (vocabularyId != null) formData.append("vocabularyId", String(vocabularyId));
         if (source != null) formData.append("source", String(source));
         if (testId != null) formData.append("testId", String(testId));
         if (questionId != null) formData.append("questionId", String(questionId));
         if (includeInDaily != null) formData.append("includeInDaily", String(includeInDaily));
         if (sessionDate != null) formData.append("sessionDate", String(sessionDate));
         if (durationSeconds != null) formData.append("durationSeconds", String(durationSeconds));
         if (numSentences != null) formData.append("numSentences", String(numSentences));

         // Debug: list FormData entries (helps verify the file object and parts the browser will send)
         try {
            for (const entry of formData.entries()) {
               const [k, v] = entry;
               if (v instanceof File) {
                  // console.debug("[iseAPI] formData entry:", k, "File", v.name, v.type, v.size);
               } else if (v instanceof Blob) {
                  // console.debug("[iseAPI] formData entry:", k, "Blob", v.type);
               } else {
                  // console.debug("[iseAPI] formData entry:", k, typeof v, v);
               }
            }
         } catch (e) {
            // console.debug("[iseAPI] formData debug failed", e);
         }

         // Do not set Content-Type so the browser can add the multipart boundary automatically.
         // Token is automatically sent via cookie (withCredentials: true)
         const response = await apiClient.post("/ise/score", formData);

         return response.data;
      } catch (error) {
         // Handle 422 responses from backend which indicate ISE rejected the
         // recording and request a re-pronunciation. Normalize into a return
         // object so callers can show a retry UI instead of a generic error.
         if (error.response && error.response.status === 422 && error.response.data) {
            return {
               require_retry: Boolean(error.response.data.require_retry),
               error: error.response.data.error || null,
               message: error.response.data.message || null,
               detail: error.response.data,
            };
         }

         throw new Error(
            error.response?.data?.message ||
            error.message ||
            "Không thể đánh giá phát âm. Vui lòng kiểm tra kết nối mạng và thử lại."
         );
      }
   },

   // NEW: scoreWord for vocabulary using the new IseWordController
   scoreWord: async ({ text, audioFile, testId, questionId, scoreCategory }) => {
      try {
         const formData = new FormData();
         formData.append("text", text);

         // Ensure audioFile has proper name and type
         const audioFileWithName = new File([audioFile], "recording.webm", {
            type: audioFile.type || "audio/webm",
         });
         formData.append("audio", audioFileWithName);
         // assessment mode: only attach testId
         if (testId != null) {
            formData.append("testId", String(testId));
         }
         if (questionId != null) {
            formData.append("questionId", String(questionId));
         }
         // optional: attach scoreCategory for backend categorization (e.g., thanh-mau/van-mau/...)
         if (scoreCategory != null) {
            formData.append("scoreCategory", String(scoreCategory));
         }

         // console.log("Sending to ISE Word API:", {
         //    text: text,
         //    audioFileName: audioFileWithName.name,
         //    audioSize: audioFileWithName.size,
         //    audioType: audioFileWithName.type,
         //    endpoint: "/ise/score",
         // });

         // Debug: list FormData entries (helps verify the file object and parts the browser will send)
         try {
            for (const entry of formData.entries()) {
               const [k, v] = entry;
               if (v instanceof File) {
                  // console.debug(
                  //       "[iseAPI.scoreWord] formData entry:",
                  //       k,
                  //       "File",
                  //       v.name,
                  //       v.type,
                  //       v.size
                  //    );
               } else if (v instanceof Blob) {
                  // console.debug(
                  //    "[iseAPI.scoreWord] formData entry:",
                  //    k,
                  //    "Blob",
                  //    v.type
                  // );
               } else {
                  // console.debug(
                  //    "[iseAPI.scoreWord] formData entry:",
                  //    k,
                  //    typeof v,
                  //    v
                  // );
               }
            }
         } catch (e) {
            // console.debug("[iseAPI.scoreWord] formData debug failed", e);
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
               // console.warn(
               //    "Failed to parse ISE Word response as JSON:",
               //    parseError
               // );
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
               db_scores: result.db_scores ?? null,
            };
            return normalized;
         }

         // Fallback: return as-is if structure unknown
         return { raw_response: result };
      } catch (error) {
         // If backend returned 422 / require_retry, normalize the response so
         // callers can present a retry prompt.
         if (error.response && error.response.status === 422 && error.response.data) {
            return {
               require_retry: Boolean(error.response.data.require_retry),
               error: error.response.data.error || null,
               message: error.response.data.message || null,
               detail: error.response.data,
            };
         }

         // console.error("ISE Word API Error:", error);

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

// In-flight dedupe for GET /ise/stats/weekly (no params). Assign before any await so a second caller always sees the same promise.
let _iseStatsWeeklyInFlight = null;

// ISE stats for frontend displays (daily/lesson/test summaries)
export const iseStatsAPI = {
   // Weekly performance: replaced daily with weekly. Keep getDaily as a compatibility alias.
   getWeekly: async (fromIsoDate, toIsoDate) => {
      const params = {};
      if (fromIsoDate) params.from = fromIsoDate;
      if (toIsoDate) params.to = toIsoDate;
      const noParams = !fromIsoDate && !toIsoDate;
      if (noParams && _iseStatsWeeklyInFlight) {
         return _iseStatsWeeklyInFlight;
      }
      if (noParams) {
         const p = new Promise((resolve, reject) => {
            _iseStatsWeeklyInFlight = p;
            apiClient.get("/ise/stats/weekly", { params })
               .then((r) => resolve(r.data))
               .catch(reject);
         });
         p.finally(() => { _iseStatsWeeklyInFlight = null; });
         return p;
      }
      const response = await apiClient.get("/ise/stats/weekly", { params });
      return response.data;
   },
   getDaily: async (fromIsoDate, toIsoDate) => {
      // Call the dedicated daily endpoint which returns per-day aggregates
      const params = {};
      if (fromIsoDate) params.from = fromIsoDate;
      if (toIsoDate) params.to = toIsoDate;
      const response = await apiClient.get('/ise/stats/daily', { params });
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
   /** Batch: GET /ise/stats/pronounced-batch?lessonIds=1,2,3 → { "1": { ... }, "2": { ... } } */
   getPronouncedForLessonsBatch: async (lessonIds) => {
      if (!Array.isArray(lessonIds) || lessonIds.length === 0) return {};
      const param = lessonIds.map((id) => String(id)).join(",");
      const response = await apiClient.get("/ise/stats/pronounced-batch", {
         params: { lessonIds: param },
      });
      return response.data || {};
   },
   getDistinctVocabForUser: async () => {
      const response = await apiClient.get('/ise/stats/distinct-vocab');
      return response.data;
   },
   getLeaderboardWeekly: async (bypassCache = false) => {
      if (!bypassCache && cache.leaderboardWeekly != null && Date.now() - cache.leaderboardWeeklyTs < CACHE_TTL) {
         return cache.leaderboardWeekly;
      }
      const response = await apiClient.get('/ise/stats/leaderboard/weekly');
      cache.leaderboardWeekly = response.data;
      cache.leaderboardWeeklyTs = Date.now();
      return response.data;
   },
   getLeaderboardDaily: async () => {
      return iseStatsAPI.getLeaderboardWeekly();
   },
   getLeaderboardByLesson: async (lessonId) => {
      const params = {};
      if (lessonId != null) params.lessonId = lessonId;
      const response = await apiClient.get('/ise/stats/leaderboard/lesson', { params });
      return response.data;
   },
};

// Admin-only stats APIs
export const adminStatsAPI = {
   getWeeklyLeaderboards: async (startDate, endDate) => {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await apiClient.get('/admin/leaderboard/weekly', { params });
      return response.data;
   },
   getLessonLeaderboards: async () => {
      const response = await apiClient.get('/admin/leaderboard/lessons');
      return response.data;
   },
   getTestLeaderboards: async () => {
      const response = await apiClient.get('/admin/leaderboard/tests');
      return response.data;
   }, getExamLeaderboards: async () => {
      const response = await apiClient.get("/admin/leaderboard/exams")
      return response.data
   }, getUsers: async () => {
      const response = await apiClient.get('/admin/users');
      return response.data;
   },
};

// Admin User Management APIs
export const adminUserAPI = {
   // Get list of all users
   listUsers: async () => {
      const response = await apiClient.get('/admin/users');
      return response.data;
   },

   // Create new user
   createUser: async (userData) => {
      const response = await apiClient.post('/admin/users', {
         email: userData.email,
         password: userData.password,
         name: userData.name,
         role: userData.role,
      });
      return response.data;
   },

   // Update user information
   updateUser: async (userId, userData) => {
      const response = await apiClient.put(`/admin/users/${userId}`, {
         email: userData.email,
         name: userData.name,
         role: userData.role,
      });
      return response.data;
   },

   // Update user role only
   updateUserRole: async (userId, role) => {
      const response = await apiClient.patch(`/admin/users/${userId}/role`, {
         role: role,
      });
      return response.data;
   },

   // Delete user
   deleteUser: async (userId) => {
      const response = await apiClient.delete(`/admin/users/${userId}`);
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
         null,
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
   /** Batch: GET /user-lessons/completion?lessonIds=1,2,3 → { "1": { completed, ... }, "2": { ... } } */
   getCompletionBatch: async (lessonIds) => {
      if (!Array.isArray(lessonIds) || lessonIds.length === 0) return {};
      const param = lessonIds.map((id) => String(id)).join(",");
      const response = await apiClient.get("/user-lessons/completion", {
         params: { lessonIds: param },
      });
      return response.data || {};
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

// Assessment Test APIs (New)
export const assessmentAPI = {
   // Get assessment by ID with test data
   // API: GET /assessments/{assessmentId}
   // Returns: { id, title, description, lessonId, curriculumId, testData: {...} }
   getAssessmentById: async (assessmentId) => {
      const response = await apiClient.get(`/assessments/${assessmentId}`);
      return response.data;
   },

   // Get test data for a lesson divided into 4 sections (deprecated - use getAssessmentById)
   getTestData: async (lessonId) => {
      try {
         const response = await apiClient.get(`/assessments/test-data/${lessonId}`);
         return response.data;
      } catch (error) {
         // Fallback to null so frontend can use lesson data
         console.warn("Could not fetch assessment test data:", error);
         return null;
      }
   },

   // Start assessment - clear old data
   // API: POST /assessments/{assessmentId}/start
   startAssessment: async (assessmentId) => {
      const response = await apiClient.post(`/assessments/${assessmentId}/start`);
      return response.data;
   },

   // Submit assessment test results
   // API: POST /assessments/{assessmentId}/submit
   submitTest: async (assessmentId, payload) => {
      const response = await apiClient.post(`/assessments/${assessmentId}/submit`, payload);
      return response.data;
   },

   // Get assessment history for a lesson
   getAssessmentsByLesson: async (lessonId) => {
      const response = await apiClient.get(`/assessments/lesson/${lessonId}`);
      return response.data;
   },

   // Get overall assessment statistics
   getAssessmentStats: async () => {
      const response = await apiClient.get("/assessments/stats");
      return response.data;
   },

   // Get all assessments list
   getAllAssessments: async () => {
      const response = await apiClient.get("/assessments");
      return response.data;
   },

   // Get assessment results
   getAssessmentResults: async (assessmentId) => {
      const response = await apiClient.get(`/assessments/${assessmentId}/results`);
      return response.data;
   },

   // Submit final assessment results
   submitFinalResults: async (assessmentId, payload) => {
      const response = await apiClient.post(`/assessments/${assessmentId}/submit`, payload);
      return response.data;
   },
};

// Add method to iseAPI for assessment test data fetching (if using existing API)
iseAPI.getAssessmentTestData = async (lessonId) => {
   return assessmentAPI.getTestData(lessonId);
};

// Add method to iseAPI for submitting assessment
iseAPI.submitAssessmentTest = async (payload) => {
   return assessmentAPI.submitTest(payload);
};

// Class Management APIs (Admin only)
export const classAPI = {
   // Get all classes
   getAll: async () => {
      const response = await apiClient.get("/admin/classes");
      return response.data;
   },

   // Get a single class by ID
   getById: async (id) => {
      const response = await apiClient.get(`/admin/classes/${id}`);
      return response.data;
   },

   // Search classes by name
   search: async (name) => {
      const response = await apiClient.get("/admin/classes/search", {
         params: { name }
      });
      return response.data;
   },

   // Create a new class
   create: async (classData) => {
      const response = await apiClient.post("/admin/classes", {
         name: classData.name,
         description: classData.description
      });
      return response.data;
   },

   // Update an existing class
   update: async (id, classData) => {
      const response = await apiClient.put(`/admin/classes/${id}`, {
         name: classData.name,
         description: classData.description
      });
      return response.data;
   },

   // Delete a class
   delete: async (id) => {
      const response = await apiClient.delete(`/admin/classes/${id}`);
      return response.data;
   },

   // Get all members of a class
   getMembers: async (classId) => {
      const response = await apiClient.get(`/admin/classes/${classId}/members`);
      return response.data;
   },

   // Add a single member to a class
   addMember: async (classId, userId) => {
      const response = await apiClient.post(`/admin/classes/${classId}/members`, {
         userId
      });
      return response.data;
   },

   // Add multiple members to a class
   addMultipleMembers: async (classId, userIds) => {
      const response = await apiClient.post(`/admin/classes/${classId}/members/bulk`, {
         userIds
      });
      return response.data;
   },

   // Remove a member from a class
   removeMember: async (classId, userId) => {
      const response = await apiClient.delete(`/admin/classes/${classId}/members/${userId}`);
      return response.data;
   }
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
