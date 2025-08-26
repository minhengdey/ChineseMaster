// Authentication handling
document.addEventListener("DOMContentLoaded", () => {
  // Declare variables
  // Sử dụng các hàm từ api.js, không cấu hình lại API_BASE_URL
  const API_BASE_URL = "http://localhost:8080/api"
  const isAuthenticated = () => localStorage.getItem("accessToken") !== null
  const setAuthToken = (token) => localStorage.setItem("accessToken", token)
  const showError = (message) => {
    const el = document.getElementById("error-message")
    if (el) {
      el.textContent = message
      el.style.display = "block"
      setTimeout(() => { el.style.display = "none" }, 5000)
    } else {
      alert(message)
    }
  }
  const showSuccess = (message) => {
    const el = document.getElementById("success-message")
    if (el) {
      el.textContent = message
      el.style.display = "block"
      setTimeout(() => { el.style.display = "none" }, 3000)
    } else {
      alert(message)
    }
  }
  // Đăng ký tài khoản
  const registerUser = async (email, password, name) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    })
    if (res.status === 201) {
      return await res.json()
    } else {
      let err = "Registration failed"
      try {
        const data = await res.json()
        err = data.error || err
      } catch { }
      throw new Error(err)
    }
  }
  // Đăng nhập
  const loginUser = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    if (res.ok) {
      return await res.json()
    } else {
      let err = "Login failed"
      try {
        const data = await res.json()
        err = data.error || err
      } catch { }
      throw new Error(err)
    }
  }

  // // Check if already authenticated
  // if (isAuthenticated()) {
  //   window.location.href = "lessons.html"
  //   return
  // }

  // Tab switching
  const tabBtns = document.querySelectorAll(".tab-btn")
  const authForms = document.querySelectorAll(".auth-form")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const targetTab = this.dataset.tab

      // Update active tab
      tabBtns.forEach((b) => b.classList.remove("active"))
      this.classList.add("active")

      // Show corresponding form
      authForms.forEach((form) => {
        form.classList.remove("active")
        if (form.id === `${targetTab}-form`) {
          form.classList.add("active")
        }
      })
    })
  })

  // Login form
  const loginForm = document.getElementById("login-form")
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value

    try {
      const response = await loginUser(email, password)
      setAuthToken(response.accessToken)
      window.location.href = "lessons.html"
    } catch (error) {
      showError(error.message)
    }
  })

  // Register form
  const registerForm = document.getElementById("register-form")
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("register-name").value
    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value

    try {
      await registerUser(email, password, name)
      showSuccess("Registration successful! Please login.")

      // Switch to login tab
      document.querySelector('[data-tab="login"]').click()

      // Clear register form
      registerForm.reset()
    } catch (error) {
      showError(error.message)
    }
  })
})
