/**
 * Universal PDF Statement Generator for MK Exotic Fruits
 * Generates professional, clean A4 accounting statements for Customers & Vendors.
 */

import { Bill, VendorPayment, VendorAuditItem } from './types';
import { formatINR } from './math';

export async function generateCustomerMonthlyPDF(
  customerName: string,
  monthStr: string,
  bills: Bill[],
  settlementStatus: 'PAID' | 'UNPAID'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = 210;
  const M = 15;
  const CW = PW - M * 2;

  let y = M;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('MK EXOTIC FRUITS', M, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Merchant & Premium Wholesale Supplier', M, y + 12);
  doc.text('Contact: +91 7095952746, +91 9912100889', M, y + 16);

  // Statement Badge / Right Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('CUSTOMER STATEMENT', PW - M, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Billing Month: ${monthStr}`, PW - M, y + 12, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, PW - M, y + 16, { align: 'right' });

  y += 24;

  // Horizontal Rule
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(M, y, PW - M, y);
  y += 8;

  // Customer & Status Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(M, y, CW, 18, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Customer: ${customerName}`, M + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total Bills Logged: ${bills.length}`, M + 6, y + 14);

  // Status
  const isPaid = settlementStatus === 'PAID';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isPaid ? 16 : 225, isPaid ? 185 : 29, isPaid ? 129 : 72);
  doc.text(`STATUS: ${settlementStatus}`, PW - M - 6, y + 11, { align: 'right' });

  y += 26;

  // Table Headers
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(M, y, CW, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Date', M + 4, y + 5.5);
  doc.text('Bill #', M + 35, y + 5.5);
  doc.text('Description', M + 70, y + 5.5);
  doc.text('Amount (INR)', PW - M - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows
  let totalAmount = 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (let i = 0; i < bills.length; i++) {
    const b = bills[i];
    totalAmount += b.amount;

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(M, y, CW, 7.5, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(b.date || '-', M + 4, y + 5);
    doc.text(b.billNumber ? `#${b.billNumber}` : '-', M + 35, y + 5);
    doc.text('Produce Sales Delivery', M + 70, y + 5);
    doc.text(formatINR(b.amount, false), PW - M - 4, y + 5, { align: 'right' });

    y += 7.5;

    // Page overflow safety
    if (y > 270) {
      doc.addPage();
      y = M;
    }
  }

  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(M, y, PW - M, y);
  y += 6;

  // Total Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(PW - M - 75, y, 75, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Monthly Due:', PW - M - 70, y + 8);

  doc.setFontSize(14);
  doc.setTextColor(isPaid ? 16 : 225, isPaid ? 185 : 29, isPaid ? 129 : 72);
  doc.text(formatINR(totalAmount), PW - M - 5, y + 16, { align: 'right' });

  const cleanName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`MK_Customer_${cleanName}_${monthStr}.pdf`);
}

export async function generateVendorLifetimeAuditPDF(
  vendorName: string,
  contactNumber: string | undefined,
  auditTimeline: VendorAuditItem[],
  totalPurchases: number,
  totalPaid: number,
  remainingDue: number
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = 210;
  const M = 15;
  const CW = PW - M * 2;

  let y = M;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('MK EXOTIC FRUITS', M, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Merchant & Wholesale Produce Supplier', M, y + 12);
  doc.text('Contact: +91 7095952746, +91 9912100889', M, y + 16);

  // Statement Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('VENDOR LIFETIME AUDIT', PW - M, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Type: Continuous Cumulative Ledger', PW - M, y + 12, { align: 'right' });
  doc.text(`Audit Date: ${new Date().toLocaleDateString('en-IN')}`, PW - M, y + 16, { align: 'right' });

  y += 24;

  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, PW - M, y);
  y += 8;

  // Vendor Overview Strip
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, CW, 20, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Vendor: ${vendorName}`, M + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Contact: ${contactNumber || 'Not specified'}`, M + 6, y + 14);

  // 3-Stat Summary inside PDF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Purchases:', PW - M - 68, y + 8);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(totalPurchases), PW - M - 68, y + 14);

  doc.setTextColor(100, 116, 139);
  doc.text('Paid:', PW - M - 40, y + 8);
  doc.setTextColor(16, 185, 129);
  doc.text(formatINR(totalPaid), PW - M - 40, y + 14);

  doc.setTextColor(100, 116, 139);
  doc.text('Remaining Due:', PW - M - 15, y + 8, { align: 'right' });
  doc.setTextColor(remainingDue > 0 ? 225 : 16, remainingDue > 0 ? 29 : 185, remainingDue > 0 ? 72 : 129);
  doc.text(formatINR(remainingDue), PW - M - 6, y + 14, { align: 'right' });

  y += 28;

  // Table Headers
  doc.setFillColor(30, 41, 59);
  doc.rect(M, y, CW, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Date', M + 4, y + 5.5);
  doc.text('Type & Description', M + 30, y + 5.5);
  doc.text('Purchase (+)', PW - M - 60, y + 5.5, { align: 'right' });
  doc.text('Paid (-)', PW - M - 32, y + 5.5, { align: 'right' });
  doc.text('Running Due', PW - M - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Render Chronological Timeline (oldest first for audit statement)
  const chronological = [...auditTimeline].reverse();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  for (let i = 0; i < chronological.length; i++) {
    const item = chronological[i];
    const isBill = item.type === 'bill';

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(M, y, CW, 7, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(item.date || '-', M + 4, y + 4.8);
    doc.text(item.description, M + 30, y + 4.8);

    if (isBill) {
      doc.setTextColor(225, 29, 72); // Rose
      doc.text(formatINR(item.debit, false), PW - M - 60, y + 4.8, { align: 'right' });
      doc.setTextColor(148, 163, 184);
      doc.text('-', PW - M - 32, y + 4.8, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('-', PW - M - 60, y + 4.8, { align: 'right' });
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(formatINR(item.credit, false), PW - M - 32, y + 4.8, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatINR(item.runningBalance, false), PW - M - 4, y + 4.8, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 7;

    if (y > 270) {
      doc.addPage();
      y = M;
    }
  }

  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(M, y, PW - M, y);
  y += 6;

  // Final Closing Balance
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(PW - M - 80, y, 80, 20, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Final Outstanding Due:', PW - M - 75, y + 7.5);

  doc.setFontSize(14);
  doc.setTextColor(remainingDue > 0 ? 225 : 16, remainingDue > 0 ? 29 : 185, remainingDue > 0 ? 72 : 129);
  doc.text(formatINR(remainingDue), PW - M - 5, y + 15.5, { align: 'right' });

  const cleanName = vendorName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`MK_Vendor_Audit_${cleanName}.pdf`);
}
