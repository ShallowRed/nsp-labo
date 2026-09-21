// Disposition commune aux générateurs : largeur réelle des textes en Poppins, retour à la ligne des libellés,
// colonne de libellés partagée par les graphiques d'une même page, et bornes de la zone de tracé.
// Le SVG a la largeur du bloc InDesign, qui est aussi le fond de page : tout ce qui est dessiné reste
// entre MARGE_X et largeur − MARGE_X, et la zone de tracé occupe toute la largeur restante.

import fs from "node:fs";
import path from "node:path";
import * as d3 from "d3";
import {CATALOGUE} from "./catalogue.mjs";
import {FORMES} from "./catalogue-formes.mjs";

const ICI = path.dirname(new URL(import.meta.url).pathname);
const AVANCES = JSON.parse(fs.readFileSync(path.join(ICI, "poppins-largeurs.json"), "utf8")); // chasse des glyphes, en em
export const BLOCS = JSON.parse(fs.readFileSync(path.join(ICI, "blocs.json"), "utf8")); // dimensions et pages des blocs InDesign, relevées dans l'IDML
export const EXTRAITS = path.join(ICI, "donnees-extraites"); // données reconstituées depuis les anciens SVG
// agrégats de la chaîne R : dépôt privé nsp-donnees cloné à côté de celui-ci, ou dossier donné par NSP_DONNEES
export const DONNEES = process.env.NSP_DONNEES ?? path.join(ICI, "../../../../nsp-donnees/hm-2026/graphiques");

export const CORPS = 7, VALEUR = 6.5, MARGE = 8;
export const MARGE_X = 24;
export const ESPACE_LIBELLE = 6; // entre la fin des libellés et l'axe
export const COLONNE_MAX = 72; // au-delà, le libellé passe à la ligne
export const COLONNE_MAX_GROUPES = 96;
export const INTERLIGNE_LIBELLE = 7.4;

export const largeurTexte = (s, corps = CORPS, gras = false) => {
  const table = AVANCES[gras ? "Poppins-Bold" : "Poppins-Regular"];
  let l = 0;
  for (const c of String(s)) l += (table[c] ?? 0.56) * corps;
  return l;
};

// coupe un libellé en lignes qui tiennent dans la colonne, aux espaces
export const lignesLibelle = (s, colonne = COLONNE_MAX, corps = CORPS, gras = false) => {
  if (largeurTexte(s, corps, gras) <= colonne) return [s];
  const lignes = [];
  let courante = "";
  for (const m of String(s).split(" ")) {
    const essai = courante ? `${courante} ${m}` : m;
    if (largeurTexte(essai, corps, gras) > colonne && courante) { lignes.push(courante); courante = m; } else courante = essai;
  }
  lignes.push(courante);
  return lignes;
};

// colonne de libellés la plus étroite qui laisse chaque libellé sur maxLignes lignes au plus ; au-delà du plafond, les libellés
// débordent en lignes. Retourne la largeur de colonne et le plafond de repli à utiliser pour couper les libellés
export const colonneReelle = (libelles, plafond = COLONNE_MAX, maxLignes = 2) => {
  const largeurLignes = (p) => Math.max(0, ...libelles.map((l) => Math.max(...lignesLibelle(l, p).map((t) => largeurTexte(t)))));
  for (let p = 20; p < plafond; p++) {
    if (libelles.every((l) => lignesLibelle(l, p).length <= maxLignes)) return {colonne: Math.ceil(largeurLignes(p)), plafond: p};
  }
  return {colonne: Math.ceil(largeurLignes(plafond)), plafond};
};
export const lignesMax = (hauteurBarre) => Math.max(1, Math.floor(hauteurBarre / INTERLIGNE_LIBELLE));

export const lireGroupes = (id) => d3.dsvFormat(";").parse(fs.readFileSync(path.join(EXTRAITS, `${id}_groupes.csv`), "utf8"));

