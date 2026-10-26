// CSV helpers: quote commas, quotes and newlines; neutralise spreadsheet formulas.
export function csvEscape(value) {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : String(value);
  // Prevent formula injection when the file is opened in a spreadsheet (strings only).
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/** columns: [{ header, value: (row) => any }] */
export function toCSV(rows, columns) {
  const head = columns.map((c) => csvEscape(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(c.value(r))).join(","));
  return [head, ...body].join("\r\n") + "\r\n";
}

export function downloadCSV(filename, csv) {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
