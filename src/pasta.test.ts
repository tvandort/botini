import { fetchUncookedPastas, transformRawPasta, mapRawPastas } from "./pasta";

describe("pastas", () => {
  test("that the pasta list works", async () => {
    const pastas = await fetchUncookedPastas();
    expect(pastas).toMatchSnapshot();
  });

  describe("transformRawPasta", () => {
    test("removes tags", () => {
      expect(transformRawPasta("Penne[123]")).toStrictEqual(["Penne"]);
    });

    test("splits tags with parenthesis", () => {
      expect(transformRawPasta("Spiralini (Scharfalini)")).toStrictEqual([
        "Spiralini",
        "Scharfalini",
      ]);
    });

    test("removes leading or", () => {
      expect(transformRawPasta("Busiate (or busiati)")).toStrictEqual([
        "Busiate",
        "busiati",
      ]);
    });

    test("removes joining or", () => {
      expect(transformRawPasta("Campanelle or torchio")).toStrictEqual([
        "Campanelle",
        "torchio",
      ]);
    });
  });

  test("mapRawPastas", () => {
    const pastas = [
      { text: "Penne[123]", url: "/wiki/1" },
      { text: "Spiralini (Scharfalini)", url: "/wiki/2" },
      { text: "Busiate (or busiati)", url: "/wiki/3" },
      { text: "Campanelle or torchio", url: "/wiki/4" },
    ];

    expect(mapRawPastas(pastas)).toMatchSnapshot();
  });
});
