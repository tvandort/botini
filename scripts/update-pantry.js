import { fetchPastas } from "../src/pasta.js";
import * as fs from "node:fs";

const pastas = fetchPastas();
const json = JSON.stringify(pastas, null, 2);

fs.writeFile("./data/pastas.json", json, (err) => {
  console.error(err);
});
