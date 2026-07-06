export function exportToCsv(filename: string, columns: { key: string; label: string }[], rows: object[]) {
  const header = columns.map((c) => JSON.stringify(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = (row as Record<string, unknown>)[c.key];
          if (val == null) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
