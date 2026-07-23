// Compare 19 vs 11 paliers sur les scénarios, avec les mêmes métriques que check.mjs.
// Sert à trancher : la densité 19 paliers apporte-t-elle une garantie mesurable
// que 11 (convention Tailwind/shadcn/Radix) n'apporte pas ?
import { wcagContrast } from "culori";
import { genSpectre, paliers, aaOnWhite, bestCategorical, okOf } from "../notebooks/lib/spectre.js";
import { SCENARIOS, CATEGORIEL } from "../notebooks/lib/scenarios.js";

// Contraste minimal garanti entre deux paliers NOMMÉS (valeurs réelles, pas crans
// d'index) : seule façon de comparer 19 et 11 paliers équitablement, vu que
// l'espacement de paliers(11) n'est pas régulier (50,100,200,...,900,950).
function garantieValeurs(spectre, ps, pA, pB) {
  const iA = ps.indexOf(pA), iB = ps.indexOf(pB);
  if (iA < 0 || iB < 0) return null;
  let min = Infinity;
  for (const s of Object.values(spectre)) min = Math.min(min, wcagContrast(s[iA], s[iB]));
  return +min.toFixed(2);
}

for (const nPal of [19, 11]) {
  const ps = paliers(nPal);
  const rows = [];
  for (const [id, sc] of Object.entries(SCENARIOS)) {
    const spectre = genSpectre(sc, { n: nPal });
    const aa = Object.values(spectre).map((s) => aaOnWhite(s, ps));
    const cmax = Math.max(...Object.values(spectre).flatMap((s) => s.map((h) => okOf(h).C)));
    const catL = bestCategorical(spectre, CATEGORIEL[id], { mode: "light", ps, maxOptions: Infinity });
    rows.push({
      scenario: id,
      paliers: nPal,
      "AA blanc (min-max)": `${Math.min(...aa)}-${Math.max(...aa)}`,
      "contraste 100↔500": garantieValeurs(spectre, ps, 100, 500),
      "contraste 100↔600": garantieValeurs(spectre, ps, 100, 600),
      "contraste 200↔700": garantieValeurs(spectre, ps, 200, 700),
      "chroma max": +cmax.toFixed(3),
      "cat light adj dE": catL.adjacentMinDE ?? "infaisable",
    });
  }
  console.log(`\n=== ${nPal} paliers ===`);
  console.table(rows);
}
