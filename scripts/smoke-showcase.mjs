// Smoke test du notebook couleurs-showcase : chaque scénario x chaque visuel,
// aucune couleur indéfinie, figures rendues.
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
globalThis.window = dom.window;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
const Plot = await import("@observablehq/plot");
const { genSpectre, paliers, bestCategorical, categorielEtendu, simulate, dE } = await import("../notebooks/lib/spectre.js");
const { SCENARIOS, CATEGORIEL } = await import("../notebooks/lib/scenarios.js");
const { franceMetropolitaine } = await import("../notebooks/lib/carte.js");
const { readFileSync } = await import("node:fs");
const topo = JSON.parse(readFileSync(new URL("../notebooks/data/departements.json", import.meta.url), "utf8"));
const fond = franceMetropolitaine(topo);
const ps = paliers(19);
let pb = 0;
for (const id of Object.keys(SCENARIOS)) {
  const sp = genSpectre(SCENARIOS[id]);
  const t = (f, p) => sp[f]?.[ps.indexOf(p)];
  const requis = {
    "sondage coquelicot 600": t("coquelicot", 600), "sondage canard 450": t("canard", 450),
    "ecart canard 600": t("canard", 600), "ecart coquelicot 500": t("coquelicot", 500),
    "encre": t("ardoise", 800) ?? t("petrole", 800),
    "carte famille": (sp.lavande ?? sp.canard ?? sp.petrole)?.[14],
  };
  for (const [k, v] of Object.entries(requis)) if (!v) { console.log(`MANQUE [${id}] ${k}`); pb++; }
  const cat = bestCategorical(sp, CATEGORIEL[id], { mode: "light", ps });
  if (!cat.ordered?.length || cat.ordered.some((c) => !c.sims?.deutan)) { console.log(`MANQUE [${id}] catégoriel`); pb++; }
  const catSombre = bestCategorical(sp, CATEGORIEL[id], { mode: "dark", ps });
  if (!catSombre.ordered?.length) { console.log(`MANQUE [${id}] catégoriel sombre`); pb++; }
  const douze = categorielEtendu(SCENARIOS[id], CATEGORIEL[id], { ps });
  const uniques = new Set(douze.ordered.map((c) => c.hex));
  if (douze.ordered.length !== 2 * CATEGORIEL[id].length || uniques.size !== douze.ordered.length) {
    console.log(`ETENDU KO [${id}] ${douze.ordered.length} teintes, ${uniques.size} uniques`); pb++;
  }
  if (douze.adjacentMinDE < 10) { console.log(`ETENDU KO [${id}] adjacence ${douze.adjacentMinDE} < 10`); pb++; }
  // gamme divergente : le pivot neutre doit tenir là où le pivot moutarde casse
  const adj = (hexes) => {
    let w = Infinity;
    for (const m of ["normal", "protan", "deutan", "tritan"])
      for (let i = 0; i + 1 < hexes.length; i++)
        w = Math.min(w, dE(simulate(hexes[i], m), simulate(hexes[i + 1], m)));
    return w;
  };
  const lik5 = [t("coquelicot", 600), t("coquelicot", 300), t("ardoise", 100), t("canard", 450), t("canard", 600)];
  if (lik5.some((h) => !h) || adj(lik5) < 10) { console.log(`LIKERT5 KO [${id}] pivot neutre ${adj(lik5).toFixed(1)}`); pb++; }
  const famC = sp.lavande ?? sp.canard ?? sp.petrole;
  const carte = Plot.plot({
    document: dom.window.document,
    projection: { type: "conic-conformal", rotate: [-3, 0], parallels: [44, 49], domain: fond },
    width: 480, height: 460,
    color: { type: "quantile", n: 5, range: [2, 5, 8, 11, 14].map((i) => famC[i]) },
    marks: [Plot.geo(fond, { fill: (d) => 1, stroke: famC[14] })],
  });
  const n = carte.querySelectorAll("path").length;
  if (n < 96) { console.log(`CARTE KO [${id}] ${n} paths`); pb++; }
  console.log(`${id} : ok (${Object.keys(sp).length} familles, catégoriel ${cat.ordered.length} + sombre ${catSombre.ordered.length} + étendu ${douze.ordered.length} adj ${douze.adjacentMinDE}, carte ${n} paths)`);
}
console.log(pb ? `SMOKE SHOWCASE : ${pb} problème(s)` : "SMOKE SHOWCASE : tout passe");
process.exit(pb ? 1 : 0);
