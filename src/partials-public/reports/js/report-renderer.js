$(document).ready(function () {
    $('#generate-report').on('click', function () {
        generateReport();
    });

    $('#export-pdf').on('click', function () {
        exportPDF();
    });
});

function generateReport() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();
    const officerAssigned = $('#officer-assigned').val();
    const status = $('#status').val();
    const fileNumber = $('#file-number').val();
    const category = $('#category').val();

    $.ajax({
        url: 'http://localhost:49200/api/make-reports',
        method: 'GET',
        data: {
            start_date: startDate,
            end_date: endDate,
            officer_assigned: officerAssigned,
            status: status,
            file_number: fileNumber,
            category: category
        },
        success: function (data) {
            $('#report-content').html(renderReport(data));
        },
        error: function () {
            alert('Failed to generate report.');
        }
    });
}

function renderReport(data) {
    let reportHtml = '<table class="table table-striped table-bordered">';
    reportHtml += '<thead><tr><th>Entry ID</th><th>Date</th><th>Category</th><th>File Number</th><th>Subject</th><th>Officer Assigned</th><th>Status</th></tr></thead>';
    reportHtml += '<tbody>';
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
    reportHtml += '</tbody></table>';
    return reportHtml;
}

// Function to export the report via server
function exportPDF() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();
    const officerAssigned = $('#officer-assigned').val();
    const status = $('#status').val();
    const fileNumber = $('#file-number').val();
    const category = $('#category').val();

    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        officer_assigned: officerAssigned,
        status: status,
        file_number: fileNumber,
        category: category,
        format: 'pdf'
    });

    fetch(`http://localhost:49200/api/reports/export?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'report.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(() => {
            alert('Failed to export report.');
        });
}
