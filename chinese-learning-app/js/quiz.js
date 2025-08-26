// Quiz functionality
document.addEventListener("DOMContentLoaded", () => {
  // getLessons, submitQuiz, showError đã có từ api.js

  const quizForm = document.getElementById("quiz-form")
  const lessonSelect = document.getElementById("quiz-lesson-select")
  const startQuizBtn = document.getElementById("start-quiz-btn")
  const submitQuizBtn = document.getElementById("submit-quiz-btn")
  const quizQuestions = document.getElementById("quiz-questions")
  const quizResult = document.getElementById("quiz-result")
  const retakeQuizBtn = document.getElementById("retake-quiz-btn")

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

  // Start quiz
  startQuizBtn.addEventListener("click", () => {
    const selectedLesson = lessonSelect.value
    if (!selectedLesson) {
      showError("Please select a lesson first")
      return
    }

    // Show quiz questions
    quizQuestions.style.display = "block"
    startQuizBtn.style.display = "none"
    submitQuizBtn.style.display = "inline-block"
    quizResult.style.display = "none"
  })

  // Submit quiz
  quizForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const selectedLesson = lessonSelect.value
    const formData = new FormData(quizForm)

    // Collect answers
    const answers = []

    // For demo purposes, we'll use the sample questions
    // In a real app, questions would be loaded dynamically
    const q1Answer = formData.get("q1")
    const q2Answer = formData.get("q2")

    if (q1Answer) answers.push({ questionId: 1, answer: q1Answer })
    if (q2Answer) answers.push({ questionId: 2, answer: q2Answer })

    if (answers.length === 0) {
      showError("Please answer at least one question")
      return
    }

    try {
      const result = await submitQuiz(Number.parseInt(selectedLesson), answers)
      displayQuizResult(result)
    } catch (error) {
      showError(error.message)
    }
  })

  // Display quiz result
  function displayQuizResult(result) {
    document.getElementById("quiz-score").textContent = result.score
    document.getElementById("quiz-total").textContent = result.total

    // Display corrections
    const correctionsList = document.getElementById("corrections-list")
    correctionsList.innerHTML = ""

    if (result.corrections) {
      result.corrections.forEach((correction) => {
        const correctionElement = document.createElement("div")
        correctionElement.className = `correction-item ${correction.correct ? "correct" : "incorrect"}`
        correctionElement.innerHTML = `
                    <h4>Question ${correction.questionId}</h4>
                    <p><strong>Your answer:</strong> ${correction.yourAnswer}</p>
                    <p><strong>Correct answer:</strong> ${correction.correctAnswer}</p>
                    <p><strong>Result:</strong> ${correction.correct ? "✅ Correct" : "❌ Incorrect"}</p>
                `
        correctionsList.appendChild(correctionElement)
      })
    }

    // Hide quiz form and show result
    quizQuestions.style.display = "none"
    submitQuizBtn.style.display = "none"
    quizResult.style.display = "block"
  }

  // Retake quiz
  retakeQuizBtn.addEventListener("click", () => {
    // Reset form
    quizForm.reset()

    // Reset UI state
    quizQuestions.style.display = "none"
    startQuizBtn.style.display = "inline-block"
    submitQuizBtn.style.display = "none"
    quizResult.style.display = "none"
  })

  // Load lessons on page load
  loadLessons()
})
