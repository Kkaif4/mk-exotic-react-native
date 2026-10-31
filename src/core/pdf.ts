/**
 * Universal PDF Statement Generator for MK Exotic Fruits
 * Industrial A4 layout matching official specification in sample_pdf.ts.
 * Clean, high-legibility black & white accounting format with precise typography.
 */

import { Bill, VendorAuditItem } from './types';

// Palette constants matching sample_pdf.ts
const BLACK: [number, number, number] = [0, 0, 0];
const DARK: [number, number, number] = [30, 30, 30];
const GREY: [number, number, number] = [110, 110, 110];
const LIGHT: [number, number, number] = [180, 180, 180];
const WHITE: [number, number, number] = [255, 255, 255];
const ROW_ALT: [number, number, number] = [246, 246, 246];
const HEADER_BG: [number, number, number] = [35, 35, 35];

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
};

const fmtCurrency = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) => {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}-${m}-${y}`;
  }
  return d;
};

/**
 * Generates an industrial A4 Customer Monthly Statement PDF matching sample_pdf.ts format
 */
export async function generateCustomerMonthlyPDF(
  customerName: string,
  monthStr: string,
  bills: Bill[],
  settlementStatus: 'PAID' | 'UNPAID'
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;
  const M = 20; // 20mm margin
  const CW = PW - M * 2;

  let y = M;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER — company name, contact, date, rule, document title
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BLACK);
  doc.text('MK EXOTIC FRUITS', M, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Merchant and Supplier', M, y + 11);
  doc.text('Contact: +917095952746, +919912100889', M, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(
    `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    PW - M,
    y + 3,
    { align: 'right' }
  );

  y += 20;

  // Thin rule
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);

  y += 6;

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text('CUSTOMER MONTHLY STATEMENT', M, y);

  y += 8;

  // ═══════════════════════════════════════════════════════════════════════════
  // INFO BLOCK — customer name, period, status, entries
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Customer:', M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text(customerName, M + 22, y);

  // Status Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (settlementStatus === 'PAID') {
    doc.setTextColor(38, 148, 91); // Green
  } else {
    doc.setTextColor(217, 74, 80); // Red
  }
  doc.text(`STATUS: ${settlementStatus}`, PW - M, y, { align: 'right' });

  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Period:', M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(fmtMonth(monthStr), M + 22, y);

  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Total Entries:', M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(String(bills.length), M + 22, y);

  y += 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE
  // ═══════════════════════════════════════════════════════════════════════════

  const COL_NO = M + 2;
  const COL_DATE = M + 14;
  const COL_BILL = M + 46;
  const COL_AMT = PW - M - 3; // right-aligned

  const ROW_H = 8;
  const HDR_H = 9;

  // Outer box top line
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.4);
  doc.line(M, y, PW - M, y);

  // Header row
  doc.setFillColor(...HEADER_BG);
  doc.rect(M, y, CW, HDR_H, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('#', COL_NO, y + 6);
  doc.text('Date', COL_DATE, y + 6);
  doc.text('Bill Number', COL_BILL, y + 6);
  doc.text('Amount (INR)', COL_AMT, y + 6, { align: 'right' });

  y += HDR_H;

  const sortedBills = [...bills].sort((a, b) => a.date.localeCompare(b.date));

  let pageNum = 1;

  if (sortedBills.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text('No bills recorded for this period.', M + 4, y + 6);
    y += 12;
  } else {
    sortedBills.forEach((bill, i) => {
      // Page break check
      if (y > PH - 45) {
        // Bottom border before page break
        doc.setDrawColor(...DARK);
        doc.setLineWidth(0.4);
        doc.line(M, y, PW - M, y);

        // Footer on previous page
        renderFooter(doc, PW, PH, M, pageNum);
        pageNum++;

        doc.addPage();
        y = M;

        // Redraw table header on new page
        doc.setFillColor(...HEADER_BG);
        doc.rect(M, y, CW, HDR_H, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...WHITE);
        doc.text('#', COL_NO, y + 6);
        doc.text('Date', COL_DATE, y + 6);
        doc.text('Bill Number', COL_BILL, y + 6);
        doc.text('Amount (INR)', COL_AMT, y + 6, { align: 'right' });
        y += HDR_H;
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(...ROW_ALT);
        doc.rect(M, y, CW, ROW_H, 'F');
      }

      // Left/right vertical borders
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(M, y, M, y + ROW_H);
      doc.line(PW - M, y, PW - M, y + ROW_H);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);

      doc.text(String(i + 1), COL_NO, y + 5.5);
      doc.text(fmtDate(bill.date), COL_DATE, y + 5.5);
      doc.text(bill.billNumber || '-', COL_BILL, y + 5.5);
      doc.text(fmtCurrency(bill.amount), COL_AMT, y + 5.5, { align: 'right' });

      y += ROW_H;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTAL ROW
  // ═══════════════════════════════════════════════════════════════════════════

  const total = sortedBills.reduce((s, b) => s + b.amount, 0);

  // Top border (thick)
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);

  y += 1;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('TOTAL MONTHLY DUE', M + 4, y + 6);
  doc.text(fmtCurrency(total), COL_AMT, y + 6, { align: 'right' });

  y += 8;

  // Bottom border (double line)
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);
  doc.setLineWidth(0.3);
  doc.line(M, y + 1.2, PW - M, y + 1.2);

  // Render footer on final page
  renderFooter(doc, PW, PH, M, pageNum);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const safeName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `MK_${safeName}_${monthStr}.pdf`;
  doc.save(filename);
}

