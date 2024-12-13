import { parse } from "node-html-parser";

export async function fetchPastas() {
  const response = await fetch(
    "https://en.wikipedia.org/api/rest_v1/page/html/List_of_pasta?redirect=true",
  );
  const text = await response.text();
  const root = parse(text);

  const captions = root.querySelectorAll("caption");
  const tables = [];
  for (const caption of captions) {
    tables.push(caption.closest("table"));
  }

  const pastas = [];
  for (const table of tables) {
    const rows = table.querySelector("tbody").querySelectorAll("tr");
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      pastas.push(row.querySelectorAll("th")[0].innerText);
    }
  }

  return pastas;
}
