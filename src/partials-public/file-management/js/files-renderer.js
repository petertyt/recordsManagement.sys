$(document).ready(function () {
    setupFileModalActions();
    initializeDataTableforFiles();

});

function initializeDataTableforFiles() {
    const filesTable = $('#file-table').DataTable({
        ajax: {
            url: `${API_BASE_URL}/api/get-files`,
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

    $('#system-search').on('keyup', function () {
        filesTable.search(this.value).draw();
    });

    // Attach row click listeners after table is initialized
    $('#file-table tbody').on('click', 'button.view-file', function () {
        const row = $(this).closest('tr');
        const data = $('#file-table').DataTable().row(row).data();

        populateFileModalFields(data);
        $('#FileModalLabel').text('Edit Files');
        $('#save-file').addClass('d-none');
        $('#update-file').removeClass('d-none');
        $('#fileModal').modal('show');
    });

    // Store entry_id to be deleted when the modal is triggered
    let fileEntryToDelete = null;

    $('#file-table tbody').on('click', 'button.delete-file', function () {
        const row = $(this).closest('tr');
        const data = $('#file-table').DataTable().row(row).data();

        // Store the entry_id to delete
        fileEntryToDelete = data.entry_id;

        // Show the custom modal
        $('#deleteModal').modal('show');
    });

    // Handle the confirm button click inside the delete modal
    $('#confirmDelete').on('click', function () {
        if (fileEntryToDelete) {
            $.ajax({
                url: `${API_BASE_URL}/api/delete-file/${fileEntryToDelete}`,
                type: 'DELETE',
                success: function (response) {
                    console.log("File deleted successfully:", response);
                    $('#file-table').DataTable().ajax.reload();
                    $('#deleteModal').modal('hide');
                    fileEntryToDelete = null;
                },
                error: function (xhr, status, error) {
                    console.error("Error deleting file:", error);
                }
            });
        }
    });


}

function setupFileModalActions() {
    $('#new-file').on('click', function () {
        clearFileModalFields();
        $('#fileModalLabel').text('Add New File');
        $('#save-file').removeClass('d-none');
        $('#update-file').addClass('d-none');
        $('#fileModal').modal('show');
        setEntryDateToCurrent();
    });

    // Remove existing event listeners and attach a new one for "Save"
    $('#save-file').off('click').on('click', function () {
        const fileData = getFileFormData();
        $.ajax({
            url: `${API_BASE_URL}/api/add-file`,
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
            url: `${API_BASE_URL}/api/update-file`,
            type: 'POST',
            data: JSON.stringify(fileData),
            contentType: 'application/json',
            success: function (response) {
                console.log("File updated successfully:", response);
                $('#fileModal').modal('hide');
                $('#file-table').DataTable().ajax.reload();
            },
            error: function (xhr, status, error) {
                console.error("Error updating file:", error);
            }
        });
    });
}

function populateFileModalFields(data) {
    $('#fileForm').data('entry_id', data.entry_id);  // Ensure entry_id is set

    // Set values to inputs using IDs that match the HTML form
    $('#entry_date').val(data.entry_date);
    $('#file_number').val(data.file_number);
    $('#subject').val(data.subject);
    $('#officer_assigned').val(data.officer_assigned);
    $('#status').val(data.status);

    // File type, date sent, and recipient input fields
    $('#file_type').val(data.file_type);
    $('#date_sent').val(data.date_sent);
    $('#reciepient_name').val(data.reciepient);
    $('#recieved_date').val(data.recieved_date);  // Ensure this field is correctly populated

    // Additional fields
    $('#description').val(data.description);
}


function getFileFormData() {
    const data = {
        entry_id: $('#fileForm').data('entry_id'),
        entry_date: $('#entry_date').val(),
        file_number: $('#file_number').val(),
        subject: $('#subject').val(),
        officer_assigned: $('#officer_assigned').val(),
        status: $('#status').val(),
        recieved_date: $('#recieved_date').val(),
        date_sent: $('#date_sent').val(),
        file_type: $('#file_type').val(),
        reciepient: $('#reciepient_name').val(),
        description: $('#description').val(),
    };
    return data;
}


function clearFileModalFields() {
    $('#entry_date').val('');
    $('#file_number').val('');
    $('#subject').val('');
    $('#officer_assigned').val('');
    $('#recieved_date').val('');
    $('#date_sent').val('');
    $('#file_type').val('');
    $('#reciepient').val('');
    $('#description').val('');
    $('#status').val('');
    $('#fileForm').data('entry_id', null);
}

function setEntryDateToCurrent() {
    const today = new Date().toISOString().split('T')[0];
    $('#entry_date').val(today);
}
