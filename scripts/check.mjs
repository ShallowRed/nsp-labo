// Contrôle de cohérence des scénarios : génération, garanties de contraste,
// continuité au pétrole NSP, catégoriel dataviz sous contraintes.
// Usage : npm run check
import {
  genSpectre,
  paliers,
  garanties,
  continuite,
  aaOnWhite,
  bestCategorical,
  okOf,
} from "../notebooks/lib/spectre.js";
import { SCENARIOS, CATEGORIEL } from "../notebooks/lib/scenarios.js";

const ps = paliers(19);
const rows = [];
for (const [id, sc] of Object.entries(SCENARIOS)) {
  const spectre = genSpectre(sc);
  const cont = continuite(spectre);
  const g = garanties(spectre, [8, 10]);
  const aa = Object.entries(spectre).map(([f, s]) => aaOnWhite(s, ps));
  const cmax = Math.max(
    ...Object.values(spectre).flatMap((s) => s.map((h) => okOf(h).C))
  );
  const catL = bestCategorical(spectre, CATEGORIEL[id], { mode: "light", ps, maxOptions: Infinity });
  const catD = bestCategorical(spectre, CATEGORIEL[id], { mode: "dark", ps, maxOptions: Infinity });
  rows.push({
    scenario: id,
    familles: Object.keys(sc.familles).length,
    "dE min au pétrole": cont.dEmin,
    "porteur": `${cont.porteur} ${cont.hex}`,
    "part familles proches": cont.partProche,
    "AA blanc (min-max)": `${Math.min(...aa)}-${Math.max(...aa)}`,
    "contraste Δ400": g[0].contrasteMin,
    "contraste Δ500": g[1].contrasteMin,
    "chroma max": +cmax.toFixed(3),
    "cat light adj dE": catL.adjacentMinDE ?? "infaisable",
    "cat dark adj dE": catD.adjacentMinDE ?? "infaisable",
  });
}
console.table(rows);

// détail des jeux catégoriels light
for (const [id] of Object.entries(SCENARIOS)) {
  const spectre = genSpectre(SCENARIOS[id]);
  const cat = bestCategorical(spectre, CATEGORIEL[id], { mode: "light", ps, maxOptions: Infinity });
  if (cat.ordered)
    console.log(
      id.padEnd(14),
      cat.ordered.map((c) => `${c.famille} ${c.palier} ${c.hex}`).join(" · ")
    );
  else console.log(id, "infaisable pour", cat.infaisable);
}
