document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generate-report').addEventListener('click', () => {
        generateReport();
    });

    document.getElementById('export-pdf').addEventListener('click', () => {
        exportPDF();
    });
});

async function generateReport() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const officerAssigned = document.getElementById('officer-assigned').value;
    const status = document.getElementById('status').value;
    const fileNumber = document.getElementById('file-number').value;
    const category = document.getElementById('category').value;

    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        officer_assigned: officerAssigned,
        status: status,
        file_number: fileNumber,
        category: category
    });

    try {
        const response = await fetch(`http://localhost:49200/api/make-reports?${params.toString()}`);
        const data = await response.json();
        document.getElementById('report-content').innerHTML = renderReport(data);
    } catch (error) {
        alert('Failed to generate report.');
    }
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

    // // Add logo (replace with actual base64 data or URL)
    // const imgData = 'data:image/png;base64,<your_base64_encoded_image>'; // Add your base64 logo here
    // doc.addImage(imgData, 'PNG', 10, 10, 30, 30); // Add logo at the top-left (x, y, width, height)

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
