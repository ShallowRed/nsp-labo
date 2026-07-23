// Génère mockups/carte-dep.svg : la choroplèthe des départements, façon cartes RESP,
// mais colorée par des VARIABLES CSS (fill="var(--dv-map-k)") — la carte se recolore
// avec le spectre sans régénérer les chemins. Valeurs fictives (hash sur INSEE_DEP).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { geoConicConformal, geoPath } from "d3-geo";
import { franceMetropolitaine } from "../notebooks/lib/carte.js";

const here = dirname(fileURLToPath(import.meta.url));
const topo = JSON.parse(readFileSync(join(here, "..", "notebooks/data/departements.json"), "utf8"));
const fm = franceMetropolitaine(topo);

const W = 520, H = 500;
const proj = geoConicConformal().rotate([-3, 0]).parallels([44, 49]).fitExtent([[10, 10], [W - 10, H - 10]], fm);
const path = geoPath(proj);

const bucket = (f) => { let h = 0; for (const ch of f.properties.INSEE_DEP) h = (h * 31 + ch.charCodeAt(0)) % 997; return h % 5; };

let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Carte choroplèthe des départements, données fictives">`;
for (const f of fm.features) {
  const d = path(f);
  if (d) svg += `<path d="${d}" fill="var(--dv-map-${bucket(f)})" stroke="var(--dv-map-stroke)" stroke-width="0.5"/>`;
}
svg += `</svg>`;

writeFileSync(join(here, "..", "mockups", "carte-dep.svg"), svg);
console.log(`Écrit mockups/carte-dep.svg (${fm.features.length} départements, fills en var CSS)`);
