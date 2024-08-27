$(document).ready(function () {
  // Initialize DataTable on page load
  initializeDataTable();

  // CRUD Operations: Update entry
  $('#entryForm').on('submit', function (e) {
      e.preventDefault();

      const entryData = {
          entry_id: $('#entry_id').val(),
          file_number: $('#file_number').val(),
          status: $('#status').val()
      };

      $.ajax({
          url: 'http://localhost:3000/api/update-entry',
          type: 'POST',
          data: JSON.stringify(entryData),
          contentType: 'application/json',
          success: function (response) {
              console.log("Entry updated successfully:", response);
              $('#entryModal').modal('hide');
              $('#recentEntriesTable').DataTable().ajax.reload();
          },
          error: function (xhr, status, error) {
              console.error("Error updating entry:", error);
          }
      });
  });
});

function initializeDataTable() {
  // Initialize the DataTable
  $('#recentEntriesTable').DataTable({
      "ajax": {
          "url": "http://localhost:3000/api/recent-entries",
          "dataSrc": function (json) {
              console.log("AJAX Response:", json); // Log the AJAX response for debugging
              return json.data;
          }
      },
      "columns": [
          { "data": "entry_id" },
          { "data": "entry_date" },
          { "data": "file_number" },
          { "data": "file_subject" },
          { "data": "officer_assigned" },
          { "data": "status" }
      ],
      "initComplete": function () {
          // Attach event listener after the table is fully initialized
          attachRowClickListener();
      }
  });
}

function attachRowClickListener() {
  // Attach the event listener for the row click event
  $('#recentEntriesTable tbody').off('click', 'tr').on('click', 'tr', function () {
      const data = $('#recentEntriesTable').DataTable().row(this).data();
      $('#entry_id').val(data.entry_id);
      $('#file_number').val(data.file_number);
      $('#status').val(data.status);
      $('#entryModal').modal('show');
  });
}
