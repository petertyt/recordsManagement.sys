$(document).ready(function () {
  // Initialize components on page load
  initializeDataTableforEntries();

  // Handle form submission for updating entries
  $("#entryForm").on("submit", function (e) {
    e.preventDefault();

    const entryData = {
      entry_id: $("#entry_id").val(),
      file_number: $("#file_number").val(),
      status: $("#status").val(),
    };

    $.ajax({
      url: "http://localhost:49200/api/update-entry",
      type: "POST",
      data: JSON.stringify(entryData),
      contentType: "application/json",
      success: function (response) {
        console.log("Entry updated successfully:", response);
        $("#entryModal").modal("hide");
        $("#letters-table").DataTable().ajax.reload(); // Reload table to reflect changes
      },
      error: function (xhr, status, error) {
        console.error("Error updating entry:", error);
      },
    });
  });
});

function initializeDataTableforEntries() {
  const entriesTable = $("#entries-table").DataTable({
    ajax: {
      url: "http://localhost:49200/api/recent-entries-full",
      dataSrc: function (json) {
        console.log("AJAX Response:", json);
        return json.data; // Adjust based on your API response
      },
    },
    columns: [
      { data: "entry_id" },
      { data: "entry_date" },
      { data: "entry_category" },
      { data: "file_number" },
      {
        data: "subject",
        render: function (data, type, row) {
          return truncate(data, 100); // Shorten text for long subjects
        },
      },
      { data: "officer_assigned" },
      { data: "status" },
    ],
    initComplete: function () {
      // Attach listeners on table initialization
      attachRowClickListener(entriesTable);
    },
    drawCallback: function () {
      // Reattach listeners after every draw (reload or redraw)
      attachRowClickListener(entriesTable);
    },
  });
}

function showCustomModal(
  title,
  message,
  type = "info",
  onConfirm = null,
  onCancel = null
) {
  // Remove any existing custom modal
  const existingModal = document.getElementById("customModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHtml = `
        <div class="modal fade" id="customModal" tabindex="-1" aria-labelledby="customModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header ${
                      type === "error"
                        ? "bg-danger text-white"
                        : type === "success"
                        ? "bg-success text-white"
                        : "bg-primary text-white"
                    }">
                        <h5 class="modal-title" id="customModalLabel">
                            <i class="bi ${
                              type === "error"
                                ? "bi-exclamation-triangle"
                                : type === "success"
                                ? "bi-check-circle"
                                : "bi-info-circle"
                            }"></i>
                            ${escapeHtml(title)}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-0">${escapeHtml(message)}</p>
                    </div>
                    <div class="modal-footer">
                        ${
                          type === "confirm"
                            ? `
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirmBtn">Confirm</button>
                        `
                            : `
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                        `
                        }
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Get modal element
  const modal = document.getElementById("customModal");
  const modalInstance = new bootstrap.Modal(modal);

  // Handle confirm button click
  if (type === "confirm" && onConfirm) {
    const confirmBtn = modal.querySelector("#confirmBtn");
    confirmBtn.addEventListener("click", () => {
      modalInstance.hide();
      if (onConfirm) onConfirm();
    });
  }

  // Handle modal hidden event
  modal.addEventListener("hidden.bs.modal", () => {
    if (type === "confirm" && onCancel) onCancel();
    modal.remove();
  });

  // Show modal
  modalInstance.show();
}

function showConfirmModal(title, message, onConfirm, onCancel = null) {
  showCustomModal(title, message, "confirm", onConfirm, onCancel);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function attachRowClickListener(entriesTable) {
  // Unbinding and re-binding click events for table rows
  $("#entries-table tbody")
    .off("click", "tr")
    .on("click", "tr", function () {
      const data = entriesTable.row(this).data();
      $("#file_number").val(data.file_number);
      $("#subject").val(data.subject);
      $("#officer_assigned").val(data.officer_assigned);
      $("#entry_id").val(data.entry_id);
      $("#status").val(data.status);
      $("#entryModal").modal("show");
    });

  // Search functionality for the Letter Management
  let debounceTimeout;
  $("#system-search").on("keyup", function () {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      entriesTable.search(this.value).draw();
    }, 300); // Adjust delay as necessary
  });

  // Handle the View and Delete actions
  $("#entries-table tbody")
    .off("click", "button")
    .on("click", "button", function (e) {
      e.stopPropagation(); // To prevent triggering the row click event
      const data = entriesTable.row($(this).parents("tr")).data();
      if ($(this).hasClass("view-letter")) {
        // Logic to view the letter details
        showCustomModal(
          "View Letter",
          "Letter details: " + JSON.stringify(data),
          "info"
        );
      } else if ($(this).hasClass("delete-letter")) {
        // Logic to delete the letter
        showConfirmModal(
          "Delete Letter",
          "Are you sure you want to delete this letter?",
          () => {
            // Handle delete logic here
            console.log("Deleting letter:", data.entry_id);
          }
        );
      }
    });
}
