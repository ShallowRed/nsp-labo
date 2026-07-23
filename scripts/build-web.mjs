// Client web du rapport enquête : génère exports/web/ (pages chapitrées publiables)
// depuis le MÊME Markdown finalisé que la chaîne ICML (POC W4, pivot partagé avec W2).
// La figure 01 est branchée en vrai (SVG Plot généré via le manifeste) pour démontrer
// le circuit identifiant -> fichier ; les autres restent des emplacements stylés.
// Usage : node scripts/build-web.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const sortieDir = join(racine, "exports", "web");
mkdirSync(join(sortieDir, "figures"), { recursive: true });

// --- Couleurs : depuis la source unique du spectre (scénario médian, draft) ---
const { genSpectre, paliers } = await import(join(racine, "notebooks/lib/spectre.js"));
const { SCENARIOS } = await import(join(racine, "notebooks/lib/scenarios.js"));
const spectre = genSpectre(SCENARIOS.resserre);
const ps = paliers(19);
const teinte = (f, p) => spectre[f][ps.indexOf(p)];

// --- Figure 01 : générée en vrai (le manifeste en action) ---
const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
globalThis.window = dom.window;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
const Plot = await import("@observablehq/plot");
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
const segments = Object.entries(reponsesDemo).flatMap(([contexte, rep]) => {
  let gauche = -(rep["mal"] + rep["plutôt mal"]);
  return modalites.map((m) => {
    const seg = { contexte, x0: gauche, x1: gauche + rep[m.nom], couleur: m.couleur, pct: rep[m.nom] };
    gauche += rep[m.nom];
    return seg;
  });
});
const figure01 = Plot.plot({
  document: dom.window.document,
  width: 640, height: 150, marginLeft: 90,
  style: { fontFamily: "inherit", fontSize: "13px" },
  x: { label: "part des répondants (%)", domain: [-60, 80], tickFormat: (d) => Math.abs(d) },
  y: { label: null },
  color: { type: "identity" },
  marks: [
    Plot.barX(segments, { y: "contexte", x1: "x0", x2: "x1", fill: "couleur", insetTop: 6, insetBottom: 6 }),
    Plot.text(segments.filter((s) => s.pct >= 7), { y: "contexte", x: (s) => (s.x0 + s.x1) / 2, text: (s) => `${s.pct}`, fill: "white", fontWeight: 600 }),
    Plot.ruleX([0], { stroke: teinte("ardoise", 800) }),
  ],
});
figure01.setAttribute("xmlns", "http://www.w3.org/2000/svg");
writeFileSync(join(sortieDir, "figures", "enquete-hm_M1_D_x_E.svg"), figure01.outerHTML);

// --- Lecture du Markdown finalisé et préparation des figures ---
let md = readFileSync(join(racine, "exports/print/rapport-lineaire-finition.md"), "utf8");
md = md.replace(/<!-- FIGURE 01[^>]*-->/, `
<figure class="figure-rapport">
  <img src="figures/enquete-hm_M1_D_x_E.svg" alt="Comment vous sentez-vous, en général, et au travail ? Barres divergentes." />
  <p class="figure-source">Figure branchée via le manifeste (identifiant M1_D_x_E, valeurs de démonstration).</p>
</figure>
`);
md = md.replace(/<!-- (FIGURE \d+)[^>]*-->/g, `<div class="figure-attente">$1 : en attente de l'export R (manifeste)</div>`);

