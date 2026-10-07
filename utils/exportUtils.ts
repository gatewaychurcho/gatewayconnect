/**
 * Helper to download CSV data in an Excel-compatible format (with UTF-8 BOM).
 */
export function downloadCsvForExcel(filename: string, csvContent: string): void {
  // UTF-8 BOM (\uFEFF) forces Microsoft Excel to open UTF-8 files correctly with columns
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts an array of objects to CSV string.
 */
export function objectsToCsv(headers: { key: string; label: string }[], data: Record<string, any>[]): string {
  const headerLine = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rowLines = data.map(item => {
    return headers
      .map(h => {
        const val = item[h.key];
        if (val === undefined || val === null) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerLine, ...rowLines].join('\n');
}
