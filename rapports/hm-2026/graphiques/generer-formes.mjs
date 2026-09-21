// Génère les graphiques qui ne sont pas des barres empilées : barres groupées (une barre par série et par item)
// et colonnes empilées côte à côte (G78). Données dans donnees-extraites/, reconstituées depuis les anciens SVG.
// Usage : node generer-formes.mjs [G9 G78 …] → sortie/<id>.svg

import fs from "node:fs";
import path from "node:path";
import * as d3 from "d3";
import {FORMES} from "./catalogue-formes.mjs";
import {teinte, cleExtraite} from "./couleurs.mjs";
import {BLOCS, EXTRAITS, CORPS, VALEUR, MARGE, MARGE_X, ESPACE_LIBELLE, INTERLIGNE_LIBELLE, largeurTexte, lignesLibelle, colonnePour, bornes, equilibrer, lireGroupes} from "./disposition.mjs";

const ICI = path.dirname(new URL(import.meta.url).pathname);
const SORTIE = path.join(ICI, "sortie");

const ARDOISE = teinte("ardoise 700"), PETROLE = teinte("petrole 700"), GRILLE = "#E6ECEF", BLANC = "#FFFFFF";

const echapper = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const texte = (x, y, s, {taille = CORPS, couleur = ARDOISE, ancre = "start", gras = false} = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" dy="0.35em" text-anchor="${ancre}" font-family="Poppins${gras ? "-Bold" : "-Regular"}, Poppins"${gras ? ` font-weight="700"` : ""} font-size="${taille}" fill="${couleur}">${echapper(s)}</text>`;
const multiligne = (x, y, s, options, colonne) => lignesLibelle(s, colonne).map((l, i, a) => texte(x, y + (i - (a.length - 1) / 2) * INTERLIGNE_LIBELLE, l, options)).join("");

function groupes(g) {
  const donnees = lireGroupes(g.id);
  if (g.items) { let i = -1; donnees.forEach((d, k) => { if (k % g.series.length === 0) i++; d.item = g.items[i]; }); }
  const items = [...new Set(donnees.map((d) => d.item))];
  const series = g.series;
  const {colonne, plafond: COLONNE, voisins} = colonnePour(g.id);
  const valeurDe = (item, serie) => { const d = donnees.find((d) => d.item === item && d.serie === serie); return d && d.valeur !== "" ? +d.valeur : 0; };
  // la fin du tracé recule pour que la valeur écrite en bout de la barre la plus longue et la dernière graduation restent dans la marge
  const {DEBUT: DEBUT_TRACE, DROITE_MAX} = bornes(g.largeur, colonne, 0, false);
  let FIN_TRACE = DROITE_MAX - largeurTexte(g.max) / 2;
  for (const item of items) for (const [serie] of series) {
    const v = valeurDe(item, serie);
    if (v > 0) FIN_TRACE = Math.min(FIN_TRACE, DEBUT_TRACE + (DROITE_MAX - 3 - largeurTexte(`${v} %`, VALEUR) - DEBUT_TRACE) / (v / g.max));
  }
  const x = d3.scaleLinear([0, g.max], [DEBUT_TRACE, FIN_TRACE]);
  const BARRE = 6, ECART = 1.5, ENTRE_ITEMS = 9;
  let y = MARGE, svg = "", barres = "";
  if (g.entete) {
    const lignes = lignesLibelle(g.entete, DROITE_MAX - DEBUT_TRACE, CORPS, true);
    lignes.forEach((l, i) => { barres += texte(DEBUT_TRACE, y + 6 + i * 9, l, {couleur: PETROLE, gras: true}); });
    y += 18 + (lignes.length - 1) * 9;
  }
  const debutTrace = y;
  for (const item of items) {
    const h = series.length * BARRE + (series.length - 1) * ECART;
    barres += multiligne(DEBUT_TRACE - ESPACE_LIBELLE, y + h / 2, item, {ancre: "end"}, COLONNE);
    series.forEach(([serie, couleur], i) => {
      const v = valeurDe(item, serie);
      const yb = y + i * (BARRE + ECART);
      barres += `<rect x="${x(0).toFixed(2)}" y="${yb.toFixed(2)}" width="${(x(v) - x(0)).toFixed(2)}" height="${BARRE}" fill="${teinte(couleur)}"/>`;
      barres += texte(x(v) + 3, yb + BARRE / 2, `${v} %`, {taille: VALEUR});
    });
    y += h + ENTRE_ITEMS;
  }
  const finTrace = y - ENTRE_ITEMS + 2;
  const graduations = x.ticks(4);
  svg += graduations.map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="${debutTrace}" y2="${finTrace + 1}" stroke="${GRILLE}" stroke-width="0.4"/>`).join("") + barres;
  y = finTrace + 1;
  svg += `<line x1="${DEBUT_TRACE}" x2="${FIN_TRACE}" y1="${y}" y2="${y}" stroke="${ARDOISE}" stroke-width="0.6"/>`;
  svg += graduations.map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="${y}" y2="${y + 2.5}" stroke="${ARDOISE}" stroke-width="0.6"/>${texte(x(v), y + 8, v, {ancre: "middle"})}`).join("");
  y += 24;
  if (g.legende) { svg += texte(DEBUT_TRACE, y, g.legende, {couleur: PETROLE, gras: true}); y += 13; }
  let lx = DEBUT_TRACE;
  for (const [serie, couleur] of series) {
    const l = 12 + largeurTexte(serie) + 12;
    if (lx + l - 12 > DROITE_MAX && lx > DEBUT_TRACE) { lx = DEBUT_TRACE; y += 13; }
    svg += `<rect x="${lx.toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" fill="${teinte(couleur)}"/>` + texte(lx + 12, y, serie);
    lx += l;
  }
  return {svg, hauteur: Math.ceil(y + MARGE), axeX: DEBUT_TRACE, finX: FIN_TRACE, colonne, voisins};
}