/**
 * Generates an industrial A4 Vendor Lifetime Audit PDF matching sample_pdf.ts format
 */
export async function generateVendorLifetimeAuditPDF(
  vendorName: string,
  contactNumber: string | undefined,
  totalPurchases: number,
  totalPaid: number,
  remainingDue: number,
  auditTimeline: VendorAuditItem[]
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;
  const M = 20; // 20mm margin
  const CW = PW - M * 2;

  let y = M;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BLACK);
  doc.text('MK EXOTIC FRUITS', M, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Merchant and Supplier', M, y + 11);
  doc.text('Contact: +917095952746, +919912100889', M, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(
    `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    PW - M,
    y + 3,
    { align: 'right' }
  );

  y += 20;

  // Thin rule
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);

  y += 6;

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text('VENDOR LIFETIME AUDIT STATEMENT', M, y);

  y += 8;

  // ═══════════════════════════════════════════════════════════════════════════
  // INFO BLOCK — vendor name, contact, 3-stat financial summary
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Vendor:', M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text(vendorName, M + 22, y);

  // Remaining Due on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  if (remainingDue > 0) {
    doc.setTextColor(217, 74, 80); // Red
    doc.text(`REMAINING DUE: ₹${fmtCurrency(remainingDue)}`, PW - M, y, { align: 'right' });
  } else {
    doc.setTextColor(38, 148, 91); // Green
    doc.text('STATUS: FULLY SETTLED', PW - M, y, { align: 'right' });
  }

  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Contact:', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(contactNumber || 'Not specified', M + 22, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text(`Purchases: ₹${fmtCurrency(totalPurchases)}  |  Paid: ₹${fmtCurrency(totalPaid)}`, PW - M, y, { align: 'right' });

  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text('Audit Type:', M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text('Continuous Cumulative Ledger (No Month Filter)', M + 22, y);

  y += 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE
  // ═══════════════════════════════════════════════════════════════════════════

  const COL_NO = M + 2;
  const COL_DATE = M + 12;
  const COL_DESC = M + 36;
  const COL_DEBIT = PW - M - 58;  // Purchase (+)
  const COL_CREDIT = PW - M - 30; // Paid (-)
  const COL_BAL = PW - M - 3;     // Running Due

  const ROW_H = 8;
  const HDR_H = 9;

  // Outer box top line
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.4);
  doc.line(M, y, PW - M, y);

  // Header row
  doc.setFillColor(...HEADER_BG);
  doc.rect(M, y, CW, HDR_H, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('#', COL_NO, y + 6);
  doc.text('Date', COL_DATE, y + 6);
  doc.text('Description / Ref', COL_DESC, y + 6);
  doc.text('Purchase (+)', COL_DEBIT, y + 6, { align: 'right' });
  doc.text('Paid (-)', COL_CREDIT, y + 6, { align: 'right' });
  doc.text('Running Due', COL_BAL, y + 6, { align: 'right' });

  y += HDR_H;

  // Chronological order: Oldest first for continuous audit history
  const chronological = [...auditTimeline].reverse();

  let pageNum = 1;

  if (chronological.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text('No ledger transactions recorded for this vendor.', M + 4, y + 6);
    y += 12;
  } else {
    chronological.forEach((item, i) => {
      // Page break check
      if (y > PH - 45) {
        doc.setDrawColor(...DARK);
        doc.setLineWidth(0.4);
        doc.line(M, y, PW - M, y);

        renderFooter(doc, PW, PH, M, pageNum);
        pageNum++;

        doc.addPage();
        y = M;

        // Redraw table header
        doc.setFillColor(...HEADER_BG);
        doc.rect(M, y, CW, HDR_H, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...WHITE);
        doc.text('#', COL_NO, y + 6);
        doc.text('Date', COL_DATE, y + 6);
        doc.text('Description / Ref', COL_DESC, y + 6);
        doc.text('Purchase (+)', COL_DEBIT, y + 6, { align: 'right' });
        doc.text('Paid (-)', COL_CREDIT, y + 6, { align: 'right' });
        doc.text('Running Due', COL_BAL, y + 6, { align: 'right' });
        y += HDR_H;
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(...ROW_ALT);
        doc.rect(M, y, CW, ROW_H, 'F');
      }

      // Left/right vertical borders
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(M, y, M, y + ROW_H);
      doc.line(PW - M, y, PW - M, y + ROW_H);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);

      doc.text(String(i + 1), COL_NO, y + 5.5);
      doc.text(fmtDate(item.date), COL_DATE, y + 5.5);

      const descSnippet =
        item.description.length > 25
          ? item.description.substring(0, 24) + '…'
          : item.description;
      doc.text(descSnippet, COL_DESC, y + 5.5);

      if (item.debit > 0) {
        doc.text(fmtCurrency(item.debit), COL_DEBIT, y + 5.5, { align: 'right' });
      } else {
        doc.text('-', COL_DEBIT, y + 5.5, { align: 'right' });
      }

      if (item.credit > 0) {
        doc.setTextColor(38, 148, 91);
        doc.text(fmtCurrency(item.credit), COL_CREDIT, y + 5.5, { align: 'right' });
        doc.setTextColor(...DARK);
      } else {
        doc.text('-', COL_CREDIT, y + 5.5, { align: 'right' });
      }

      doc.setFont('helvetica', 'bold');
      doc.text(fmtCurrency(item.runningBalance), COL_BAL, y + 5.5, { align: 'right' });

      y += ROW_H;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTAL / FINAL POSITION ROW
  // ═══════════════════════════════════════════════════════════════════════════

  // Top border (thick)
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);

  y += 1;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text('LIFETIME POSITION', M + 4, y + 6);
  doc.text(fmtCurrency(totalPurchases), COL_DEBIT, y + 6, { align: 'right' });
  doc.text(fmtCurrency(totalPaid), COL_CREDIT, y + 6, { align: 'right' });
  doc.text(fmtCurrency(remainingDue), COL_BAL, y + 6, { align: 'right' });

  y += 8;

  // Bottom border (double line)
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);
  doc.setLineWidth(0.3);
  doc.line(M, y + 1.2, PW - M, y + 1.2);

  // Render footer
  renderFooter(doc, PW, PH, M, pageNum);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const safeName = vendorName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `MK_${safeName}_Lifetime_Audit.pdf`;
  doc.save(filename);
}

function renderFooter(
  doc: any,
  PW: number,
  PH: number,
  M: number,
  pageNum: number
) {
  const footerY = PH - 14;
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.2);
  doc.line(M, footerY, PW - M, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text('MK Exotic Fruits — System-generated document', M, footerY + 4);
  doc.text(`Page ${pageNum}`, PW - M, footerY + 4, { align: 'right' });
}