// Colonne de libellés de chaque graphique : sa largeur réelle, ou celle du graphique voisin le plus large
// quand plusieurs graphiques de même largeur de bloc (à 8 pt près) sont sur la même page, pour que leurs axes coïncident.
// Seuls les graphiques de même forme s'alignent (barres empilées entre elles, barres groupées entre elles).
// Un graphique avec une colonne explicite (option colonne) ou aligner: false garde la sienne et n'influence pas les autres.
const COLONNES = (() => {
  const graphes = [
    // barres empilées : pas de ligne = barre + écart (28 %) ; barres groupées : hauteur du groupe + espace entre items
    ...CATALOGUE.map((g) => ({id: g.id, forme: "empilees", fichier: g.fichier, largeur: g.largeur, plafond: g.colonne ?? COLONNE_MAX, aligner: g.aligner ?? g.colonne === undefined,
      maxLignes: lignesMax((g.barre ?? 13) * 1.28), libelles: g.groupes.flatMap((gr) => gr.modalites.map(([cle, lib = cle]) => lib))})),
    ...FORMES.filter((g) => g.type === "groupes").map((g) => ({id: g.id, forme: "groupes", fichier: g.fichier, largeur: g.largeur, plafond: g.colonne ?? COLONNE_MAX_GROUPES, aligner: g.aligner ?? g.colonne === undefined,
      maxLignes: Math.min(3, lignesMax(g.series.length * 7.5 + 3)), libelles: g.items ?? [...new Set(lireGroupes(g.id).map((d) => d.item))]})),
  ];
  for (const g of graphes) { Object.assign(g, colonneReelle(g.libelles, g.plafond, g.maxLignes)); g.page = BLOCS[g.fichier]?.page; }
  const colonnes = new Map();
  for (const g of graphes) {
    let c = g.colonne, voisins = [];
    if (g.aligner && g.page) for (const h of graphes) {
      if (h !== g && h.aligner && h.forme === g.forme && h.page === g.page && Math.abs(h.largeur - g.largeur) <= 8) { c = Math.max(c, h.colonne); voisins.push(h.id); }
    }
    colonnes.set(g.id, {colonne: c, propre: g.colonne, plafond: g.plafond, voisins});
  }
  return colonnes;
})();

export const colonnePour = (id) => COLONNES.get(id);

// bornes horizontales : les libellés occupent [MARGE_X, MARGE_X + colonne], l'axe est à DEBUT, et l'espace à droite des barres
// reproduit celui pris à gauche par les libellés, pour que le tracé soit centré dans le bloc. Rien ne dépasse largeur − MARGE_X
// (droite = ce qui déborde à droite de FIN : moitié de la dernière graduation, valeurs en bout de barre)
// symetrique = false pour les graphiques à libellés longs (colonne explicite, barres groupées) : le tracé garde toute la largeur
export const bornes = (largeur, colonne, droite, symetrique = true) => {
  const DEBUT = MARGE_X + colonne + ESPACE_LIBELLE;
  const FIN = largeur - MARGE_X - droite;
  return {DEBUT, FIN: symetrique ? Math.min(largeur - DEBUT, FIN) : FIN, DROITE_MAX: largeur - MARGE_X};
};

// Équilibre les marges visibles du haut et du bas sans changer la hauteur du SVG : le contenu est décalé de la moitié
// de l'écart entre l'espace laissé au-dessus du premier élément dessiné et l'espace laissé sous le dernier.
// Les graphiques tracés avec des chemins (aires) ne sont pas mesurés et restent tels quels.
export const equilibrer = (svg) => {
  if (/<(path|polygon|polyline)\b/.test(svg)) return svg;
  const hauteur = +svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)[1];
  const hauts = [], bas = [];
  for (const m of svg.matchAll(/<rect [^>]*?y="([\d.]+)"[^>]*?height="([\d.]+)"/g)) { hauts.push(+m[1]); bas.push(+m[1] + +m[2]); }
  for (const m of svg.matchAll(/<text [^>]*?y="([\d.]+)"[^>]*?font-size="([\d.]+)"/g)) { hauts.push(+m[1] - 0.36 * +m[2]); bas.push(+m[1] + 0.36 * +m[2]); }
  if (!hauts.length) return svg;
  const decalage = (Math.min(...hauts) - (hauteur - Math.max(...bas))) / 2;
  if (Math.abs(decalage) < 0.5) return svg;
  return svg.replace(/(<svg [^>]*>)([\s\S]*)(<\/svg>)/, (_, debut, contenu, fin) => `${debut}<g transform="translate(0,${(-decalage).toFixed(1)})">${contenu}</g>${fin}`);
};
