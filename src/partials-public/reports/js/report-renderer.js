$(document).ready(function () {
    console.log('jQuery is ready');

    $('#generate-report').on('click', function () {
        console.log('Generate Report button clicked');
        generateReport();
    });

    $('#export-pdf').on('click', function () {
        console.log('Export as PDF button clicked');
        exportPDF();
    });

    // Show modal with report content on Print Report button click
    $('#print-report').on('click', function () {
        console.log('Print Report button clicked');
        showPrintPreview();
    });

    // Handle the print button inside the modal
    $('#modal-print-button').on('click', function () {
        printOnlyReport();
    });
});

function showPrintPreview() {
    const reportContent = $('#report-content').html();
    $('#modal-report-content').html(reportContent); // Populate the modal with the report content
    $('#reportModal').modal('show'); // Show the modal

    console.log('Print preview shown with content:', reportContent); // Debugging statement
}

function printOnlyReport() {
    const printContent = $('#modal-report-content').html(); // Get the content from the modal
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent; // Replace the body with the report content
    window.print(); // Print the report
    document.body.innerHTML = originalContent; // Restore the original content

    // Reinitialize necessary elements or functions if needed
    $(document).ready(function () {
        // Reattach event listeners if needed
    });
}

function generateReport() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();
    const officerAssigned = $('#officer-assigned').val();
    const fileNumber = $('#file-number').val();

    console.log('Generating report with:', { startDate, endDate, officerAssigned, fileNumber });

    $.ajax({
        url: 'http://localhost:49200/api/make-reports',
        method: 'GET',
        data: {
            start_date: startDate,
            end_date: endDate,
            officer_assigned: officerAssigned,
            file_number: fileNumber
        },
        success: function (data) {
            console.log('Report data fetched successfully', data);
            $('#report-content').html(renderReport(data));
        },
        error: function (error) {
            console.error('Error fetching report data:', error);
            alert('Failed to generate report. Please check the console for more details.');
        }
    });
}

function renderReport(data) {
    let reportHtml = '<table class="table table-striped">';
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

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('Generated Report', 10, 10);
    doc.fromHTML($('#report-content').html(), 10, 20);
    doc.save('report.pdf');
}
