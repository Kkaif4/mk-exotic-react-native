//ignore import
import { Bill, BillType } from '@/types/bill';

/**
 * Generates a clean, industrial A4 monthly statement PDF.
 * No colour banners — plain black/white professional layout.
 */
export async function generateMonthlyPDF(
  entityName: string,
  type: BillType,
  monthStr: string,
  bills: Bill[]
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;
  const M = 20; // margin
  const CW = PW - M * 2; // content width

  // Colours
  const BLACK: [number, number, number] = [0, 0, 0];
  const DARK: [number, number, number] = [30, 30, 30];
  const GREY: [number, number, number] = [110, 110, 110];
  const LIGHT: [number, number, number] = [180, 180, 180];
  const WHITE: [number, number, number] = [255, 255, 255];
  const ROW_ALT: [number, number, number] = [246, 246, 246];
  const HEADER_BG: [number, number, number] = [35, 35, 35];

  // Helpers
  const fmtMonth = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  const fmtCurrency = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}-${m}-${y}`;
  };

  let y = M;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER — company name, rule, document title
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
    PW - M, y + 3,
    { align: 'right' }
  );

  y += 20;

  // Thin rule
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);

  y += 6;

  // Document title
  const docTitle = type === 'sale' ? 'CUSTOMER STATEMENT' : 'VENDOR STATEMENT';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(docTitle, M, y);

  y += 8;

  // ═══════════════════════════════════════════════════════════════════════════
  // INFO BLOCK — name + period
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text(type === 'sale' ? 'Customer:' : 'Vendor:', M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text(entityName, M + 22, y);

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

  // Column positions
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
  doc.text('Amount', COL_AMT, y + 6, { align: 'right' });

  y += HDR_H;

  const sortedBills = [...bills].sort((a, b) => a.date.localeCompare(b.date));

  // Data rows
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
        doc.addPage();
        y = M;
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

      doc.setFont('helvetica', 'normal');
      doc.text(fmtCurrency(bill.amount), COL_AMT, y + 5.5, { align: 'right' });

      y += ROW_H;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTAL ROW
  // ═══════════════════════════════════════════════════════════════════════════

  const total = bills.reduce((s, b) => s + b.amount, 0);

  // Top border (thick)
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);

  y += 1;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('TOTAL', M + 4, y + 6);
  doc.text(fmtCurrency(total), COL_AMT, y + 6, { align: 'right' });

  y += 8;

  // Bottom border (double line)
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);
  doc.setLineWidth(0.3);
  doc.line(M, y + 1.2, PW - M, y + 1.2);

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  const footerY = PH - 14;
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.2);
  doc.line(M, footerY, PW - M, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text('MK Exotic Fruits — System-generated document', M, footerY + 4);
  doc.text('Page 1', PW - M, footerY + 4, { align: 'right' });

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const safeName = entityName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `MK_${safeName}_${monthStr}.pdf`;
  const pdfBlob = doc.output('blob');

  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await Filesystem.writeFile({
          path: `MKExoticFruits/${filename}`,
          data: base64,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
        alert(`PDF saved!\nDownloads/MKExoticFruits/${filename}`);
      };
    } catch (e: any) {
      alert('PDF save failed: ' + e?.message);
    }
  } else {
    doc.save(filename);
  }
}
