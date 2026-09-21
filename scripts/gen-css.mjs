// Écrit le spectre en propriétés CSS, une par couleur : --nsp-<famille>-<palier>, en notation oklch().
//   exports/spectre/spectre-nsp.css
// Le fichier se charge tel quel dans une page ou dans une feuille Sass (@use 'spectre-nsp').
// Usage : node scripts/gen-css.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dossier = join(dirname(fileURLToPath(import.meta.url)), "../exports/spectre");
const lignes = readFileSync(join(dossier, "spectre-nsp.csv"), "utf8").trim().split("\n").slice(1).map((l) => l.split(","));

let css = "/* Généré par scripts/gen-css.mjs depuis spectre-nsp.csv. Ne pas modifier. */\n\n:root {\n";
for (const [famille, palier, , , oklch] of lignes) css += `  --nsp-${famille}-${palier}: ${oklch};\n`;
css += "}\n";

writeFileSync(join(dossier, "spectre-nsp.css"), css);
console.log(`spectre-nsp.css : ${lignes.length} couleurs`);
