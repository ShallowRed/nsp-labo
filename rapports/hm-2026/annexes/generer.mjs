// Génère un graphique en forêt des annexes en SVG, aux dimensions du cadre de la maquette.
// Usage : node generer.mjs donnees/A2.csv sortie/A2.svg --largeur 350 --hauteur 630 --axe "…"
// Les unités du SVG sont des points : posé à 100 % dans InDesign, un corps de 6,4 fait 6,4 pt.
// La hauteur est un plafond : le pas des lignes se calcule pour que le graphique y tienne.

import fs from "node:fs";
import path from "node:path";
import {JSDOM} from "jsdom";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import {teinte} from "../graphiques/couleurs.mjs";

const args = process.argv.slice(2);
const [source, sortie] = args;
const option = (nom, defaut) => {
  const i = args.indexOf(`--${nom}`);
  return i >= 0 ? args[i + 1] : defaut;
};
const LARGEUR = +option("largeur", 350);
const HAUTEUR_MAX = +option("hauteur", 630);
const AXE = option("axe", "");
const PERIMETRE = option("perimetre", "");
const DOMAINE = [0, +option("max", 7)];

const COULEURS = {
  point: teinte("petrole 500"),
  intitule: teinte("petrole 700"),
  texte: teinte("ardoise 700"),
  secondaire: teinte("ardoise 500"),
  bande: teinte("ardoise 50"),
  grille: teinte("ardoise 100"),
  grilleUn: teinte("ardoise 300"), // ligne de la cote 1
  pointRef: teinte("ardoise 400") // point de la référence
};
const CORPS = +option("corps", 7);
const REGULIER = "Poppins-Regular, Poppins";
const GRAS = "Poppins-Bold, Poppins";

// Mise en page horizontale, en points
const MARGE = 6;            // retrait intérieur à gauche et à droite des bandes
const FIN_MODALITES = 146;  // bord droit des libellés de modalité
const FIN_VALEURS = 164;    // bord droit des valeurs
const DEBUT_TRACE = 178;    // bord gauche de la zone de tracé
// Mise en page verticale
const HAUT = PERIMETRE ? 15 : 3; // périmètre du graphique, au-dessus de la première bande
const LARGEUR_TRACE = LARGEUR - MARGE - DEBUT_TRACE;
const LIGNES_AXE = AXE.length * CORPS * 0.58 > LARGEUR_TRACE ? 2 : 1; // estimation de la largeur en Poppins Bold
const BAS = 29 + (LIGNES_AXE - 1) * CORPS * 1.2; // graduations et titre de l'axe
// coupure du titre à l'espace la plus proche du milieu, pour deux lignes équilibrées
const TITRE_AXE = LIGNES_AXE === 1 ? AXE : (() => {
  const milieu = AXE.length / 2;
  const espaces = [...AXE.matchAll(/ /g)].map((m) => m.index);
  const i = espaces.reduce((a, b) => (Math.abs(b - milieu) < Math.abs(a - milieu) ? b : a));
  return `${AXE.slice(0, i)}\n${AXE.slice(i + 1)}`;
})();
const RETRAIT_BANDE = +option("retrait", 0.6); // espace intérieur en haut et en bas de chaque bande
const RAPPORT_INTITULE = 1.08;

