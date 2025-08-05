$(document).ready(function () {
    $('#generate-report').on('click', function () {
        generateReport();
    });

    $('#export-pdf').on('click', function () {
        exportPDF();
    });

    $('#export-csv').on('click', function () {
        exportCSV();
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
    let reportHtml = '<table id="report-table" class="table table-striped table-bordered">';
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

// Function to export the report as a PDF using jsPDF and html2canvas
function exportPDF() {
    const reportTable = document.getElementById('report-table');
    if (!reportTable) {
        alert('No report generated to export.');
        return;
    }

    html2canvas(reportTable).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('report.pdf');
    });
}

// Function to export the report table as CSV
function exportCSV() {
    const table = document.getElementById('report-table');
    if (!table) {
        alert('No report generated to export.');
        return;
    }

    let csv = '';
    const rows = table.querySelectorAll('tr');
    rows.forEach((row) => {
        const cols = row.querySelectorAll('th, td');
        const rowData = Array.from(cols)
            .map(col => '"' + col.innerText.replace(/"/g, '""') + '"')
            .join(',');
        csv += rowData + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'report.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
