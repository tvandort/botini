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

  describe("mapRawPastas", () => {
    test("maps raw pastas", () => {
      const pastas = [
        { text: "Penne[123]" },
        { text: "Spiralini (Scharfalini)" },
        { text: "Busiate (or busiati)" },
        { text: "Campanelle or torchio" },
      ];

      expect(mapRawPastas(pastas)).toStrictEqual([
        "Penne",
        "Spiralini",
        "Scharfalini",
        "Busiate",
        "busiati",
        "Campanelle",
        "torchio",
      ]);
    });
  });
});
