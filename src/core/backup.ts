/**
 * Universal Backup, JSON Sync & CSV Exporter for MK Exotic Fruits
 */

import { Bill, MonthlySettlement, Vendor, VendorPayment } from './types';
import { defaultStorage } from '../storage/local-storage';

function triggerBrowserDownload(content: string, filename: string, mimeType: string) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportFullJSONBackup(): Promise<void> {
  const packet = await defaultStorage.exportJSON();
  const dateStr = new Date().toISOString().substring(0, 10);
  const jsonStr = JSON.stringify(packet, null, 2);
  triggerBrowserDownload(
    jsonStr,
    `mk_exotic_backup_${dateStr}.json`,
    'application/json;charset=utf-8;'
  );
}

export async function importJSONBackup(
  jsonString: string
): Promise<{ success: boolean; error?: string }> {
  return await defaultStorage.importJSON(jsonString);
}

export async function exportCSVReports(): Promise<void> {
  const [bills] = await Promise.all([defaultStorage.getBills()]);
  const dateStr = new Date().toISOString().substring(0, 10);
  const headers = ['Entity Name', 'Bill Number', 'Date', 'Amount', 'Type', 'Created At'];

  const buildCSV = (type: 'sale' | 'purchase'): string => {
    const filtered = bills.filter((b) => b.type === type);
    const rows = filtered.map((b) =>
      [
        `"${(b.entityName || '').replace(/"/g, '""')}"`,
        `"${(b.billNumber || '').replace(/"/g, '""')}"`,
        b.date || '',
        b.amount ?? 0,
        b.type,
        b.createdAt || '',
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const customerCSV = buildCSV('sale');
  const vendorCSV = buildCSV('purchase');

  triggerBrowserDownload(
    customerCSV,
    `mk_customers_sales_${dateStr}.csv`,
    'text/csv;charset=utf-8;'
  );

  setTimeout(() => {
    triggerBrowserDownload(
      vendorCSV,
      `mk_vendors_purchases_${dateStr}.csv`,
      'text/csv;charset=utf-8;'
    );
  }, 400);
}