const CORRECTIONS = [
  [/je n’en jamais eu/g, "je n’en ai jamais eu"],
  [/^Equilibre/, "Équilibre"],
  [/>=\s*/g, "≥ "],
  [/^<3j\/semaine$/, "Moins de 3 j/semaine"],
  [/^3j\/s et \+$/, "3 j/semaine et plus"],
  [/'/g, "’"],
  [/\b1000\b/g, "1 000"],
  [/^Oui majo$/, "Oui tâche principale"],
  [/^Oui mino$/, "Oui tâche secondaire"]
];
const corriger = (s) => CORRECTIONS.reduce((acc, [a, b]) => acc.replace(a, b), String(s));
const virgule = (v, n = 1) => v.toFixed(n).replace(".", ",");

const brut = d3.csvParse(fs.readFileSync(source, "utf8"), d3.autoType);
const groupes = d3.groups(brut, (d) => d.variable); // conserve l'ordre d'origine

// Pas des lignes : tout ce qui n'est pas du texte est fixé, le reste se partage la hauteur
const nbModalites = brut.length;
const disponible = HAUTEUR_MAX - HAUT - BAS - groupes.length * 2 * RETRAIT_BANDE;
const PAS = Math.min(CORPS * 1.5, disponible / (nbModalites + groupes.length * RAPPORT_INTITULE));
const PAS_INTITULE = PAS * RAPPORT_INTITULE;

let y = HAUT;
const bandes = [], intitules = [], modalites = [];
for (const [ig, [variable, lignes]] of groupes.entries()) {
  const haut = y;
  y += RETRAIT_BANDE;
  intitules.push({y: y + PAS_INTITULE / 2, variable: corriger(variable), reference: corriger(lignes[0].reference)});
  y += PAS_INTITULE;
  for (const m of lignes) {
    modalites.push({y: y + PAS / 2, modalite: corriger(m.modalite), cote: m.cote, bas: m.ic_bas,
      haut: Math.min(m.ic_haut, DOMAINE[1]), tronque: m.ic_haut >= DOMAINE[1] - 0.01,
      significatif: m.significatif === 1, ecrite: +m.cote_ecrite});
    y += PAS;
  }
  y += RETRAIT_BANDE;
  bandes.push({y1: haut, y2: y, alterne: ig % 2 === 0});
}
const HAUTEUR = Math.ceil((y + BAS) * 10) / 10;

const x = d3.scaleLinear(DOMAINE, [DEBUT_TRACE, LARGEUR - MARGE]);
const graduations = d3.range(DOMAINE[0], DOMAINE[1] + 1);
const {window} = new JSDOM("");
const texte = (data, options) => Plot.text(data, {fontSize: CORPS, lineAnchor: "middle", ...options});

const plot = Plot.plot({
  document: window.document,
  width: LARGEUR,
  height: HAUTEUR,
  margin: 0,
  style: {fontFamily: REGULIER, fontSize: `${CORPS}px`, background: "none"},
  x: {type: "identity", axis: null},
  y: {type: "identity", axis: null},
  marks: [
    Plot.rect(bandes.filter((b) => b.alterne), {x1: 0, x2: LARGEUR, y1: "y1", y2: "y2", fill: COULEURS.bande}),
    // grille verticale continue, d'un axe gradué à l'autre ; la ligne de la cote 1 est plus marquée
    Plot.ruleX(graduations.filter((g) => g !== 1), {x: (d) => x(d), y1: HAUT, y2: y + 2, stroke: COULEURS.grille, strokeWidth: 0.4}),
    Plot.ruleX([1], {x: (d) => x(d), y1: HAUT, y2: y + 2, stroke: COULEURS.grilleUn, strokeWidth: 0.6}),
    // repère de la cote 1, sur la hauteur des modalités de chaque variable
    // point de la référence, sur la ligne de la cote 1
    Plot.dot(intitules, {x: x(1), y: "y", r: 1.2, fill: COULEURS.pointRef, stroke: "none"}),
    Plot.ruleY(modalites, {y: "y", x1: (d) => x(d.bas), x2: (d) => x(d.haut), stroke: COULEURS.texte, strokeWidth: 0.6}),
    Plot.dot(modalites.filter((d) => d.tronque), {x: (d) => x(d.haut) + 1.2, y: "y", symbol: "triangle", rotate: 90, r: 1.6, fill: COULEURS.texte, stroke: "none"}),
    Plot.dot(modalites, {x: (d) => x(d.cote), y: "y", r: 2.1, strokeWidth: 0.9, stroke: COULEURS.point,
      fill: (d) => (d.significatif ? COULEURS.point : "#FFFFFF")}),
    texte(intitules, {x: MARGE, y: "y", text: "variable", textAnchor: "start", fontFamily: GRAS, fontWeight: 700, fill: COULEURS.intitule}),
    texte(intitules, {x: x(1) + 4, y: "y", text: (d) => `réf. : ${d.reference}`, textAnchor: "start", fill: COULEURS.secondaire}),
    texte(modalites, {x: FIN_MODALITES, y: "y", text: "modalite", textAnchor: "end", fill: COULEURS.texte}),
    texte(modalites, {x: FIN_VALEURS, y: "y", text: (d) => virgule(d.ecrite), textAnchor: "end", fill: COULEURS.texte}),
    // périmètre
    texte([0], {x: MARGE, y: 6, text: () => PERIMETRE, textAnchor: "start", fontSize: CORPS + 1, fontFamily: GRAS, fontWeight: 700, fill: COULEURS.intitule}),
    // axe du bas
    Plot.ruleY([y + 2], {x1: DEBUT_TRACE, x2: LARGEUR - MARGE, stroke: COULEURS.texte, strokeWidth: 0.6}),
    Plot.ruleX(graduations, {x: (d) => x(d), y1: y + 2, y2: y + 4.5, stroke: COULEURS.texte, strokeWidth: 0.6}),
    texte(graduations, {x: (d) => x(d), y: y + 9.5, text: (d) => virgule(d, 0), fill: COULEURS.texte}),
    texte([0], {x: FIN_VALEURS, y: y + 9.5, text: () => "Cotes relatives et intervalles", textAnchor: "end", fill: COULEURS.secondaire}),
    texte([0], {x: FIN_VALEURS, y: y + 18.5, text: () => "de confiance à 95 %", textAnchor: "end", fill: COULEURS.secondaire}),
    texte([0], {x: (DEBUT_TRACE + LARGEUR - MARGE) / 2, y: y + 22, lineAnchor: "top", dy: -CORPS / 2, text: () => TITRE_AXE, fontFamily: GRAS, fontWeight: 700, fill: COULEURS.intitule})
  ]
});

const svg = plot.tagName.toLowerCase() === "svg" ? plot : plot.querySelector("svg");
svg.querySelectorAll("style").forEach((s) => s.remove());
svg.removeAttribute("class");
svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
svg.setAttribute("viewBox", `0 0 ${LARGEUR} ${HAUTEUR}`);
svg.setAttribute("width", `${LARGEUR}pt`);
svg.setAttribute("height", `${HAUTEUR}pt`);
fs.mkdirSync(path.dirname(sortie), {recursive: true});
fs.writeFileSync(sortie, `<?xml version="1.0" encoding="UTF-8"?>\n${svg.outerHTML}\n`);
console.log(`${path.basename(sortie)} : ${LARGEUR} × ${HAUTEUR} pt (plafond ${HAUTEUR_MAX}), pas ${PAS.toFixed(2)} pt, ${modalites.length} modalités, ${intitules.length} variables`);
