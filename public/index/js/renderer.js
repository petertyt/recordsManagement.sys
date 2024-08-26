document.addEventListener("DOMContentLoaded", function () {
  // Handle Sign Out Button Click
  const signOutButton = document.getElementById("sign-out-button");
  if (signOutButton) {
      signOutButton.addEventListener("click", () => {
          window.electronAPI.signOut();
      });
  }

  // Get the element with the class 'dashboard-link'
  const dashboardLink = document.querySelector(".dashboard-link");

  // Add the 'active' class to it on load
  if (dashboardLink) {
      dashboardLink.classList.add("active");
  }

  // Add click event listener to all menu items
  document.querySelectorAll(".menu-list").forEach((item) => {
      item.addEventListener("click", function (event) {
          event.preventDefault();

          // Remove active class from all menu items
          document.querySelectorAll(".menu-list").forEach((menu) => menu.classList.remove("active"));
          // Add active class to the clicked menu item
          this.classList.add("active");

          // Load the corresponding content
          const contentUrl = this.getAttribute("data-content-url");
          loadContent(contentUrl);
      });
  });

  // Function to load content dynamically
  function loadContent(view) {
      const spinner = document.getElementById('spinner-event');
      const mainContent = document.getElementById('main-content');

      // Show the spinner and apply blur effect
      spinner.style.display = 'flex';
      mainContent.className = 'blur-effect';

      // Fetch and load the content
      fetch(`../views/pages/${view}.ejs`)
          .then(response => response.text())
          .then(html => {
              mainContent.innerHTML = html;

              // Hide the spinner and remove blur effect
              setTimeout(() => {
                  spinner.style.display = 'none';
                  mainContent.className = '';
              }, 500); // Adjust timing as needed
          })
          .catch(error => {
              console.error('Error loading content:', error);
              // Optionally, hide the spinner and remove blur effect in case of error
              spinner.style.display = 'none';
              mainContent.className = '';
          });
  }

  // Function to check window size and adjust spinner class
  function checkWindowSize() {
      const windowWidth = window.innerWidth;
      const screenWidth = window.screen.width;
      const spinner = document.getElementById('spinner-event');

      if (windowWidth <= screenWidth / 2) {
          spinner.className = 'spinner-display-halfscreen';
      } else {
          spinner.className = 'spinner-display';
      }
  }

  // Listen for window resize events
  window.addEventListener('resize', checkWindowSize);
  // Run the function once on initial load
  checkWindowSize();
});
