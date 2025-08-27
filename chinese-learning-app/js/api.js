// API configuration and utilities (ES module)
export const API_BASE_URL = "http://localhost:8080/api";

// Get auth token from localStorage
export function getAuthToken() {
    return localStorage.getItem("accessToken");
}

// Set auth token in localStorage
export function setAuthToken(token) {
    localStorage.setItem("accessToken", token);
}

// Remove auth token from localStorage
export function removeAuthToken() {
    localStorage.removeItem("accessToken");
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!getAuthToken();
}

// Redirect to login if not authenticated
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = "index.html";
        return false;
    }
    return true;
}

// Make API request with automatic token handling
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    // clone options to avoid mutation
    const opts = { ...options };

    // Default headers
    opts.headers = {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
    };

    // If body is FormData, remove Content-Type so browser sets multipart boundary
    if (opts.body instanceof FormData) {
        delete opts.headers["Content-Type"];
    }

    // Add auth token if available and not login/register
    if (token && !endpoint.includes("/auth/")) {
        opts.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, opts);

        // Handle unauthorized
        if (response.status === 401) {
            removeAuthToken();
            window.location.href = "index.html";
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Handle JSON responses
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }

        return response;
    } catch (error) {
        console.error("API Request failed:", error);
        throw error;
    }
}

// Authentication API
export async function registerUser(email, password, name) {
    return await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
    });
}

export async function loginUser(email, password) {
    return await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

// Lessons API
export async function getLessons(level = null) {
    const endpoint = level ? `/lessons?level=${level}` : "/lessons";
    return await apiRequest(endpoint);
}

export async function getLessonDetail(id) {
    return await apiRequest(`/lessons/${id}`);
}

// Audio API
export function getAudioUrl(filename) {
    return `${API_BASE_URL}/audio/${filename}`;
}

// Flashcards API (requires auth)
export async function getFlashcards() {
    return await apiRequest("/flashcards");
}

export async function createFlashcard(hanzi, pinyin, meaning) {
    return await apiRequest("/flashcards", {
        method: "POST",
        body: JSON.stringify({ hanzi, pinyin, meaning }),
    });
}

export async function getFlashcard(id) {
    return await apiRequest(`/flashcards/${id}`);
}

export async function reviewFlashcard(id, result) {
    return await apiRequest(`/flashcards/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ result }), // "again" | "good" | "easy"
    });
}

// Profile API (requires auth)
export async function getProfile() {
    return await apiRequest("/profile");
}

export async function updateProfile(profileData) {
    return await apiRequest("/profile", {
        method: "POST",
        body: JSON.stringify(profileData),
    });
}

// Pronunciation API (requires auth)
export async function scorePronunciation(audioFile, lessonId = null) {
    const formData = new FormData();
    formData.append("file", audioFile);
    if (lessonId) {
        formData.append("lessonId", lessonId);
    }

    return await apiRequest("/practice/score", {
        method: "POST",
        headers: {}, // let apiRequest set/remove Content-Type
        body: formData,
    });
}

// Quiz API
export async function submitQuiz(lessonId, answers) {
    return await apiRequest("/quiz/submit", {
        method: "POST",
        body: JSON.stringify({ lessonId, answers }),
    });
}

// Show error message
export function showError(message, elementId = "error-message") {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        setTimeout(() => {
            errorElement.style.display = "none";
        }, 5000);
    }
}

// Show success message
export function showSuccess(message, elementId = "success-message") {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = "block";
        setTimeout(() => {
            successElement.style.display = "none";
        }, 3000);
    }
}

// initGlobal attaches logout handler (idempotent)
export function initGlobal() {
    if (window.__API_LOGOUT_INIT) return;
    window.__API_LOGOUT_INIT = true;
    document.addEventListener("DOMContentLoaded", () => {
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                removeAuthToken();
                window.location.href = "index.html";
            });
        }
    });
}
