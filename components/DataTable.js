/** Accessible data table: caption, scoped headers, keyboard-scrollable region. */
export default function DataTable({ caption, columns, rows, getKey, empty = null }) {
  if (!rows.length && empty) return empty;
  return (
    <div className="table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} scope="col" className={c.numeric ? "num" : undefined}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)}>
              {columns.map((c) => (
                <td key={c.header} className={c.numeric ? "num" : undefined} data-label={c.header}>{c.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
