document.addEventListener('DOMContentLoaded', () => {
  // Splash screen to modal transition
  setTimeout(() => {
    //   console.log("Hiding splash content, showing login modal."); // Debug message
    document.querySelector('.splash-contentContainer').style.display = 'none';
    document.getElementById('login-modal').style.display = 'flex';
  }, 3000); // Show the modal after 3 seconds

  // Handle login button click
  document.querySelector('button').addEventListener('click', (event) => {
    event.preventDefault();
    authenticate();
  });

  // Handle Enter key press for login
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        authenticate();
      }
    });
  });

  function authenticate() {
    const usernameInput = document.querySelector("input[name='username']");
    const passwordInput = document.querySelector("input[name='password']");
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Simple authentication check
    if (username === 'admin' && password === 'password') {
      window.electronAPI.sendLoginSuccess();
    } else {
      showErrorState(usernameInput, passwordInput);
    }
  }

  function showErrorState(usernameInput, passwordInput) {
    usernameInput.classList.add('error');
    passwordInput.classList.add('error');

    // Optionally, you can remove the error state after some time
    setTimeout(() => {
      usernameInput.classList.remove('error');
      passwordInput.classList.remove('error');
    }, 3000);
  }
});
