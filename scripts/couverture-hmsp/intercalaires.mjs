// Pistes d'intercalaires (page de gauche, pétrole 50) reprenant le graphique de la couverture.
// Usage : node intercalaires.mjs → ../../exports/couverture-hmsp/intercalaire-<piste>.svg

import fs from "node:fs";
import path from "node:path";
import * as d3 from "d3";

const ICI = path.dirname(new URL(import.meta.url).pathname);
const SORTIE = path.join(ICI, "../../exports/couverture-hmsp");
const W = 595.28, H = 841.89, LISIERE = 557;
const FOND = "#EDF7FD", BLANC = "#FFFFFF", P100 = "#D1EBF9", P200 = "#97D1F2", P600 = "#096286";
// colonne de la couverture (216 → 521,6) reflétée sur une page de gauche
const X1 = W - 521.57, X2 = W - 216;
const x = d3.scaleLinear([0, 100], [X1, X2]);

const G3 = d3.dsvFormat(";").parse(fs.readFileSync("/Users/lucaspoulain/Downloads/Donnees_graphiques/G3_bien_etre_general_croise_travail.csv", "utf8"),
  (d) => ({general: d.v1, travail: d.v2, pct: +d.pct.replace(",", ".")}));
const REPONSES = ["Bien", "Plutôt bien", "Plutôt mal", "Mal", "Ne sait pas ou autre"];
const LIGNES = ["Bien", "Plutôt bien", "Plutôt mal", "Mal"];

const page = (contenu) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}pt" height="${H}pt" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${FOND}"/>${contenu}</svg>`;

function barres({epaisseur, ecart, bas, couleurLigne, ecartSegment = 1}) {
  let y = bas - (LIGNES.length * epaisseur + (LIGNES.length - 1) * ecart), svg = "";
  LIGNES.forEach((v, i) => {
    let debut = 0;
    for (const r of REPONSES) {
      const {pct} = G3.find((d) => d.travail === v && d.general === r);
      svg += `<rect x="${x(debut).toFixed(2)}" y="${y}" width="${Math.max(0, x(debut + pct) - x(debut) - ecartSegment).toFixed(2)}" height="${epaisseur}" fill="${couleurLigne(i)}"/>`;
      debut += pct;
    }
    y += epaisseur + ecart;
  });
  return svg;
}

// A. La structure seule : la grille de graduations et l'axe sur la lisière, sans barres.
const grille = [0, 25, 50, 75, 100].map((g) => `<line x1="${x(g)}" x2="${x(g)}" y1="0" y2="${LISIERE}" stroke="${g === 0 ? P200 : P100}" stroke-width="${g === 0 ? 0.8 : 0.5}"/>`).join("")
  + `<line x1="${X1}" x2="${X2}" y1="${LISIERE}" y2="${LISIERE}" stroke="${P200}" stroke-width="0.8"/>`;
const A = page(grille);

// B. Les barres en blanc, à la place de l'arc, sans grille ni libellés.
const B = page(barres({epaisseur: 34, ecart: 7, bas: 528, couleurLigne: () => BLANC}));

// C. Repère de partie : les quatre barres en blanc, celle de la partie en pétrole 200 (ici la 2e).
const C = page(barres({epaisseur: 34, ecart: 7, bas: 528, couleurLigne: (i) => (i === 1 ? P200 : BLANC)}));

// D. Une grande barre à fond perdu : la première ligne, sortie de la page à gauche, en blanc.
let d = "", debut = 0;
for (const r of REPONSES) {
  const {pct} = G3.find((dd) => dd.travail === "Bien" && dd.general === r);
  const xd = d3.scaleLinear([0, 100], [-40, X2]);
  d += `<rect x="${xd(debut).toFixed(2)}" y="${LISIERE - 120}" width="${Math.max(0, xd(debut + pct) - xd(debut) - 1.5).toFixed(2)}" height="120" fill="${BLANC}"/>`;
  debut += pct;
}
const D = page(d);

fs.mkdirSync(SORTIE, {recursive: true});
for (const [n, s] of Object.entries({A, B, C, D})) fs.writeFileSync(path.join(SORTIE, `intercalaire-${n}.svg`), s);
console.log("ok");
