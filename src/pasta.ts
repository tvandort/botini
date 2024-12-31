import { parse } from "node-html-parser";

/**
 *
 * @param revision Defaults to revision on 23 November 2024
 */
export async function fetchUncookedPastas(revision = 1259032650) {
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/html/List_of_pasta/${revision}?redirect=true`,
  );
  const text = await response.text();
  const root = parse(text);

  const captions = root.querySelectorAll("caption");
  const tables = [];
  for (const caption of captions) {
    tables.push(caption.closest("table"));
  }

  const pastas: { text: string; url: string | undefined }[] = [];
  for (const table of tables) {
    const rows = table?.querySelector("tbody")?.querySelectorAll("tr") ?? [];
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      pastas.push({
        text: row.querySelectorAll("th")[0].innerText,
        url: row.querySelectorAll("a")[0].getAttribute("href"),
      });
    }
  }

  return pastas;
}

const referenceTag = /\[\d*\]/;
const parenthetical = /\(.*\)/;
const leadingOr = /^or\s/;
const betweenOr = /\sor\s/;

// surely this should be transformUncookedPasta
export function transformRawPasta(pastasTitle: string) {
  const pastas = [];

  if (parenthetical.test(pastasTitle)) {
    pastas.push(pastasTitle.replace(parenthetical, ""));
    const matches = parenthetical.exec(pastasTitle) ?? [];
    for (const match of matches) {
      pastas.push(match);
    }
  } else if (betweenOr.test(pastasTitle)) {
    for (const pasta of pastasTitle.split(betweenOr)) {
      pastas.push(pasta);
    }
  } else {
    pastas.push(pastasTitle);
  }

  return pastas
    .map((pasta) => pasta.replace(referenceTag, ""))
    .map((pasta) => pasta.trim())
    .map((pasta) =>
      pasta.replace("(", "").replace(")", "").replace(leadingOr, ""),
    );
}

export function mapRawPastas(
  pastas: Awaited<ReturnType<typeof fetchUncookedPastas>>,
) {
  const transformed = pastas.map((pasta) => ({
    ...pasta,
    names: transformRawPasta(pasta.text),
  }));

  const allNames = [];
  const dictionary: Record<
    string,
    { names: string[]; text: string; url: string | undefined }
  > = {};
  for (const pasta of transformed) {
    for (const name of pasta.names) {
      allNames.push(name);
      dictionary[name] = pasta;
    }
  }

  return {
    allNames,
    dictionary,
  };
}
