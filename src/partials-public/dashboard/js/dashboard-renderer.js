// Define the truncate function
function truncate(str, maxlength) {
    return (str.length > maxlength) ?
        str.slice(0, maxlength - 1) + '…' : str;
}

$(document).ready(function () {
    // Initialize components on page load
    initializeDataTable();
    fetchSummations();

    // Attach refresh button click event dynamically
    $(document).on('click', '#refresh-btn', function () {
        $(this).addClass('rotate'); // Add the rotation class on click

        // Trigger the page reload after the rotation animation
        setTimeout(() => {
            $(this).removeClass('rotate');
            location.reload(); // Reload the entire page
        }, 500); // Timeout matches the CSS transition duration
    });

    function fetchSummations() {
        $.ajax({
            url: 'http://localhost:49200/api/summations',
            type: 'GET',
            success: function (data) {
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
                $('#recentEntriesTable').DataTable().ajax.reload();
            },
            error: function (xhr, status, error) {
                console.error("Error updating entry:", error);
            }
        });
    });
});

function initializeDataTable() {
    $('#recentEntriesTable').DataTable({
        "ajax": {
            "url": "http://localhost:49200/api/recent-entries",
            "dataSrc": function (json) {
                console.log("AJAX Response:", json);
                return json.data;
            }
        },
        "columns": [
            { "data": "entry_id" },
            { "data": "entry_date" },
            { "data": "entry_category" },
            { "data": "file_number" },
            { 
                "data": "subject",
                "render": function(data, type, row) {
                    return truncate(data, 60);
                }
            },
            { "data": "officer_assigned" },
            { "data": "status" }
        ],
        "initComplete": function () {
            attachRowClickListener();
        }
    });
}

function attachRowClickListener() {
    $('#recentEntriesTable tbody').off('click', 'tr').on('click', 'tr', function () {
        const data = $('#recentEntriesTable').DataTable().row(this).data();
        $('#file_number').val(data.file_number);
        $('#subject').val(data.subject);
        $('#officer_assigned').val(data.officer_assigned);
        $('#entry_id').val(data.entry_id);
        $('#status').val(data.status);
        $('#entryModal').modal('show');
    });
}
