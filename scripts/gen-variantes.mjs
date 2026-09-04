// Écrit une copie CSV du spectre par variante de l'extrémité claire (scenarios.js,
// VARIANTES), pour les comparer dans les projets consommateurs.
// Usage : node scripts/gen-variantes.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { genSpectre, genSpectreDetail } from "../notebooks/lib/spectre.js";
import { SCENARIOS, VARIANTES } from "../notebooks/lib/scenarios.js";
import { buildCsv } from "../notebooks/lib/ase.js";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "exports", "spectre", "variantes");
mkdirSync(outDir, { recursive: true });
for (const [id, v] of Object.entries(VARIANTES)) {
  writeFileSync(join(outDir, `${id}.csv`), buildCsv(genSpectre(SCENARIOS.resserre, v.options), genSpectreDetail(SCENARIOS.resserre, v.options)));
}
console.log(`Écrit exports/spectre/variantes/ : ${Object.keys(VARIANTES).join(", ")}`);