// --- Notes de fin : détachées du pied de document, rattachées au chapitre de leur appel ---
const defsNotes = {};
md = md.replace(/^(\[\^(\d+)\]:[^\n]*(?:\n(?!\[)[^\n]+)*)\n?/gm, (tout, def, num) => {
  defsNotes[num] = def;
  return "";
});

// --- Découpage en chapitres sur les H1 ---
const blocs = md.split(/^(?=# )/m).filter((b) => b.trim());
const chapitres = [];
for (const bloc of blocs) {
  const titre = bloc.match(/^# (.*)/)[1].replace(/\\/g, "").replace(/ \{#.*\}/, "").trim();
  if (titre === "Rapport linéaire") continue; // titre du doc, porté par le site
  const notesDuChapitre = Object.entries(defsNotes)
    .filter(([num]) => bloc.includes(`[^${num}]`))
    .map(([, def]) => def);
  chapitres.push({ titre, corps: notesDuChapitre.length ? `${bloc}\n\n${notesDuChapitre.join("\n\n")}\n` : bloc });
}

// --- Rendu pandoc + gabarit ---
const css = `
:root { --encre: ${teinte("ardoise", 850)}; --discret: ${teinte("ardoise", 500)};
  --accent: ${teinte("petrole", 600)}; --accent-fonce: ${teinte("petrole", 750)};
  --fond-doux: ${teinte("petrole", 50)}; --filet: ${teinte("ardoise", 150)}; }
* { box-sizing: border-box; }
:root { color-scheme: light; }
body { margin: 0; background: white; color: var(--encre); font: 17px/1.65 "Public Sans", system-ui, sans-serif; }
header.site { background: var(--accent-fonce); color: white; padding: 1.1rem 1.5rem; }
header.site a { color: white; text-decoration: none; font-weight: 700; }
header.site .sous-titre { opacity: 0.75; font-size: 0.85rem; }
main { max-width: 44rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
h1 { font-size: 1.9rem; line-height: 1.25; color: var(--accent-fonce); }
h2 { font-size: 1.35rem; margin-top: 2.2em; color: var(--accent-fonce); }
h3 { font-size: 1.05rem; margin-top: 1.8em; }
h4 { font-size: 0.95rem; color: var(--discret); margin: 1.6em 0 0.4em; }
figure.figure-rapport { margin: 0.6em 0 1.2em; }
figure.figure-rapport img { max-width: 100%; }
.figure-source { color: var(--discret); font-size: 0.8rem; margin: 0.2em 0 0; }
.figure-attente { border: 1.5px dashed var(--filet); color: var(--discret); border-radius: 6px;
  padding: 1.6em 1em; text-align: center; font-size: 0.85rem; margin: 0.8em 0 1.2em;
  background: var(--fond-doux); }
table { border-collapse: collapse; font-size: 0.85rem; margin: 1em 0; }
td, th { border: 1px solid var(--filet); padding: 0.5em 0.7em; vertical-align: top; }
nav.chapitres ol { padding-left: 1.2rem; } nav.chapitres li { margin: 0.45em 0; }
nav.fil { display: flex; justify-content: space-between; gap: 1rem; margin-top: 3rem;
  border-top: 1px solid var(--filet); padding-top: 1rem; font-size: 0.9rem; }
a { color: var(--accent); }
.section-footnotes { font-size: 0.85rem; color: var(--discret); }
.autres-racines { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--filet);
  font-size: 0.82rem; color: var(--discret); }
.autres-racines code { background: var(--fond-doux); padding: 0.1em 0.35em; border-radius: 4px; }
`;
writeFileSync(join(sortieDir, "style.css"), css);

const page = (titre, corpsHtml, filAriane) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre} : enquête Hiérarchie et management</title>
<link rel="stylesheet" href="style.css"></head>
<body>
<header class="site"><a href="index.html">Enquête « Hiérarchie et management »</a>
<div class="sous-titre">Nos Services Publics : POC de version web, générée du même Markdown que la chaîne print</div></header>
<main>${corpsHtml}${filAriane}</main>
</body></html>`;

const slug = (t, i) => `chapitre-${String(i + 1).padStart(2, "0")}`;
chapitres.forEach((c, i) => {
  const html = execFileSync("pandoc", ["-f", "markdown", "-t", "html"], { input: c.corps, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const prev = i > 0 ? `<a href="${slug(chapitres[i - 1].titre, i - 1)}.html">← ${chapitres[i - 1].titre}</a>` : `<a href="index.html">← Sommaire</a>`;
  const next = i < chapitres.length - 1 ? `<a href="${slug(chapitres[i + 1].titre, i + 1)}.html">${chapitres[i + 1].titre} →</a>` : "<span></span>";
  writeFileSync(join(sortieDir, `${slug(c.titre, i)}.html`), page(c.titre, html, `<nav class="fil">${prev}${next}</nav>`));
});

const sommaire = `<h1>Rapport linéaire</h1>
<p>Pendant numérique du rapport de l'enquête « Hiérarchie et management » : mêmes chapitres,
même texte, même manifeste de figures que le PDF, générés du même export Markdown.
POC du 2026-07-18, valeurs et habillage non définitifs (spectre en cours d'arbitrage).</p>
<nav class="chapitres"><ol>
${chapitres.map((c, i) => `<li><a href="${slug(c.titre, i)}.html">${c.titre}</a></li>`).join("\n")}
</ol></nav>
<p class="autres-racines">nsp-labo sert trois racines distinctes, chacune sur son port :
ce pendant web (ici), les notebooks Observable (<code>pnpm preview</code>, port 5173)
et les maquettes de charte (<code>python3 -m http.server --directory mockups</code>,
port 18798). Voir le README du repo pour les commandes de lancement.</p>`;
writeFileSync(join(sortieDir, "index.html"), page("Sommaire", sommaire, ""));
console.log(`Écrit exports/web/ : ${chapitres.length} chapitres + sommaire + 1 figure branchée (M1_D_x_E)`);
