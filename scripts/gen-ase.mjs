// Génère exports/spectre/ : le spectre NSP au format Adobe Swatch Exchange (.ase),
// importable tel quel dans le nuancier InDesign ou Illustrator, plus un CSV de
// référence. Le constructeur ASE vit dans notebooks/lib/ase.js (partagé avec le
// notebook, qui offre le même fichier en téléchargement).
// Usage : node scripts/gen-ase.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { genSpectre, genSpectreDetail, paliers } from "../notebooks/lib/spectre.js";
import { SCENARIOS } from "../notebooks/lib/scenarios.js";
import { buildAse, buildCsv, nbCouleurs } from "../notebooks/lib/ase.js";

const spectre = genSpectre(SCENARIOS.resserre);
const ase = buildAse(spectre);
const csv = buildCsv(spectre, genSpectreDetail(SCENARIOS.resserre));

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "exports", "spectre");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "spectre-nsp.ase"), ase);
writeFileSync(join(outDir, "spectre-nsp.csv"), csv);

// --- Auto-contrôle : relire l'ASE et compter les entrées ---
const buf = Buffer.from(ase);
let off = 12, groupes = 0, entrees = 0;
while (off < buf.length) {
  const type = buf.readUInt16BE(off);
  const len = buf.readUInt32BE(off + 2);
  if (type === 0xc001) groupes++;
  if (type === 0x0001) entrees++;
  off += 6 + len;
}
if (entrees !== nbCouleurs() || off !== buf.length) {
  console.error(`ASE incohérent : ${entrees} entrées (attendu ${nbCouleurs()}), fin ${off}/${buf.length}`);
  process.exit(1);
}
console.log(`Écrit exports/spectre/ : spectre-nsp.ase (${groupes} groupes, ${entrees} couleurs) + spectre-nsp.csv (${8 * paliers(19).length} lignes)`);
