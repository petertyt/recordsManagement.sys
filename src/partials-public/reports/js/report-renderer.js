$(document).ready(function () {
    $('#generate-report').on('click', function () {
        generateReport();
    });

    $('#export-pdf').on('click', function () {
        exportPDF();
    });

    $('#print-report').on('click', function () {
        showPrintPreview();
    });

    $('#modal-print-button').on('click', function () {
        printOnlyReport();
    });
});

function showPrintPreview() {
    const reportContent = $('#report-content').html();
    $('#modal-report-content').html(reportContent); // Populate the modal with the report content
    $('#reportModal').modal('show'); // Show the modal
}

function printOnlyReport() {
    $('#reportModal').modal('hide'); // Hide modal before printing
    window.print(); // Trigger system print dialog
}

function generateReport() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();
    const officerAssigned = $('#officer-assigned').val();
    const fileNumber = $('#file-number').val();

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

// Function to export the report as a PDF using jsPDF
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Add logo (replace with actual base64 data or URL)
    const imgData = 'data:image/'; // Replace with your logo image data
    doc.addImage(imgData, 'PNG', 10, 10, 30, 30); // Add logo at the top-left (x, y, width, height)

    // Add header
    doc.setFontSize(14);
    doc.text('LANDS COMMISSION, GHANA', 105, 20, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Land Valuation Department (LVD)', 105, 30, { align: 'center' });
    doc.text('Files Office', 105, 40, { align: 'center' });
    doc.line(10, 45, 200, 45); // Horizontal line

    // Add report content
    const reportContent = document.getElementById('report-content');
    
    // Rendering the HTML content into the PDF using html2canvas and jsPDF
    doc.html(reportContent, {
        x: 10,
        y: 60,
        width: 190,
        callback: function (doc) {
            // Add footer with page number
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.text(`Page ${i} of ${totalPages}`, 105, 290, { align: 'center' });
            }
            doc.save('report.pdf'); // Save the PDF file
        }
    });
}
