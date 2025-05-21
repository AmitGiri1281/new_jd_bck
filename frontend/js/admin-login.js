document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const statusMsg = document.getElementById('loginStatus');
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Input validation
    if (!email || !password) {
      displayStatus("Please fill in all fields", "red");
      return;
    }

    // Disable button and show loading state
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || 'Login failed');

      // Save auth token to localStorage
      localStorage.setItem('authToken', result.token);

      // Success message
      displayStatus("Login successful! Redirecting...", "green");

      // Redirect after delay
      setTimeout(() => {
        window.location.href = "http://127.0.0.1:5500/frontend/dashboard.html";

      }, 1500);

      // Clear form
      loginForm.reset();

    } catch (err) {
      console.error('Login error:', err);
      displayStatus(err.message || "An error occurred", "red");
    } finally {
      setLoading(false);
    }
  });

  // Utility: Display message
  function displayStatus(message, color) {
    statusMsg.textContent = message;
    statusMsg.style.color = color;
  }

  // Utility: Button loading state
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.innerHTML = isLoading ? "Authenticating..." : `<span class="btn-text">Login</span> <i class="fas fa-sign-in-alt"></i>`;
  }
});
