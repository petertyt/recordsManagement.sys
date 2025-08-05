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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

$(document).ready(function () {
  $("#generate-report").on("click", function () {
    generateReport();
  });

  $("#export-pdf").on("click", function () {
    exportPDF();
  });
});

function generateReport() {
  const startDate = $("#start-date").val();
  const endDate = $("#end-date").val();
  const officerAssigned = $("#officer-assigned").val();
  const status = $("#status").val();
  const fileNumber = $("#file-number").val();
  const category = $("#category").val();

  $.ajax({
    url: "http://localhost:49200/api/make-reports",
    method: "GET",
    data: {
      start_date: startDate,
      end_date: endDate,
      officer_assigned: officerAssigned,
      status: status,
      file_number: fileNumber,
      category: category,
    },
    success: function (data) {
      $("#report-content").html(renderReport(data));
    },
    error: function () {
      showCustomModal("Error", "Failed to generate report.", "error");
    },
  });
}

function renderReport(data) {
  let reportHtml = '<table class="table table-striped table-bordered">';
  reportHtml +=
    "<thead><tr><th>Entry ID</th><th>Date</th><th>Category</th><th>File Number</th><th>Subject</th><th>Officer Assigned</th><th>Status</th></tr></thead>";
  reportHtml += "<tbody>";
  data.data.forEach(function (entry) {
    reportHtml += `<tr>
            <td>${entry.entry_id}</td>
            <td>${entry.entry_date}</td>
            <td>${entry.entry_category}</td>
            <td>${entry.file_number}</td>
            <td>${entry.subject}</td>
            <td>${entry.officer_assigned}</td>
            <td>${entry.status}</td>
        </tr>`;
  });
  reportHtml += "</tbody></table>";
  return reportHtml;
}

// Function to export the report as a PDF using jsPDF
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // // Add logo (replace with actual base64 data or URL)
  // const imgData = 'data:image/png;base64,<your_base64_encoded_image>'; // Add your base64 logo here
  // doc.addImage(imgData, 'PNG', 10, 10, 30, 30); // Add logo at the top-left (x, y, width, height)

  // Add header
  doc.setFontSize(14);
  doc.text("LANDS COMMISSION, GHANA", 105, 20, { align: "center" });
  doc.setFontSize(8);
  doc.text("Land Valuation Department (LVD)", 105, 30, { align: "center" });
  doc.text("Files Office", 105, 40, { align: "center" });
  doc.line(10, 45, 200, 45); // Horizontal line

  // Add report content
  const reportContent = document.getElementById("report-content");

  // Rendering the HTML content into the PDF using html2canvas and jsPDF
  doc.html(reportContent, {
    x: 10,
    y: 60,
    width: 190,
    callback: function (doc) {
      // Add footer with page number
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${totalPages}`, 105, 290, { align: "center" });
      }
      doc.save("report.pdf"); // Save the PDF file
    },
  });
}
