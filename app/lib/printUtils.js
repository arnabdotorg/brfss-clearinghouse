// Provides a tiny helper to open a print dialog for table exports.
export const printElement = (element, title = "Table export") => {
  if (typeof window === "undefined" || !element) {
    return false;
  }

  const markup = element.outerHTML || element.innerHTML || "";
  if (!markup) {
    return false;
  }

  const printWindow = window.open("", "_blank", "width=900,height=650");
  if (!printWindow) {
    return false;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #111827; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d4d4d8; padding: 8px 12px; font-size: 13px; text-align: left; }
      thead th { background: #fef3c7; color: #92400e; font-weight: 600; }
      tbody tr:nth-child(even) { background: #fffbeb; }
    </style>
  </head>
  <body>
    ${markup}
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
  return true;
};
