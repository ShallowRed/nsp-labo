// Recopie le spectre chez ses consommateurs, quand leur dépôt est cloné à côté de celui-ci :
//   ../nsp-site/tokens/spectre-nsp.csv, puis son générateur de variables CSS
//   ../vignettes/presentations/themes/nsp/_spectre-nsp.css
// Un consommateur absent est signalé et passé. Rien n'est commité.
// Usage : node scripts/livrer.mjs
import { copyFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const spectre = join(racine, "exports/spectre");

const livraisons = [
  { nom: "nsp-site", dossier: join(racine, "../nsp-site/tokens"), source: "spectre-nsp.csv", cible: "spectre-nsp.csv", ensuite: (d) => execFileSync("node", [join(d, "generate.mjs")], { stdio: "inherit" }) },
  { nom: "thème nsp de vignettes", dossier: join(racine, "../vignettes/presentations/themes/nsp"), source: "spectre-nsp.css", cible: "_spectre-nsp.css" },
];

for (const { nom, dossier, source, cible, ensuite } of livraisons) {
  if (!existsSync(dossier)) { console.log(`${nom} : dossier absent, passé`); continue; }
  copyFileSync(join(spectre, source), join(dossier, cible));
  console.log(`${nom} : ${cible} copié`);
  ensuite?.(dossier);
}
