// API configuration and utilities
const API_BASE_URL = "http://localhost:8080/api"

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem("accessToken")
}

// Set auth token in localStorage
function setAuthToken(token) {
  localStorage.setItem("accessToken", token)
}

// Remove auth token from localStorage
function removeAuthToken() {
  localStorage.removeItem("accessToken")
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getAuthToken()
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "index.html"
    return false
  }
  return true
}

// Make API request with automatic token handling
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  // Add auth token if available and not login/register
  if (token && !endpoint.includes("/auth/")) {
    config.headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, config)

    // Handle different response types
    if (response.status === 401) {
      removeAuthToken()
      window.location.href = "index.html"
      throw new Error("Unauthorized")
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }

    return response
  } catch (error) {
    console.error("API Request failed:", error)
    throw error
  }
}

// Authentication API
async function registerUser(email, password, name) {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  })
  return response // Returns userId (number)
}

async function loginUser(email, password) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  return response // Returns { accessToken, refreshToken, expiresIn }
}

// Lessons API
async function getLessons(level = null) {
  const endpoint = level ? `/lessons?level=${level}` : "/lessons"
  return await apiRequest(endpoint)
}

async function getLessonDetail(id) {
  return await apiRequest(`/lessons/${id}`)
}

// Audio API
function getAudioUrl(filename) {
  return `${API_BASE_URL}/audio/${filename}`
}

// Flashcards API (requires auth)
async function getFlashcards() {
  return await apiRequest("/flashcards")
}

async function createFlashcard(hanzi, pinyin, meaning) {
  return await apiRequest("/flashcards", {
    method: "POST",
    body: JSON.stringify({ hanzi, pinyin, meaning }),
  })
}

async function getFlashcard(id) {
  return await apiRequest(`/flashcards/${id}`)
}

async function reviewFlashcard(id, result) {
  return await apiRequest(`/flashcards/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ result }), // "again" | "good" | "easy"
  })
}

// Profile API (requires auth)
async function getProfile() {
  return await apiRequest("/profile")
}

async function updateProfile(profileData) {
  return await apiRequest("/profile", {
    method: "POST",
    body: JSON.stringify(profileData),
  })
}

// Pronunciation API (requires auth)
async function scorePronunciation(audioFile, lessonId = null) {
  const formData = new FormData()
  formData.append("file", audioFile)
  if (lessonId) {
    formData.append("lessonId", lessonId)
  }

  return await apiRequest("/practice/score", {
    method: "POST",
    headers: {}, // Remove Content-Type to let browser set it for FormData
    body: formData,
  })
}

// Quiz API
async function submitQuiz(lessonId, answers) {
  return await apiRequest("/quiz/submit", {
    method: "POST",
    body: JSON.stringify({ lessonId, answers }),
  })
}

// Show error message
function showError(message, elementId = "error-message") {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.display = "block"
    setTimeout(() => {
      errorElement.style.display = "none"
    }, 5000)
  }
}

// Show success message
function showSuccess(message, elementId = "success-message") {
  const successElement = document.getElementById(elementId)
  if (successElement) {
    successElement.textContent = message
    successElement.style.display = "block"
    setTimeout(() => {
      successElement.style.display = "none"
    }, 3000)
  }
}

// Add logout functionality to all pages
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      removeAuthToken()
      window.location.href = "index.html"
    })
  }
})
