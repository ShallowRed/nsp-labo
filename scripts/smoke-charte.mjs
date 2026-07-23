// Smoke test de la correspondance charte-tramanh : chaque recette résout dans le
// spectre, et chaque série discrète tient l'écart adjacent (dE 10) daltonisme compris.
import { genSpectre, paliers, simulate, dE } from "../notebooks/lib/spectre.js";
import { SCENARIOS } from "../notebooks/lib/scenarios.js";
import { REGLES, LIGNES, FIGURES } from "../notebooks/lib/charte-tramanh.js";

const ps = paliers(19);
const sp = genSpectre(SCENARIOS.resserre);
const hexDe = ([fam, palier]) => {
  const v = sp[fam]?.[ps.indexOf(palier)];
  if (!v) throw new Error(`référence introuvable : ${fam} ${palier}`);
  return v;
};
const adj = (hexes) => {
  let w = Infinity;
  for (const m of ["normal", "protan", "deutan", "tritan"])
    for (let i = 0; i + 1 < hexes.length; i++)
      w = Math.min(w, dE(simulate(hexes[i], m), simulate(hexes[i + 1], m)));
  return w;
};

let pb = 0;
const SEUIL = 10;
for (const r of REGLES) hexDe(r.recette[0]);
for (const l of LIGNES) {
  const hexes = l.apres.map(hexDe);
  const d = adj(hexes);
  if (d < SEUIL) { console.log(`ADJACENCE KO « ${l.nom} » : dE ${d.toFixed(1)}`); pb++; }
}
for (const f of FIGURES) {
  const hexes = f.apres.map(hexDe);
  if (hexes.length !== f.modalites.length || Object.values(f.lignes).some((v) => v.length !== hexes.length)) {
    console.log(`FIGURE KO « ${f.titre} » : tailles incohérentes`); pb++;
  }
  const d = adj(hexes);
  if (d < SEUIL) { console.log(`FIGURE KO « ${f.titre} » : dE adjacent ${d.toFixed(1)}`); pb++; }
}
console.log(pb ? `SMOKE CHARTE : ${pb} problème(s)` : `SMOKE CHARTE : ${LIGNES.length} lignes et ${FIGURES.length} figures, tout passe`);
process.exit(pb ? 1 : 0);
