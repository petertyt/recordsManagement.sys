document.addEventListener("DOMContentLoaded", () => {
  // Splash screen to modal transition
  setTimeout(() => {
    document.querySelector(".splash-contentContainer").style.display = "none";
    document.getElementById("login-modal").style.display = "flex";
  }, 3000);

  // Handle login button click
  document.getElementById("login-btn").addEventListener("click", (event) => {
    event.preventDefault();
    authenticate();
  });

  // Forgot password link click
  document.getElementById("forgot-password-link").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("login-form").style.display = "none";
    document.getElementById("forgot-password-form").style.display = "block";
  });

  // Back to login link click
  document.getElementById("back-to-login").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("forgot-password-form").style.display = "none";
    document.getElementById("login-form").style.display = "block";
  });

  // Handle reset password button click
  document.getElementById("reset-password-btn").addEventListener("click", (event) => {
    event.preventDefault();
    resetPassword();
  });

  // Authenticate user
  function authenticate() {
    const username = document.querySelector("input[name='username']").value.trim();
    const password = document.querySelector("input[name='password']").value;

    if (!username || !password) {
      showErrorState('Please enter both username and password.');
      return;
    }

    // Send login attempt to the main process
    window.electronAPI.sendLoginAttempt({ username, password });
  }

  // Reset password function
  function resetPassword() {
    const adminPassword = document.querySelector("input[name='admin-password']").value;
    const newPassword = document.querySelector("input[name='new-password']").value;

    if (!adminPassword || !newPassword) {
      showErrorState('Please fill out all fields.');
      return;
    }

    // Send reset password attempt to the main process
    window.electronAPI.sendPasswordReset({ adminPassword, newPassword });
  }

  // Listen for login response from the main process
  window.electronAPI.onLoginResponse((response) => {
    if (response && response.success) {
      window.location.href = 'index.ejs'; // Navigate to main window
    } else if (response && response.message) {
      showErrorState(response.message);
    } else {
      showErrorState('An unknown error occurred.');
    }
  });

  // Listen for password reset response
  window.electronAPI.onPasswordResetResponse((response) => {
    if (response && response.success) {
      alert('Password successfully reset.');
      document.getElementById("forgot-password-form").style.display = "none";
      document.getElementById("login-form").style.display = "block";
    } else {
      showErrorState(response.message || 'Error resetting password.');
    }
  });

  // Show error message
  function showErrorState(message) {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.textContent = message;
    setTimeout(() => { errorMsg.textContent = ''; }, 3000);
  }
});
