document.addEventListener("DOMContentLoaded", function () {
  // Get the element with the class 'dashboard-link'
  var dashboardLink = document.querySelector(".dashboard-link");

  // Add the 'active' class to it
  if (dashboardLink) {
    dashboardLink.classList.add("active");
  }
});

function toggleMenu(menuId) {
  // Get all submenu elements
  var allSubmenus = document.querySelectorAll(".submenu");

  // Loop through all submenu elements
  allSubmenus.forEach(function (submenu) {
    // If the submenu is open and it's not the one that was clicked, close it
    if (
      submenu !== document.getElementById(menuId) &&
      getComputedStyle(submenu).maxHeight !== "0px"
    ) {
      submenu.style.maxHeight = null;
    }
  });

  // Toggle the clicked submenu
  var menu = document.getElementById(menuId);
  if (getComputedStyle(menu).maxHeight !== "0px") {
    menu.style.maxHeight = null;
  } else {
    menu.style.maxHeight = menu.scrollHeight + "px";
  }
}

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
