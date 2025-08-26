// Profile page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Declare required variables
  // requireAuth, getProfile, updateProfile, showError, showSuccess đã có từ api.js
  if (!requireAuth()) return

  const profileForm = document.getElementById("profile-form")
  const userXp = document.getElementById("user-xp")
  const userStreak = document.getElementById("user-streak")
  const badgeCount = document.getElementById("badge-count")
  const badgesList = document.getElementById("badges-list")

  // Load profile data
  async function loadProfile() {
    try {
      const profile = await getProfile()
      // Update stats
      userXp.textContent = profile.xp || 0
      userStreak.textContent = profile.streak || 0
      badgeCount.textContent = profile.badges ? profile.badges.length : 0
      // Update form fields
      console.log(profile)
      document.getElementById("profile-name").value = profile.name || ""
      document.getElementById("profile-email").value = profile.email || ""
      document.getElementById("dark-mode-toggle").checked = profile.darkMode || false
      // Update badges
      displayBadges(profile.badges || [])
    } catch (error) {
      showError(error.message)
    }
  }

  // Display badges
  function displayBadges(badges) {
    badgesList.innerHTML = ""

    if (badges.length === 0) {
      badgesList.innerHTML = "<p>No badges earned yet. Keep learning!</p>"
      return
    }

    badges.forEach((badge) => {
      const badgeElement = document.createElement("div")
      badgeElement.className = "badge"
      badgeElement.textContent = formatBadgeName(badge)
      badgesList.appendChild(badgeElement)
    })
  }

  // Format badge name for display
  function formatBadgeName(badge) {
    return badge
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Handle profile form submission
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("profile-name").value
    const darkMode = document.getElementById("dark-mode-toggle").checked

    try {
      const updatedProfile = await updateProfile({ name, darkMode })
      showSuccess("Profile updated successfully!")
      // Update display with new data
      userXp.textContent = updatedProfile.xp || 0
      userStreak.textContent = updatedProfile.streak || 0
      displayBadges(updatedProfile.badges || [])
    } catch (error) {
      showError(error.message)
    }
  })

  // Load profile on page load
  loadProfile()
})
