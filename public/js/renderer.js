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
  