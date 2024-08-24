document.addEventListener("DOMContentLoaded", function () {

  const signOutButton = document.getElementById("sign-out-button");
  if (signOutButton) {
    signOutButton.addEventListener("click", () => {
      window.electronAPI.signOut();
    });
  }
  
  // Get the element with the class 'dashboard-link'
  var dashboardLink = document.querySelector(".dashboard-link");

  // Add the 'active' class to it
  if (dashboardLink) {
    dashboardLink.classList.add("active");
  }
});

// Add a click event listener to the 'dashboard-link' element
document.addEventListener('DOMContentLoaded', () => {
  // Get all submenu buttons
  const submenuButtons = document.querySelectorAll('.menu-list');
  // Get the spinner element
  const spinner = document.getElementById('spinner-event');

  submenuButtons.forEach(button => {
      button.addEventListener('click', () => {
          // Show the spinner
          spinner.style.display = 'flex';

          // Hide the spinner after 1 second
          setTimeout(() => {
              spinner.style.display = 'none';
          }, 1000); // Hide after 1 second
      });
  });
});


  // dashboardLink.addEventListener("click", function (event) {
  //   // Prevent the default link behavior
  //   event.preventDefault();

  //   // Get the target URL from the 'href' attribute of the link
  //   var targetUrl = this.getAttribute("href");

  //   // Open the target URL in a new browser tab
  //   window.open(targetUrl, "_blank");
  // });

document.querySelectorAll(".menu-list").forEach((item) => {
  item.addEventListener("click", function () {
    // Remove active class from all menu items
    document
      .querySelectorAll(".menu-list")
      .forEach((menu) => menu.classList.remove("active"));

    // Add active class to the clicked menu item
    this.classList.add("active");
  });
});

    // Function to change class based on window size
    function checkWindowSize() {
      // Get the current window width and screen width
      const windowWidth = window.innerWidth;
      const screenWidth = window.screen.width;

      // Find the element
      const myElement = document.getElementById('spinner-event');

      // Check if the window width is less than or equal to 50% of the screen width
      if (windowWidth <= screenWidth / 2) {
          myElement.className = 'spinner-display-halfscreen'; // Change to your desired class
      } else {
          myElement.className = 'spinner-display'; // Revert to the default class
      }
  }

  // Listen for window resize event
  window.addEventListener('resize', checkWindowSize);

  // Run the function once on initial load
  checkWindowSize();
