$(document).ready(function () {
    setupFileModalActions();
    initializeDataTableforFiles();
});

function setEntryDateToCurrent() {
    const currentDate = new Date().toISOString().split('T')[0];  // Get current date in YYYY-MM-DD format
    $('#entry_date').val(currentDate);  // Set the entry_date field
}


function initializeDataTableforFiles() {
    const filesTable = $('#file-table').DataTable({
        ajax: {
            url: "http://localhost:49200/api/get-files",
            dataSrc: function (json) {
                return json.data;
            }
        },
        columns: [
            { data: "entry_id" },
            { data: "entry_date" },
            { data: "file_number" },
            { data: "subject", render: function (data) { return truncate(data, 100); } },
            { data: "officer_assigned" },
            { data: "status" },
            {
                data: null,
                defaultContent: `
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
        ]
    });

    // Attach event listeners after table initialization
    attachFileTableListeners();

    // Search functionality
    $('#system-search').on('keyup', function () {
        filesTable.search(this.value).draw();
    });
}

// Event listeners using event delegation
function attachFileTableListeners() {
    // Edit button
    $('#file-table').on('click', 'button.view-file', function () {
        const row = $(this).closest('tr');
        const data = $('#file-table').DataTable().row(row).data();
        populateFileModalFields(data);
        $('#fileModalLabel').text('Edit Files');
        $('#save-file').addClass('d-none');
        $('#update-file').removeClass('d-none');
        $('#fileModal').modal('show');
    });

    // Delete button
    $('#file-table').on('click', 'button.delete-file', function () {
        const row = $(this).closest('tr');
        const data = $('#file-table').DataTable().row(row).data();
        if (confirm('Are you sure you want to delete this entry?')) {
            $.ajax({
                url: `http://localhost:49200/api/delete-file/${data.entry_id}`,
                type: 'DELETE',
                success: function (response) {
                    console.log("Entry deleted successfully:", response);
                    $('#file-table').DataTable().ajax.reload();
                    resetInputs();
                },
                error: function (xhr, status, error) {
                    console.error("Error deleting entry:", error);
                }
            });
        }
    });
}

function resetInputs() {
    document.querySelectorAll('input').forEach(input => {
        input.value = '';
        input.disabled = false;
    });
}

function setupFileModalActions() {
    $('#new-file').on('click', function () {
        clearFileModalFields();
        $('#fileModalLabel').text('Add New File');
        $('#save-file').removeClass('d-none');
        $('#update-file').addClass('d-none');
        $('#fileModal').modal('show');
        setEntryDateToCurrent();  // Set the entry date to current system date
        $('#entry_category').val('File');  // Ensure entry_category is set to "File"
    });

 
    // Remove existing event listeners and attach a new one for "Save"
    $('#save-file').off('click').on('click', function () {
        const fileData = getFileFormData();
        $.ajax({
            url: 'http://localhost:49200/api/add-file',
            type: 'POST',
            data: JSON.stringify(fileData),
            contentType: 'application/json',
            success: function (response) {
                console.log("File added successfully:", response);
                $('#fileModal').modal('hide');
                $('#file-table').DataTable().ajax.reload();
            },
            error: function (xhr, status, error) {
                console.error("Error adding file:", error);
            }
        });
    });

    // Remove existing event listeners and attach a new one for "Update"
    $('#update-file').off('click').on('click', function () {
        const fileData = getFileFormData();
        $.ajax({
            url: `http://localhost:49200/api/update-file/${fileData.entry_id}`,
            type: 'POST',
            data: JSON.stringify(fileData),
            contentType: 'application/json',
            success: function (response) {
                console.log("File updated successfully:", response);
                $('#fileModal').modal('hide');
                $('#file-table').DataTable().ajax.reload();
            },
            error: function (xhr, status, error) {
                console.error("Error updating file:", xhr.responseText);
            }
        });
    });
}

function populateFileModalFields(data) {
    $('#fileForm').data('entry_id', data.entry_id);  // Ensure entry_id is set

    // Set values to inputs
    $('#entry_date').val(data.entry_date);
    $('#fileNumber').val(data.file_number);
    $('#subject').val(data.subject);
    $('#officerAssigned').val(data.officer_assigned);
    $('#status').val(data.status);
    
    // File type, date sent, and recipient input fields
    $('#fileType').val(data.file_type);
    $('#dateSent').val(data.date_sent);
    $('#reciepientName').val(data.reciepient);

    // Additional fields
    $('#description').val(data.description);
}

function getFileFormData() {
    const data = {
        entry_id: $('#fileForm').data('entry_id'),
        entry_date: $('#entry_date').val(),  // Make sure entry_date is passed correctly
        file_number: $('#file_number').val(),
        subject: $('#subject').val(),
        officer_assigned: $('#officer_assigned').val(),
        status: $('#status').val(),
        // Additional fields
        file_type: $('#fileType').val(),
        date_sent: $('#dateSent').val(),
        reciepient: $('#reciepientName').val(),
        description: $('#description').val(),
    };
    return data;
}

function clearFileModalFields() {
    $('#fileForm').removeData('entry_id');
    $('#entryDate').val('');
    $('#fileNumber').val('');
    $('#subject').val('');
    $('#officerAssigned').val('');
    $('#status').val('');
    $('#fileType').val('');
    $('#dateSent').val('');
    $('#reciepientName').val('');
    $('#description').val('');
}

// Truncate function for long text
function truncate(str, num) {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '...';
}
