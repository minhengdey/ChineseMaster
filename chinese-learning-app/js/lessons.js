// Lessons page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Declare requireAuth, getLessons, and showError functions
  // Dùng các hàm từ api.js
  // getLessons, showError đã được import qua script tag

  const lessonsGrid = document.getElementById("lessons-grid")
  const levelSelect = document.getElementById("level-select")
  const loading = document.getElementById("loading")

  // Load lessons
  async function loadLessons(level = "") {
    try {
      loading.style.display = "block"
      lessonsGrid.innerHTML = ""

      const lessons = await getLessons(level || null)

      if (lessons.length === 0) {
        lessonsGrid.innerHTML = '<p class="no-lessons">No lessons found for this level.</p>'
      } else {
        lessons.forEach((lesson) => {
          const lessonCard = createLessonCard(lesson)
          lessonsGrid.appendChild(lessonCard)
        })
      }
    } catch (error) {
      showError(error.message)
    } finally {
      loading.style.display = "none"
    }
  }

  // Create lesson card element
  function createLessonCard(lesson) {
    const card = document.createElement("div")
    card.className = "lesson-card"
    card.innerHTML = `
            <h3>${lesson.title}</h3>
            <span class="level-badge">${lesson.level}</span>
        `

    card.addEventListener("click", () => {
      window.location.href = `lesson-detail.html?id=${lesson.id}`
    })

    return card
  }

  // Level filter
  levelSelect.addEventListener("change", function () {
    loadLessons(this.value)
  })

  // Initial load
  loadLessons()
})
