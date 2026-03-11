// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const BRAND_COLOR = [59, 130, 246]; // Blue
const ACCENT = [241, 245, 249];
const PHP = 'PHP '; // jsPDF built-in fonts don't support the ₱ Unicode glyph

function addHeader(doc, title, subtitle) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 13);

    if (subtitle) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 14, 20);
    }

    doc.setTextColor(0, 0, 0);
    return 30; // Y position after header
}

function addFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, pageHeight - 8);
    }
}

/**
 * Export the full transactions list as a PDF table.
 */
export async function exportTransactionsPdf(sales) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let startY = addHeader(doc, 'Transaction Report', `Exported on ${dateStr}  |  ${sales.length} records`);

    // Summary bar
    const totalRevenue = sales.reduce((s, t) => s + t.total, 0);
    const borrowedCount = sales.filter(s => s.jugStatus === 'borrowed' && !s.jugReturned).length;
    const returnedCount = sales.filter(s => s.jugReturned).length;
    const summaryItems = [
        { label: 'Total Revenue', value: `${PHP}${totalRevenue.toLocaleString()}` },
        { label: 'Total Transactions', value: sales.length },
        { label: 'Borrowed Jugs Out', value: borrowedCount },
        { label: 'Jugs Returned', value: returnedCount },
    ];
    summaryItems.forEach((item, i) => {
        const x = 14 + i * 68;
        doc.setFillColor(...ACCENT);
        doc.roundedRect(x, startY, 64, 14, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(item.label.toUpperCase(), x + 4, startY + 5);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.value), x + 4, startY + 12);
        doc.setFont('helvetica', 'normal');
    });
    startY += 22;

    autoTable(doc, {
        startY,
        head: [['Order ID', 'Date & Time', 'Customer', 'Items', 'Payment', 'Jug Status', 'Total']],
        body: sales.map(s => [
            `#${s.id}`,
            new Date(s.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            s.customerName || 'Walk-in',
            s.items?.map(i => `${i.name} x${i.quantity}`).join(', ') || '-',
            s.paymentMethod || '-',
            s.jugReturned ? 'Returned' : s.jugStatus === 'borrowed' ? 'Borrowed' : s.jugStatus === 'owned' ? 'Owned' : 'None',
            `${PHP}${s.total.toLocaleString()}`,
        ]),
        headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: ACCENT },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 36 },
            3: { cellWidth: 58 },
            6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        didParseCell(data) {
            const val = data.cell.raw;
            if (data.section === 'body' && data.column.index === 5) {
                if (val === 'Borrowed') { data.cell.styles.textColor = [245, 158, 11]; data.cell.styles.fontStyle = 'bold'; }
                if (val === 'Returned') { data.cell.styles.textColor = [16, 185, 129]; data.cell.styles.fontStyle = 'bold'; }
            }
        }
    });

    addFooter(doc);
    doc.save(`Transactions_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Capture a DOM element as an image and export it in a PDF.
 * @param {HTMLElement} chartElement - the chart container DOM node
 * @param {string} monthLabel - e.g. "March 2026"
 * @param {number[]} chartData - array of daily totals to build a summary
 */
export async function exportChartPdf(chartElement, monthLabel, chartData) {
    const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let startY = addHeader(doc, `Daily Sales Chart - ${monthLabel}`, `Exported on ${new Date().toLocaleString()}`);

    // Compute summary from chartData
    const totalRevenue = chartData.reduce((s, d) => s + d.sales, 0);
    const peakDay = chartData.reduce((a, b) => (b.sales > a.sales ? b : a), { day: '-', sales: 0 });
    const activeDays = chartData.filter(d => d.sales > 0).length;
    const avgSales = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;

    const summaryItems = [
        { label: 'Total Revenue', value: `${PHP}${totalRevenue.toLocaleString()}` },
        { label: 'Peak Day', value: `Day ${peakDay.day} (${PHP}${peakDay.sales.toLocaleString()})` },
        { label: 'Active Days', value: activeDays },
        { label: 'Avg Daily Sales', value: `${PHP}${avgSales.toLocaleString()}` },
    ];
    summaryItems.forEach((item, i) => {
        const x = 14 + i * 46;
        doc.setFillColor(...ACCENT);
        doc.roundedRect(x, startY, 42, 14, 2, 2, 'F');
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(item.label.toUpperCase(), x + 3, startY + 5);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.value), x + 3, startY + 12);
        doc.setFont('helvetica', 'normal');
    });
    startY += 22;

    // Fit image to page width
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    doc.addImage(imgData, 'PNG', margin, startY, imgWidth, imgHeight);

    // Day-by-day table below chart — Activity column removed
    const tableStartY = startY + imgHeight + 6;
    const rows = chartData.map(d => [
        `Day ${d.day}`,
        d.sales > 0 ? `${PHP}${d.sales.toLocaleString()}` : '-',
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: [['Day', 'Sales']],
        body: rows,
        headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: ACCENT },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
            1: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
    });

    addFooter(doc);
    doc.save(`Sales_Chart_${monthLabel.replace(' ', '_')}.pdf`);
}
