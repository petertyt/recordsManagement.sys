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
            "url": "http://localhost:49200/api/recent-entries-full",
            "dataSrc": function (json) {
                console.log("AJAX Response:", json);
                return json.data; // Assuming json.data is the correct path to your array of data
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
                    return truncate(data, 60); // Assuming truncate is a function defined elsewhere to shorten text
                }
            },
            { "data": "officer_assigned" },
            { "data": "status" }
        ],

        "initComplete": function () {
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

    // Search functionality for the Letter Management
    $('#system-search').off('keyup').on('keyup', function () {
        entriesTable.search(this.value).draw();
    });

    // // Handle the Add New Letter button click
    // $('#add-entry').off('click').on('click', function () {
    //     // Logic to add a new letter (e.g., open a modal with a form)
    //     alert('Add New Letter functionality not implemented yet.');
    // });

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
