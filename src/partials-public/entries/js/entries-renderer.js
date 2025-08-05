$(document).ready(function () {
    // Initialize components on page load
    initializeDataTableforEntries();

    // Handle form submission for updating entries
    $('#entryForm').on('submit', function (e) {
        e.preventDefault();

        const entryData = {
            entry_id: $('#entry_id').val(),
            file_number: $('#file_number').val(),
            status: $('#status').val()
        };

        $.ajax({
            url: 'http://localhost:49200/api/update-entry',
            type: 'POST',
            data: JSON.stringify(entryData),
            contentType: 'application/json',
            success: function (response) {
                console.log("Entry updated successfully:", response);
                $('#entryModal').modal('hide');
                $('#letters-table').DataTable().ajax.reload(); // Reload table to reflect changes
            },
            error: function (xhr, status, error) {
                console.error("Error updating entry:", error);
            }
        });
    });
});

function initializeDataTableforEntries() {
    const entriesTable = $('#entries-table').DataTable({
        "ajax": {
            "url": "http://localhost:49200/api/all-entries",
            "dataSrc": function (json) {
                console.log("AJAX Response:", json);
                return json.data; // Adjust based on your API response
            }
        },
        "columns": [
            { "data": "entry_id" },
            { "data": "entry_date" },
            { "data": "entry_category" },
            { "data": "file_number" },
            {
                "data": "subject",
                "render": function (data, type, row) {
                    return truncate(data, 100); // Shorten text for long subjects
                }
            },
            { "data": "officer_assigned" },
            { "data": "status" }
        ],
        "initComplete": function () {
            // Attach listeners on table initialization
            attachRowClickListener(entriesTable);
        },
        "drawCallback": function () {
            // Reattach listeners after every draw (reload or redraw)
            attachRowClickListener(entriesTable);
        }
    });
}


function attachRowClickListener(entriesTable) {
    // Unbinding and re-binding click events for table rows
    $('#entries-table tbody').off('click', 'tr').on('click', 'tr', function () {
        const data = entriesTable.row(this).data();
        $('#file_number').val(data.file_number);
        $('#subject').val(data.subject);
        $('#officer_assigned').val(data.officer_assigned);
        $('#entry_id').val(data.entry_id);
        $('#status').val(data.status);
        $('#entryModal').modal('show');
    });

    // Handle the View and Delete actions
    $('#entries-table tbody').off('click', 'button').on('click', 'button', function (e) {
        e.stopPropagation(); // To prevent triggering the row click event
        const data = entriesTable.row($(this).parents('tr')).data();
        if ($(this).hasClass('view-letter')) {
            // Logic to view the letter details
            alert('View Letter: ' + JSON.stringify(data));
        } else if ($(this).hasClass('delete-letter')) {
            // Logic to delete the letter
            alert('Delete Letter: ' + data.entry_id);
        }
    });
}
