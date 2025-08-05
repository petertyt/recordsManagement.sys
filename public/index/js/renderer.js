document.addEventListener("DOMContentLoaded", function () {
  // Listen for user data sent from the main process
  window.electronAPI.onUserData((userData) => {
    const usernameElement = document.getElementById("username");
    const userRoleElement = document.getElementById("user_role");

    // Update the UI with the received user data
    usernameElement.textContent = userData.username;
    userRoleElement.textContent = userData.role;
  });

  // Get the element with the class 'dashboard-link'
  const dashboardLink = document.querySelector(".dashboard-link");

  // Theme toggle setup
  const themeToggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
    if (themeToggle) {
      themeToggle.checked = true;
    }
  }
  themeToggle?.addEventListener("change", () => {
    if (themeToggle.checked) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  });

  // Add the 'active' class to it on load
  if (dashboardLink) {
    dashboardLink.classList.add("active");
  }

  function addMenuEventListeners() {
    // Add click event listener to all menu items
    document.querySelectorAll(".menu-list").forEach((item) => {
      item.addEventListener("click", function (event) {
        event.preventDefault();

        // Remove active class from all menu items
        document
          .querySelectorAll(".menu-list")
          .forEach((menu) => menu.classList.remove("active"));

        // Add active class to the clicked menu item
        this.classList.add("active");

        // Load the corresponding content
        const contentUrl = this.getAttribute("data-content-url");
        loadContent(contentUrl);
      });
    });
  }

  function addActivityViewEventListeners() {
    document
      .querySelectorAll(".activity-view-btn .view-btn")
      .forEach((button) => {
        button.addEventListener("click", function () {
          const view = this.getAttribute("data-content-url");

          // Load the corresponding content and pass the view to handle active class after loading
          loadContent(view);
        });
      });
  }

  function loadContent(view) {
    const spinner = document.getElementById("spinner-event");
    const mainContent = document.getElementById("main-content");

    // Show the spinner and apply blur effect
    // spinner.style.display = "flex";
    // mainContent.classList.add("blur-effect");

    // Fetch and load the content
    fetch(`../views/pages/${view}.ejs`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${view}`);
        }
        return response.text();
      })
      .then((html) => {
        mainContent.innerHTML = html;

        // Re-apply active class to the correct menu item
        applyActiveClass(view);

        // Re-attach event listeners after loading new content
        addMenuEventListeners();
        addActivityViewEventListeners();

        // Initialize components based on the loaded view
        if (view === "dashboard") {
          initializeDataTable();
          fetchSummations();
        } else if (view === "reports") {
          initializeReportManagement();
        } else if (view === "letter-management") {
          // Add this condition
          initializeLetterManagement(); // Call the initialization function
        } else if (view === "entries") {
          // Add this condition
          initializeEntriesManagement();
        } else if (view === "file-management") {
          // Add this condition
          initializeFileManagement();
        } else if (view === "users") {
          // Add this condition
          initializeUsersManagement(); // Call the initialization function
        }

        // Hide the spinner and remove blur effect
        // setTimeout(() => {
        //     spinner.style.display = "none";
        //     mainContent.classList.remove("blur-effect");
        // }, 500); // Adjust timing as needed
      })
      .catch((error) => {
        console.error("Error loading content:", error);
        spinner.style.display = "none";
        mainContent.classList.remove("blur-effect");
        mainContent.innerHTML = `<p class="error-message">Error loading content: ${error.message}</p>`;
      });
  }

  function initializeFileManagement() {
    console.log("Initializing File Management");

    // Call the DataTable initialization for letters table
    initializeDataTableforFiles();

    // Attach additional event listeners specific to letter management
    attachRowClickListener($("#files-table").DataTable()); // Assuming letters table uses DataTable

    // Additional setup or event listeners can be added here
  }

  function initializeEntriesManagement() {
    console.log("Initializing Entries");

    // Call the DataTable initialization for letters table
    initializeDataTableforEntries();

    // Attach additional event listeners specific to letter management
    attachRowClickListener($("#entries-table").DataTable()); // Assuming letters table uses DataTable

    // Additional setup or event listeners can be added here
  }

  function initializeLetterManagement() {
    console.log("Initializing Letter Management");

    // Call the DataTable initialization for letters table
    initializeDataTableforLetters();

    // Attach additional event listeners specific to letter management
    attachRowClickListener($("#letters-table").DataTable()); // Assuming letters table uses DataTable

    // Additional setup or event listeners can be added here
  }

  function initializeReportManagement() {
    console.log("Initializing Report Management");

    // Event listeners for report management page
    document
      .getElementById("generate-report")
      ?.addEventListener("click", generateReport);
    document.getElementById("export-pdf")?.addEventListener("click", exportPDF);
    document
      .getElementById("print-report")
      ?.addEventListener("click", () => window.print());
  }

  function initializeUsersManagement() {
    console.log("Initializing Users Management");

    // Function to initialize UserManager
    const initUserManager = () => {
      try {
        // Check if UserManager class is available
        if (typeof window.UserManager === "undefined") {
          console.error(
            "UserManager class is not defined. Script may not be loaded."
          );
          return;
        }

        // Initialize UserManager if it doesn't exist or reinitialize it
        if (typeof window.userManager === "undefined") {
          console.log("Creating new UserManager instance");
          window.userManager = new window.UserManager();
        } else {
          console.log("Reinitializing existing UserManager");
          // Reinitialize the UserManager for the newly loaded content
          window.userManager.init();
        }

        // Ensure userManager is accessible globally
        console.log("UserManager initialized:", typeof window.userManager);
        console.log(
          "UserManager methods available:",
          Object.getOwnPropertyNames(Object.getPrototypeOf(window.userManager))
        );
      } catch (error) {
        console.error("Error initializing UserManager:", error);
      }
    };

    // Try to initialize immediately
    initUserManager();

    // If UserManager is not available, try again after a delay
    if (typeof window.UserManager === "undefined") {
      console.log("UserManager not available, retrying in 1 second...");
      setTimeout(initUserManager, 1000);
    }
  }

  function applyActiveClass(view) {
    // Remove active class from all menu items
    document.querySelectorAll(".menu-list").forEach((menu) => {
      menu.classList.remove("active");
    });

    // Handling different menu items based on the view
    let menuItem = null;
    switch (view) {
      case "dashboard":
        menuItem = document.querySelector("#menu-dashboard");
        break;
      case "letter-management":
        menuItem = document.querySelector("#menu-letters");
        break;
      case "entries":
        menuItem = document.querySelector("#menu-entries");
        break;
      case "file-management":
        menuItem = document.querySelector("#menu-files");
        break;
      case "reports":
        menuItem = document.querySelector("#menu-reports");
        break;
      case "users":
        menuItem = document.querySelector("#menu-users");
        break;
      // Add more cases as needed for additional views
      default:
        console.warn("No matching menu item found for view:", view);
        break;
    }

    // Add active class to the corresponding menu item
    if (menuItem) {
      menuItem.classList.add("active");
    }
  }

  // Initial call to add event listeners
  addMenuEventListeners();
  addActivityViewEventListeners();
});
