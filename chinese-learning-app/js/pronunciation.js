// Pronunciation practice functionality
document.addEventListener("DOMContentLoaded", () => {
  // Declare required variables
  // requireAuth, getLessons, scorePronunciation, showError đã có từ api.js
  if (!requireAuth()) return

  const pronunciationForm = document.getElementById("pronunciation-form")
  const lessonSelect = document.getElementById("lesson-select")
  const audioFileInput = document.getElementById("audio-file")
  const uploadText = document.getElementById("upload-text")
  const uploadLoading = document.getElementById("upload-loading")
  const pronunciationResult = document.getElementById("pronunciation-result")

  // Load lessons for selection
  async function loadLessons() {
    try {
      const lessons = await getLessons()
      lessons.forEach((lesson) => {
        const option = document.createElement("option")
        option.value = lesson.id
        option.textContent = lesson.title
        lessonSelect.appendChild(option)
      })
      // Pre-select lesson if provided in URL
      const urlParams = new URLSearchParams(window.location.search)
      const lessonId = urlParams.get("lessonId")
      if (lessonId) {
        lessonSelect.value = lessonId
      }
    } catch (error) {
      showError(error.message)
    }
  }

  // Handle form submission
  pronunciationForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const audioFile = audioFileInput.files[0]
    if (!audioFile) {
      showError("Please select an audio file")
      return
    }

    // Show loading state
    uploadText.style.display = "none"
    uploadLoading.style.display = "inline-block"
    pronunciationResult.style.display = "none"

    try {
      const lessonId = lessonSelect.value
      const response = await scorePronunciation(audioFile, lessonId)
      displayPronunciationResult(response)
    } catch (error) {
      showError(error.message)
    } finally {
      // Reset loading state
      uploadText.style.display = "inline-block"
      uploadLoading.style.display = "none"
    }
  })

  // Display pronunciation result
  function displayPronunciationResult(result) {
    // Update score
    document.getElementById("score-value").textContent = result.score
    document.getElementById("feedback-text").textContent = result.feedback

    // Update syllables
    const syllablesList = document.getElementById("syllables-list")
    syllablesList.innerHTML = ""

    if (result.syllables) {
      result.syllables.forEach((syllable) => {
        const syllableElement = document.createElement("div")
        syllableElement.className = `syllable ${syllable.matched ? "matched" : "unmatched"}`
        syllableElement.innerHTML = `
                    <strong>${syllable.text}</strong><br>
                    <small>Expected: ${syllable.expected}</small><br>
                    <small>Confidence: ${Math.round(syllable.confidence * 100)}%</small>
                `
        syllablesList.appendChild(syllableElement)
      })
    }

    // Update audio playback
    if (result.audioUrl) {
      const resultAudio = document.getElementById("result-audio")
      resultAudio.src = result.audioUrl
    }

    pronunciationResult.style.display = "block"
  }

  // Load lessons on page load
  loadLessons()
})
