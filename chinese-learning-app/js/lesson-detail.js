// Lesson detail page functionality
import { requireAuth, showError, getLessonDetail, getAudioUrl } from "./api.js"

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return

  const lessonContent = document.getElementById("lesson-content")
  const urlParams = new URLSearchParams(window.location.search)
  const lessonId = urlParams.get("id")

  if (!lessonId) {
    showError("Lesson ID not provided")
    return
  }

  // Load lesson detail
  async function loadLessonDetail() {
    try {
      const lesson = await getLessonDetail(lessonId)
      renderLessonDetail(lesson)
    } catch (error) {
      showError(error.message)
    }
  }

  // Render lesson detail
  function renderLessonDetail(lesson) {
    lessonContent.innerHTML = `
            <div class="lesson-detail">
                <h1>${lesson.title}</h1>
                <span class="level-badge">${lesson.level}</span>
                
                <div class="lesson-content">
                    <p>${lesson.content}</p>
                </div>
                
                ${
                  lesson.audioFiles && lesson.audioFiles.length > 0
                    ? `
                    <div class="audio-section">
                        <h3>🔊 Audio Files</h3>
                        ${lesson.audioFiles
                          .map(
                            (audioFile) => `
                            <div class="audio-item">
                                <p>${audioFile}</p>
                                <audio class="audio-player" controls>
                                    <source src="${getAudioUrl(audioFile)}" type="audio/mpeg">
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                
                <div class="lesson-actions">
                    <a href="quiz.html?lessonId=${lesson.id}" class="btn btn-primary">Take Quiz</a>
                    <a href="pronunciation.html?lessonId=${lesson.id}" class="btn btn-secondary">Practice Pronunciation</a>
                </div>
            </div>
        `
  }

  // Load lesson on page load
  loadLessonDetail()
})
