// Smoke test hors navigateur des figures du notebook enquete-hierarchie.
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
globalThis.window = dom.window;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
globalThis.Node = dom.window.Node;
const Plot = await import("@observablehq/plot");
const { genSpectre, paliers, simulate } = await import("/Users/lucaspoulain/Projects/nsp-labo/notebooks/lib/spectre.js");
const { SCENARIOS } = await import("/Users/lucaspoulain/Projects/nsp-labo/notebooks/lib/scenarios.js");
const spectreEnq = genSpectre(SCENARIOS["median-v01"]);
const paliersEnq = paliers(19);
const teinte = (f, p) => spectreEnq[f][paliersEnq.indexOf(p)];

// likert
const modalites = [
  { nom: "mal", couleur: teinte("coquelicot", 600) },
  { nom: "plutôt mal", couleur: teinte("coquelicot", 300) },
  { nom: "plutôt bien", couleur: teinte("canard", 450) },
  { nom: "bien", couleur: teinte("canard", 600) },
];
const reponsesDemo = {
  "en général": { "mal": 7, "plutôt mal": 19, "plutôt bien": 57, "bien": 17 },
  "au travail": { "mal": 14, "plutôt mal": 31, "plutôt bien": 45, "bien": 10 },
};
for (const vision of ["normal", "deutan"]) {
  const segments = Object.entries(reponsesDemo).flatMap(([contexte, rep]) => {
    let gauche = -(rep["mal"] + rep["plutôt mal"]);
    return modalites.map((m) => {
      const seg = { contexte, x0: gauche, x1: gauche + rep[m.nom], couleur: simulate(m.couleur, vision), pct: rep[m.nom] };
      gauche += rep[m.nom];
      return seg;
    });
  });
  const fig = Plot.plot({
    document: dom.window.document, width: 680, height: 150,
    x: { domain: [-60, 80], tickFormat: (d) => Math.abs(d) },
    color: { type: "identity" },
    marks: [
      Plot.barX(segments, { y: "contexte", x1: "x0", x2: "x1", fill: "couleur" }),
      Plot.text(segments.filter((s) => s.pct >= 7), { y: "contexte", x: (s) => (s.x0 + s.x1) / 2, text: (s) => `${s.pct}` }),
      Plot.ruleX([0]),
    ],
  });
  console.log(`likert (${vision}) OK :`, fig.querySelectorAll("rect").length, "rects,", fig.querySelectorAll("text").length, "texts");
}

// haltère
const valeursDemo = [
  { valeur: "Traitement équitable des publics", importance: 96, agir: 44 },
  { valeur: "Bon usage de l'argent public", importance: 95, agir: 35 },
];
const fig2 = Plot.plot({
  document: dom.window.document, width: 680, height: 210,
  x: { domain: [0, 100] },
  marks: [
    Plot.link(valeursDemo, { y: "valeur", x1: "agir", x2: "importance" }),
    Plot.dot(valeursDemo, { y: "valeur", x: "importance", fill: teinte("canard", 600), r: 6 }),
    Plot.dot(valeursDemo, { y: "valeur", x: "agir", fill: teinte("coquelicot", 500), r: 6 }),
  ],
});
console.log("haltère OK :", fig2.querySelectorAll("circle").length, "dots,", fig2.querySelectorAll("path").length, "liens/axes");
console.log("SMOKE ENQUETE : tout passe");
