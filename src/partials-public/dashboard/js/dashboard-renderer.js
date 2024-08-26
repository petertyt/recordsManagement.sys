/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
  }
  
  // Close the dropdown menu if the user clicks outside of it
  window.onclick = function (event) {
    if (!event.target.matches(".dropbtn")) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains("show")) {
          openDropdown.classList.remove("show");
        }
      }
    }
  };

  /* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
  }
  
  // Close the dropdown menu if the user clicks outside of it
  window.onclick = function (event) {
    if (!event.target.matches(".dropbtn")) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains("show")) {
          openDropdown.classList.remove("show");
        }
      }
    }
  };
  
  // Example function to simulate fetching data from a database
  function fetchRecentEntries() {
    // Simulate database fetch with a static array of objects
    return [
      {
        entryID: "8",
        type: "Letter",
        number: "LVD 6060",
        title: "Invitation to Seminar",
        dateAdded: "2024-08-20",
        status: "FILED"
      },
      {
        entryID: "20",
        type: "File",
        number: "LVD 5971",
        title: "Project Report Q3",
        dateAdded: "2024-08-18",
        status: "OUT"
      },
      {
        entryID: "78",
        type: "Letter",
        number: "LVD 350",
        title: "Meeting Minutes",
        dateAdded: "2024-08-15",
        status: "FILED"
      }
    ];
  }
  
  // Function to get the status class based on the entry status
  function getStatusClass(status) {
    switch (status.toUpperCase()) {
      case "FILED":
        return "status-filed";
      case "PENDING":
        return "status-pending";
      case "OUT":
        return "status-out";
      case "IN":
        return "status-in";
      default:
        return "";
    }
  }
  
  // Function to render the entries in the table
  function renderRecentEntries() {
    const entries = fetchRecentEntries(); // This will be replaced by actual DB fetch
    const tbody = document.getElementById("recent-entries-body");
  
    // Clear existing table rows
    tbody.innerHTML = "";
  
    // Loop through entries and create table rows
    entries.forEach((entry, index) => {
      const row = document.createElement("tr");
      const tdata = document.createElement("td")
      const statusClass = getStatusClass(entry.status);
      tdata.classList.add(statusClass);
      row.innerHTML = `
                  <td>${entry.entryID}</td>
                  <td>${entry.dateAdded}</td>
                  <td>${entry.number}</td>
                  <td>${entry.dateAdded}</td>
                  <td>${entry.type}</td>
                  <td>${entry.status}</td>
              `;
      tbody.appendChild(row);
    });
  
    // Show message if no entries are found
    if (entries.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `
                  <td colspan="5" class="text-center">No recent entries found.</td>
              `;
      tbody.appendChild(row);
    }
  }
  
  // Call the function to render entries on page load
  document.addEventListener("DOMContentLoaded", renderRecentEntries);
  