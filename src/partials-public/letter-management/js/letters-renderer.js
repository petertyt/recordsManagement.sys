import { truncate } from '../../../../public/index/js/utils.js';

$(document).ready(function () {
    setupLetterModalActions();
    initializeDataTableforLetters();
});

function initializeDataTableforLetters() {
    const lettersTable = $('#letters-table').DataTable({
        ajax: {
            url: "http://localhost:49200/api/get-letters",
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
                    <button class="btn btn-sm btn-info view-letter">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg> 
                    Edit
                    </button>
                    <button class="btn btn-sm btn-danger delete-letter">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zm4.5 1.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                </svg>
                    </button>`
            }
        ]
    });

    $('#system-search').on('keyup', function () {
        lettersTable.search(this.value).draw();
    });

    // Attach row click listeners after table is initialized
    $('#letters-table tbody').on('click', 'button.view-letter', function () {
        const row = $(this).closest('tr');
        const data = $('#letters-table').DataTable().row(row).data();

        populateLetterModalFields(data);
        $('#letterModalLabel').text('Edit Letter');
        $('#save-letter').addClass('d-none');
        $('#update-letter').removeClass('d-none');
        $('#letterModal').modal('show');
    });

      let letterEntryToDelete = null;

    // Trigger the custom delete modal
    $('#letters-table tbody').on('click', 'button.delete-letter', function () {
        const row = $(this).closest('tr');
        const data = $('#letters-table').DataTable().row(row).data();

        // Store the entry_id to delete
        letterEntryToDelete = data.entry_id;

        // Show the custom delete modal
        $('#deleteModal').modal('show');
    });

    // Handle delete confirmation
    $('#confirmDelete').on('click', function () {
        if (letterEntryToDelete) {
            $.ajax({
                url: `http://localhost:49200/api/delete-letter/${letterEntryToDelete}`,
                type: 'DELETE',
                success: function (result) {
                    // Reload DataTable and hide the modal
                    $('#letters-table').DataTable().ajax.reload();
                    $('#deleteModal').modal('hide');
                    letterEntryToDelete = null;

                    // Optional success message
                    console.log('Letter deleted successfully!', response);
                },
                error: function (xhr, status, error) {
                    // Handle errors
                    console.error("Error deleting letter:", error);
                }
            });
        }
    });

}

function setupLetterModalActions() {
    $('#new-letter').on('click', function () {
        clearLetterModalFields();
        $('#letterModalLabel').text('Add New Letter');
        $('#save-letter').removeClass('d-none');
        $('#update-letter').addClass('d-none');
        $('#letterModal').modal('show');
        setEntryDateToCurrent();
    });

    // Remove existing event listeners and attach a new one for "Save"
    $('#save-letter').off('click').on('click', function () {
        const letterData = getLetterFormData();
        $.ajax({
            url: 'http://localhost:49200/api/add-letter',
            type: 'POST',
            data: JSON.stringify(letterData),
            contentType: 'application/json',
            success: function (response) {
                console.log("Letter added successfully:", response);
                $('#letterModal').modal('hide');
                $('#letters-table').DataTable().ajax.reload();
            },
            error: function (xhr, status, error) {
                console.error("Error adding letter:", error);
            }
        });
    });

    // Remove existing event listeners and attach a new one for "Update"
    $('#update-letter').off('click').on('click', function () {
        const letterData = getLetterFormData();
        $.ajax({
            url: 'http://localhost:49200/api/update-letter',
            type: 'POST',
            data: JSON.stringify(letterData),
            contentType: 'application/json',
            success: function (response) {
                console.log("Letter updated successfully:", response);
                $('#letterModal').modal('hide');
                $('#letters-table').DataTable().ajax.reload();
            },
            error: function (xhr, status, error) {
                console.error("Error updating letter:", error);
            }
        });
    });
}

function populateLetterModalFields(data) {
    $('#entry_date').val(data.entry_date);
    $('#file_number').val(data.file_number);
    $('#subject').val(data.subject);
    $('#officer_assigned').val(data.officer_assigned);
    $('#recieved_date').val(data.recieved_date);
    $('#letter_date').val(data.letter_date);
    $('#letter_type').val(data.letter_type);
    $('#folio_number').val(data.folio_number);
    $('#description').val(data.description);
    $('#status').val(data.status);
    // Set the entry_id in a hidden field
    $('#letterForm').data('entry_id', data.entry_id);
}

function getLetterFormData() {
    return {
        entry_id: $('#letterForm').data('entry_id'),
        entry_date: $('#entry_date').val(),
        file_number: $('#file_number').val(),
        subject: $('#subject').val(),
        officer_assigned: $('#officer_assigned').val(),
        status: $('#status').val(),
        recieved_date: $('#recieved_date').val(),
        letter_date: $('#letter_date').val(),
        letter_type: $('#letter_type').val(),
        folio_number: $('#folio_number').val() || null,
        description: $('#description').val() || null,
    };
}

function clearLetterModalFields() {
    $('#entry_date').val('');
    $('#file_number').val('');
    $('#subject').val('');
    $('#officer_assigned').val('');
    $('#recieved_date').val('');
    $('#letter_date').val('');
    $('#letter_type').val('');
    $('#folio_number').val('');
    $('#description').val('');
    $('#status').val('');
    $('#letterForm').data('entry_id', null);
}

function setEntryDateToCurrent() {
    const today = new Date().toISOString().split('T')[0];
    $('#entry_date').val(today);
}
