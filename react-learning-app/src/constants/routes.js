/**
 * Application route paths - single source of truth for navigation.
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CURRICULUM: "/curriculum",
  CURRICULUM_LESSONS: (id) => `/curriculum/${id}/lessons`,
  LESSON_DETAIL: (curriculumId, lessonId) => `/curriculum/${curriculumId}/lesson/${lessonId}`,
  LESSON_PRACTICE: (curriculumId, lessonId) => `/curriculum/${curriculumId}/lesson/${lessonId}/practice`,
  LESSON_SPEAKING: (curriculumId, lessonId) => `/curriculum/${curriculumId}/lesson/${lessonId}/speaking`,
  ASSESSMENTS: "/assessments",
  ASSESSMENT_TEST: (id) => `/assessment/${id}`,
  FLASHCARDS: "/flashcards",
  FLASHCARDS_CURRICULUM: (id) => `/flashcards/${id}`,
  FLASHCARD_LESSON: (curriculumId, lessonId) => `/flashcard/${curriculumId}/lesson/${lessonId}`,
  PRONUNCIATION: "/pronunciation",
  ALPHABET: "/alphabet",
  PROFILE: "/profile",
  SPEAKING_DAILY: "/speaking/daily",
  HSKK_EXAM: "/hskk-exam",
  ADMIN: "/admin",
  ADMIN_CLASSES: "/admin/classes",
}