function colonnes(g) {
  const donnees = d3.dsvFormat(";").parse(fs.readFileSync(path.join(EXTRAITS, `${g.id}_colonnes.csv`), "utf8"));
  const valeurs = [...new Set(donnees.map((d) => d.valeur))];
  const LARGEUR_COL = 96, HAUT_TRACE = 62, AXE_X = MARGE_X + 20, ESPACE = 44;
  let y = MARGE, svg = "";
  for (const v of valeurs) {
    svg += texte(AXE_X, y + 5, v, {couleur: PETROLE, gras: true});
    y += 14;
    const echelle = d3.scaleLinear([0, 100], [y + HAUT_TRACE, y]);
    for (const t of [0, 25, 50, 75, 100]) {
      svg += `<line x1="${AXE_X}" x2="${g.largeur - MARGE_X}" y1="${echelle(t)}" y2="${echelle(t)}" stroke="${GRILLE}" stroke-width="0.4"/>` + texte(AXE_X - 4, echelle(t), t, {taille: 6, ancre: "end"});
    }
    g.colonnes.forEach(([titre, segments], ic) => {
      const cx = AXE_X + 16 + ic * (LARGEUR_COL + ESPACE);
      let cumul = 0;
      for (const [reponse, couleur] of segments) {
        const d = donnees.find((d) => d.valeur === v && d.couleur.toUpperCase() === cleExtraite(couleur).toUpperCase());
        const p = d ? +d.pct : 0;
        const yh = echelle(cumul + p), yb = echelle(cumul);
        svg += `<rect x="${cx}" y="${yh.toFixed(2)}" width="${LARGEUR_COL}" height="${(yb - yh).toFixed(2)}" fill="${teinte(couleur)}"/>`;
        if (p >= 6) svg += texte(cx + LARGEUR_COL / 2, (yh + yb) / 2, p, {taille: VALEUR, couleur: BLANC, ancre: "middle"});
        cumul += p;
      }
      svg += texte(cx + LARGEUR_COL / 2, y + HAUT_TRACE + 8, titre, {ancre: "middle"});
    });
    y += HAUT_TRACE + 24;
  }
  y += 2;
  // une légende sous chaque colonne, de haut en bas dans l'ordre de l'empilement
  g.colonnes.forEach(([, segments], ic) => {
    const lx = AXE_X + 16 + ic * (LARGEUR_COL + ESPACE);
    [...segments].reverse().forEach(([reponse, couleur], k) => {
      svg += `<rect x="${lx}" y="${y + k * 13 - 4}" width="8" height="8" fill="${teinte(couleur)}"/>` + texte(lx + 12, y + k * 13, reponse);
    });
  });
  y += 13 * Math.max(...g.colonnes.map(([, segments]) => segments.length));
  return {svg, hauteur: Math.ceil(y + MARGE - 4), axeX: AXE_X, finX: g.largeur - MARGE_X, colonne: AXE_X - MARGE_X, voisins: []};
}

