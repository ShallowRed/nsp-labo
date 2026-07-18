// Audit des palettes existantes (notebooks/data/sources.json) : régularité des
// échelles en OKLCH et rapprochements de teintes entre systèmes.
// Usage : node scripts/audit-existant.mjs
import { readFileSync } from "node:fs";
import { okOf, dE, paliers, aaOnWhite } from "../notebooks/lib/spectre.js";

const sources = JSON.parse(
  readFileSync(new URL("../notebooks/data/sources.json", import.meta.url), "utf8")
);
const ps = paliers(19);

function audit(nom, scale) {
  const Ls = scale.map((h) => okOf(h).L);
  const steps = Ls.slice(1).map((l, i) => Ls[i] - l);
  const Hs = scale.map((h) => okOf(h).H).filter((h) => h != null);
  let drift = Math.max(...Hs) - Math.min(...Hs);
  if (drift > 180) drift = 360 - drift;
  return {
    échelle: nom,
    "L min-max": `${Ls[Ls.length - 1].toFixed(2)}-${Ls[0].toFixed(2)}`,
    monotone: steps.every((s) => s > 0),
    "pas max/min": +(Math.max(...steps) / Math.max(1e-9, Math.min(...steps))).toFixed(1),
    "dérive teinte (°)": +drift.toFixed(1),
    "AA blanc dès": aaOnWhite(scale, ps),
  };
}

const rows = [];
for (const [nom, scale] of Object.entries(sources.cartos)) rows.push(audit(`cartos.${nom}`, scale));
for (const [nom, scale] of Object.entries(sources.psp)) rows.push(audit(`psp.${nom}`, scale));
console.table(rows);

// rapprochements : référence = palier 450 (indice 8) de chaque famille + ancres
const refs = [
  ...Object.entries(sources.psp).map(([n, s]) => ({ sys: "psp", n, hex: s[8] })),
  ...Object.entries(sources.cartos).map(([n, s]) => ({ sys: "cartos", n, hex: s[11] })),
  ...Object.entries(sources.ancres).map(([n, hex]) => ({ sys: "ancre", n, hex })),
];
const matches = [];
for (let i = 0; i < refs.length; i++)
  for (let j = i + 1; j < refs.length; j++) {
    const a = refs[i], b = refs[j];
    if (a.sys === b.sys) continue;
    const ha = okOf(a.hex).H, hb = okOf(b.hex).H;
    if (ha == null || hb == null) continue;
    let dh = Math.abs(ha - hb);
    if (dh > 180) dh = 360 - dh;
    if (dh < 20) matches.push({
      a: `${a.sys}.${a.n}`, b: `${b.sys}.${b.n}`,
      "dH (°)": +dh.toFixed(1), dE2000: +dE(a.hex, b.hex).toFixed(1),
    });
  }
matches.sort((x, y) => x.dE2000 - y.dE2000);
console.table(matches.slice(0, 24));
