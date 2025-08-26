// Flashcards page functionality
document.addEventListener("DOMContentLoaded", () => {
  // requireAuth, getFlashcards, reviewFlashcard, showError đã có từ api.js
  if (!requireAuth()) return

  const flashcardContainer = document.getElementById("flashcard-container")
  const flashcard = document.getElementById("flashcard")
  const flipBtn = document.getElementById("flip-btn")
  const cardCounter = document.getElementById("card-counter")
  const noCards = document.getElementById("no-cards")
  const reviewButtons = document.querySelectorAll(".review-buttons .btn")

  let currentCards = []
  let currentCardIndex = 0
  let isFlipped = false

  // Load flashcards
  async function loadFlashcards() {
    try {
      currentCards = await getFlashcards()
      if (currentCards.length === 0) {
        flashcardContainer.style.display = "none"
        noCards.style.display = "block"
      } else {
        flashcardContainer.style.display = "block"
        noCards.style.display = "none"
        currentCardIndex = 0
        showCurrentCard()
      }
    } catch (error) {
      showError(error.message)
    }
  }

  // Show current card
  function showCurrentCard() {
    if (currentCards.length === 0) return

    const card = currentCards[currentCardIndex]

    // Update card content
    document.getElementById("card-hanzi").textContent = card.hanzi
    document.getElementById("card-pinyin").textContent = card.pinyin
    document.getElementById("card-meaning").textContent = card.meaning

    // Update counter
    cardCounter.textContent = `${currentCardIndex + 1} / ${currentCards.length}`

    // Reset flip state
    isFlipped = false
    flashcard.classList.remove("flipped")
    flipBtn.textContent = "Show Answer"
  }

  // Flip card
  flipBtn.addEventListener("click", () => {
    isFlipped = !isFlipped
    flashcard.classList.toggle("flipped")
    flipBtn.textContent = isFlipped ? "Show Question" : "Show Answer"
  })

  // Review buttons
  reviewButtons.forEach((btn) => {
    btn.addEventListener("click", async function () {
      if (!isFlipped) {
        showError("Please flip the card to see the answer first")
        return
      }

      const result = this.dataset.result
      const currentCard = currentCards[currentCardIndex]

      try {
        await reviewFlashcard(currentCard.id, result)
        // Move to next card or finish
        currentCards.splice(currentCardIndex, 1)
        if (currentCards.length === 0) {
          flashcardContainer.style.display = "none"
          noCards.style.display = "block"
        } else {
          if (currentCardIndex >= currentCards.length) {
            currentCardIndex = 0
          }
          showCurrentCard()
        }
      } catch (error) {
        showError(error.message)
      }
    })
  })

  // Load flashcards on page load
  loadFlashcards()
})