// aires empilées (G40) : une série par réponse, une valeur numérique en abscisse, légende alignée sur l'axe vertical
function aires(g) {
  const donnees = d3.dsvFormat(";").parse(fs.readFileSync(path.join(EXTRAITS, `${g.id}_aires.csv`), "utf8"), (d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, +v])));
  const abscisses = donnees.map((d) => d.abscisse);
  const {DEBUT: DEBUT_TRACE, DROITE_MAX} = bornes(g.largeur, Math.ceil(largeurTexte(g.max)), 0, false);
  const FIN_TRACE = DROITE_MAX - largeurTexte(d3.max(abscisses)) / 2;
  const x = d3.scaleLinear(d3.extent(abscisses), [DEBUT_TRACE, FIN_TRACE]);
  const HAUT_TRACE = 170;
  let y = MARGE + 12, svg = "";
  svg += texte(DEBUT_TRACE - ESPACE_LIBELLE, MARGE + 3, g.unite, {ancre: "end"});
  const echelle = d3.scaleLinear([0, g.max], [y + HAUT_TRACE, y]);
  svg += d3.range(0, g.max + 1, g.pas).map((t) => `<line x1="${DEBUT_TRACE}" x2="${FIN_TRACE}" y1="${echelle(t)}" y2="${echelle(t)}" stroke="${GRILLE}" stroke-width="0.4"/>` + texte(DEBUT_TRACE - ESPACE_LIBELLE, echelle(t), t, {ancre: "end"})).join("");
  let cumul = donnees.map(() => 0);
  for (const [serie, couleur] of g.series) {
    const bas = cumul, haut = donnees.map((d, i) => bas[i] + d[serie]);
    const trace = d3.area().x((_, i) => x(abscisses[i])).y0((_, i) => echelle(bas[i])).y1((_, i) => echelle(haut[i]));
    svg += `<path d="${trace(donnees)}" fill="${teinte(couleur)}"/>`;
    cumul = haut;
  }
  y += HAUT_TRACE;
  svg += `<line x1="${DEBUT_TRACE}" x2="${FIN_TRACE}" y1="${y}" y2="${y}" stroke="${ARDOISE}" stroke-width="0.6"/>`;
  svg += abscisses.map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="${y}" y2="${y + 2.5}" stroke="${ARDOISE}" stroke-width="0.6"/>${texte(x(v), y + 8, v, {ancre: "middle"})}`).join("");
  y += 18;
  svg += texte((DEBUT_TRACE + FIN_TRACE) / 2, y, g.abscisse, {ancre: "middle"});
  y += 20;
  svg += texte(DEBUT_TRACE, y, g.legende, {couleur: PETROLE, gras: true});
  y += 13;
  let lx = DEBUT_TRACE;
  for (const [serie, couleur] of g.series) {
    svg += `<rect x="${lx.toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" fill="${teinte(couleur)}"/>` + texte(lx + 12, y, serie);
    lx += 12 + largeurTexte(serie) + 12;
  }
  return {svg, hauteur: Math.ceil(y + MARGE), axeX: DEBUT_TRACE, finX: FIN_TRACE, colonne: DEBUT_TRACE - MARGE_X, voisins: []};
}

const ids = process.argv.slice(2);
fs.mkdirSync(SORTIE, {recursive: true});
for (const g of FORMES.filter((g) => !ids.length || ids.includes(g.id))) {
  const {svg, hauteur, axeX, finX, colonne, voisins} = g.type === "groupes" ? groupes(g) : g.type === "aires" ? aires(g) : colonnes(g);
  fs.writeFileSync(path.join(SORTIE, `${g.id}.svg`), equilibrer(`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${g.largeur}pt" height="${hauteur}pt" viewBox="0 0 ${g.largeur} ${hauteur}" data-axe-x="${axeX.toFixed(1)}" data-fin-x="${finX.toFixed(1)}">${svg}</svg>\n`));
  console.log(`${g.id.padEnd(4)} p${String(BLOCS[g.fichier]?.page ?? "?").padEnd(4)} ${g.largeur} × ${hauteur} pt (colonne ${colonne}${voisins.length ? ` alignée sur ${voisins.join(" ")}` : ""}, tracé ${(finX - axeX).toFixed(0)}) → ${g.fichier}`);
}
