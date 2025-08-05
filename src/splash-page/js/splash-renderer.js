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

  // Authenticate user
  function authenticate() {
    const usernameInput = document.querySelector("input[name='username']");
    const passwordInput = document.querySelector("input[name='password']");
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showErrorState("Please enter both username and password.");
      return;
    }

    // Send login attempt to the main process
    window.electronAPI.sendLoginAttempt({ username, password });
  }

  // Listen for login response from the main process
  window.electronAPI.onLoginResponse((response) => {
    if (response && response.success) {
      // Successful login
      console.log("Login successful");
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      // Optionally, you can add logic here, like transitioning to another window
      window.location.href = "index.ejs"; // Example: navigate to the main window
    } else if (response && response.message) {
      // Display error message
      showErrorState(response.message);
    } else {
      showErrorState("An unknown error occurred.");
    }
  });

  // Show error message
  function showErrorState(message) {
    const usernameInput = document.querySelector("input[name='username']");
    const passwordInput = document.querySelector("input[name='password']");
    const errorMsg = document.getElementById("error-msg");

    usernameInput.classList.add("error");
    passwordInput.classList.add("error");
    errorMsg.textContent = message;

    setTimeout(() => {
      usernameInput.classList.remove("error");
      passwordInput.classList.remove("error");
      errorMsg.textContent = "";
    }, 3000);
  }
});
