$(document).ready(function () {
    // Initialize DataTable on page load
    initializeDataTable();

    // Fetch summations when the page loads
    fetchSummations();

    function fetchSummations() {
        $.ajax({
            url: 'http://localhost:49200/api/summations',
            type: 'GET',
            success: function (data) {
                // Update the card elements with the fetched data
                $('#entries-count').text(data.total_entries);
                $('#letters-count').text(data.total_letters);
                $('#files-count').text(data.total_files);
            },
            error: function (xhr, status, error) {
                console.error("Error fetching summations:", error);
                $('#entries-count').text('Error');
                $('#letters-count').text('Error');
                $('#files-count').text('Error');
            }
        });
    }

    // CRUD Operations: Update entry
    $('#entryForm').on('submit', function (e) {
        e.preventDefault();

        const entryData = {
            entry_id: $('#entry_id').val(),
            file_number: $('#file_number').val(),
            status: $('#status').val()
        };

        // Fetch summations when the page loads
        fetchSummations();

        function fetchSummations() {
            $.ajax({
                url: 'http://localhost:49200/api/summations',
                type: 'GET',
                success: function (data) {
                    // Update the card elements with the fetched data
                    $('#entries-count').text(data.total_entries);
                    $('#letters-count').text(data.total_letters);
                    $('#files-count').text(data.total_files);
                },
                error: function (xhr, status, error) {
                    console.error("Error fetching summations:", error);
                    $('#entries-count').text('Error');
                    $('#letters-count').text('Error');
                    $('#files-count').text('Error');
                }
            });
        }

        $.ajax({
            url: 'http://localhost:49200/api/update-entry',
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
            "url": "http://localhost:49200/api/recent-entries",
            "dataSrc": function (json) {
                console.log("AJAX Response:", json); // Log the AJAX response for debugging
                return json.data;
            }
        },
        "columns": [
            { "data": "entry_id" },
            { "data": "entry_date" },
            { "data": "file_number" },
            { "data": "subject" },
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
