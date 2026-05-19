// Server-side export utilities for PDF (HTML) and Excel (CSV)

type Column = { key: string; header: string; format?: (val: any) => string };

// ─── CSV/Excel Export ───────────────────────────────────────────────────────

export function generateCSV(data: Record<string, any>[], columns: Column[]): string {
  const header = columns.map((c) => `"${c.header}"`).join(",");
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = col.format ? col.format(row[col.key]) : row[col.key];
      return `"${String(val ?? "").replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

// ─── PDF/HTML Report Export ─────────────────────────────────────────────────

type ReportConfig = {
  title: string;
  subtitle?: string;
  period?: string;
  columns: Column[];
  data: Record<string, any>[];
  summary?: { label: string; value: string }[];
};

export function generateReportHTML(config: ReportConfig): string {
  const { title, subtitle, period, columns, data, summary } = config;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #1a1a1a; padding: 30px; }
  .header { border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px; }
  .header h1 { font-size: 20px; color: #16a34a; }
  .header p { color: #666; margin-top: 4px; font-size: 12px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 10px; color: #666; }
  .summary { display: flex; gap: 20px; margin-bottom: 20px; }
  .summary-card { background: #f8f9fa; padding: 12px 16px; border-radius: 6px; min-width: 120px; }
  .summary-card .label { font-size: 9px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #16a34a; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) { background: #f9f9f9; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 9px; }
  @media print { body { padding: 15px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>🍃 ${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ""}
  </div>
  <div class="meta">
    <span>${period || ""}</span>
    <span>Generated: ${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}</span>
  </div>
  ${summary ? `<div class="summary">${summary.map((s) => `<div class="summary-card"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`).join("")}</div>` : ""}
  <table>
    <thead><tr>${columns.map((c) => `<th>${c.header}</th>`).join("")}</tr></thead>
    <tbody>${data.map((row) => `<tr>${columns.map((col) => `<td>${col.format ? col.format(row[col.key]) : (row[col.key] ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>
  <div class="footer">
    <p>Tea Estate ERP • ${data.length} records • Confidential</p>
  </div>
</body>
</html>`;
}
