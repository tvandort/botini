import { fetchPastas } from "./pasta";

describe("pastas", () => {
  test("that the pasta list works", async () => {
    const pastas = await fetchPastas();
    expect(pastas).toMatchSnapshot();
  });
});
