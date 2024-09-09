document.addEventListener("DOMContentLoaded", () => {
  // Splash screen to modal transition
  setTimeout(() => {
    document.querySelector(".splash-contentContainer").style.display = "none";
    document.getElementById("login-modal").style.display = "flex";
  }, 3000); // Show the modal after 3 seconds

  // Handle login button click
  document.getElementById("login-btn").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent form submission
    authenticate();
  });

  // Handle Enter key press for login
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        authenticate();
      }
    });
  });

  function authenticate() {
    const usernameInput = document.querySelector("input[name='username']");
    const passwordInput = document.querySelector("input[name='password']");
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showErrorState('Please enter both username and password.');
      return;
    }

    // Send login attempt to main process
    window.electronAPI.sendLoginAttempt({ username, password });
  }

  // Listen for login response from main process
  window.electronAPI.onLoginResponse((event, response) => {
    if (response && response.success) {  // Check if response exists and has success
      // Successful login
      console.log('Login successful');
      // Optionally, you can add logic here, like transitioning to another window
    } else if (response && response.message) {
      // Display error message
      showErrorState(response.message);
    } else {
      showErrorState('An unknown error occurred.');
    }
  });

  function showErrorState(message) {
    const usernameInput = document.querySelector("input[name='username']");
    const passwordInput = document.querySelector("input[name='password']");
    const errorMsg = document.getElementById('error-msg');

    usernameInput.classList.add("error");
    passwordInput.classList.add("error");
    errorMsg.textContent = message;

    setTimeout(() => {
      usernameInput.classList.remove("error");
      passwordInput.classList.remove("error");
      errorMsg.textContent = '';
    }, 3000);
  }
});
