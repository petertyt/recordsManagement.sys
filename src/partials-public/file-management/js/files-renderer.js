$(document).ready(function () {
    // Initialize components on page load
    initializeDataTableforFiles();

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
                $('#files-table').DataTable().ajax.reload(); // Reload table to reflect changes
            },
            error: function (xhr, status, error) {
                console.error("Error updating entry:", error);
            }
        });
    });
});

function initializeDataTableforFiles() {
    const lettersTable = $('#files-table').DataTable({
        "ajax": {
            "url": "http://localhost:49200/api/get-files",
            "dataSrc": function (json) {
                console.log("AJAX Response:", json);
                return json.data; // Assuming json.data is the correct path to your array of data
            }
        },
        "columns": [
            { "data": "entry_id" },
            { "data": "entry_date" },
            { "data": "file_number" },
            {
                "data": "subject",
                "render": function (data, type, row) {
                    return truncate(data, 60); // Assuming truncate is a function defined elsewhere to shorten text
                }
            },
            { "data": "officer_assigned" },
            { "data": "status" },
            {
                "data": null,
                "defaultContent": `
            <button class="btn btn-sm btn-info view-file">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg> 
                Edit
            </button> 
            <button class="btn btn-sm btn-danger delete-file">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zm4.5 1.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                </svg>
            </button>`
            }
        ],

        "initComplete": function () {
            attachRowClickListener(filesTable);
        }
    });
}

function attachRowClickListener(lettersTable) {
    // Unbinding and re-binding click events for table rows
    $('#files-table tbody').off('click', 'tr').on('click', 'tr', function () {
        const data = lettersTable.row(this).data();
        $('#file_number').val(data.file_number);
        $('#subject').val(data.subject);
        $('#officer_assigned').val(data.officer_assigned);
        $('#entry_id').val(data.entry_id);
        $('#status').val(data.status);
        $('#entryModal').modal('show');
    });

    // Search functionality for the Letter Management
    $('#system-search').off('keyup').on('keyup', function () {
        lettersTable.search(this.value).draw();
    });

    // // Handle the Add New Letter button click
    // $('#add-file').off('click').on('click', function () {
    //     // Logic to add a new letter (e.g., open a modal with a form)
    //     alert('Add New File functionality not implemented yet.');
    // });

    // // Handle the View and Delete actions
    // $('#files-table tbody').off('click', 'button').on('click', 'button', function (e) {
    //     e.stopPropagation(); // To prevent triggering the row click event
    //     const data = lettersTable.row($(this).parents('tr')).data();
    //     if ($(this).hasClass('view-file')) {
    //         // Logic to view the letter details
    //         alert('View File: ' + JSON.stringify(data));
    //     } else if ($(this).hasClass('delete-file')) {
    //         // Logic to delete the letter
    //         alert('Delete File: ' + data.entry_id);
    //     }
    // });
}
