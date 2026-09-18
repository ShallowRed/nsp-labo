// Génère les graphiques à barres empilées du catalogue, à la largeur de leur bloc InDesign, en points.
// Usage : node generer.mjs [G1 G2 …]   (sans argument : tout le catalogue) → sortie/<id>.svg
// Les titres restent dans InDesign ; le SVG contient les groupes, les barres, l'axe et la légende.

import fs from "node:fs";
import path from "node:path";
import * as d3 from "d3";
import {CATALOGUE, JEUX} from "./catalogue.mjs";
import {BLOCS, EXTRAITS, CORPS, VALEUR, MARGE, MARGE_X, ESPACE_LIBELLE, INTERLIGNE_LIBELLE, largeurTexte, lignesLibelle, colonnePour, bornes} from "./disposition.mjs";

const ICI = path.dirname(new URL(import.meta.url).pathname);
const DONNEES = "/Users/lucaspoulain/Downloads/Donnees_graphiques";
const SORTIE = path.join(ICI, "sortie");

const ARDOISE = "#3B4348", PETROLE = "#0B4862", GRILLE = "#E6ECEF", BLANC = "#FFFFFF";
const SEUIL_VALEUR = 4.5;
// Pas des barres uniforme dans tout le rapport
const BARRE_FIXE = 13;
const ECART = (b) => b * 0.28, ENTRE_GROUPES = (b) => b * 1.1, INTITULE = (b) => b + 4;
const AXE = 24, LEGENDE_LIGNE = 13;

const echapper = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const texte = (x, y, s, {taille = CORPS, couleur = ARDOISE, ancre = "start", gras = false} = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" dy="0.35em" text-anchor="${ancre}" font-family="Poppins${gras ? "-Bold" : "-Regular"}, Poppins"${gras ? ` font-weight="700"` : ""} font-size="${taille}" fill="${couleur}">${echapper(s)}</text>`;
const libelleMultiligne = (x, y, s, options, colonne) => {
  const lignes = lignesLibelle(s, colonne);
  return lignes.map((l, i) => texte(x, y + (i - (lignes.length - 1) / 2) * INTERLIGNE_LIBELLE, l, options)).join("");
};

const fichierDonnees = (id, n, jeu) => {
  const dossier = fs.existsSync(EXTRAITS) && fs.readdirSync(EXTRAITS).some((f) => f.startsWith(`${id}_extrait`)) ? EXTRAITS : DONNEES;
  const nom = fs.readdirSync(dossier).find((f) => f.startsWith(`${id}_`) && (n === "" ? !/_\d\.csv$/.test(f) : f.endsWith(`_${n}.csv`)));
  if (!nom) throw new Error(`données introuvables pour ${id} (${n})`);
  // les libellés de R contiennent parfois des retours à la ligne : on les replie en espaces
  const plat = (s) => s.replace(/\s+/g, " ").trim();
  // une réponse donnée comme couleur (données extraites d'un SVG) est traduite par le jeu de couleurs du graphique
  const reponse = (v) => (v.startsWith("#") ? jeu.reponses[jeu.couleurs.map((c) => c.toUpperCase()).indexOf(v.toUpperCase())] ?? v : v);
  return d3.dsvFormat(";").parse(fs.readFileSync(path.join(dossier, nom), "utf8"), (d) => ({reponse: reponse(plat(d.v1)), modalite: plat(d.v2), pct: +d.pct.replace(",", ".")}));
};

function generer(g) {
  const {reponses, couleurs, blanc, libelles: libellesReponses = reponses} = JEUX[g.jeu];
  const {colonne, plafond: COLONNE, voisins} = colonnePour(g.id);
  // la dernière graduation (« 100 ») est centrée sur la fin du tracé : sa moitié droite déborde
  const {DEBUT: DEBUT_TRACE, FIN: FIN_TRACE, DROITE_MAX} = bornes(g.largeur, colonne, largeurTexte("100") / 2, g.colonne === undefined);
  const x = d3.scaleLinear([0, 100], [DEBUT_TRACE, FIN_TRACE]);
  const LARGEUR_LEGENDE = DROITE_MAX - DEBUT_TRACE - 12;
  const BARRE = g.barre ?? BARRE_FIXE;
  let y = MARGE, barres = "";
  const segments = []; // étendue verticale des barres de chaque groupe, pour les lignes de grille
  for (const gr of g.groupes) {
    const donnees = fichierDonnees(g.id, gr.fichier, JEUX[g.jeu]);
    // l'intitulé passe sur plusieurs lignes s'il dépasse la zone de tracé ; le libellé d'axe (« Versant FP ») le suit sur sa propre ligne
    const lignesIntitule = gr.intitule ? lignesLibelle(gr.intitule, DROITE_MAX - DEBUT_TRACE, CORPS, true) : [];
    lignesIntitule.forEach((l, i) => { barres += texte(DEBUT_TRACE, y + INTITULE(BARRE) / 2 - 1 + i * 9, l, {couleur: PETROLE, gras: true}); });
    if (lignesIntitule.length) y += INTITULE(BARRE) + (lignesIntitule.length - 1) * 9;
    if (gr.axe) { barres += texte(DEBUT_TRACE, y + INTITULE(BARRE) / 2 - 1, gr.axe, {gras: true}); y += INTITULE(BARRE); }
    const hautGroupe = y;
    for (const [cle, lib = cle] of gr.modalites) {
      let debut = 0;
      reponses.forEach((r, i) => {
        const d = donnees.find((d) => d.modalite === cle && d.reponse === r);
        if (i === 0 && !donnees.some((d) => d.modalite === cle)) throw new Error(`${g.id} : modalité « ${cle} » absente du fichier ${gr.fichier}`);
        const pct = d ? d.pct : 0;
        if (pct > 0) barres += `<rect x="${x(debut).toFixed(2)}" y="${y.toFixed(2)}" width="${(x(debut + pct) - x(debut)).toFixed(2)}" height="${BARRE}" fill="${couleurs[i]}"/>`;
        if (pct >= SEUIL_VALEUR) barres += texte((x(debut) + x(debut + pct)) / 2, y + BARRE / 2, Math.round(pct), {taille: VALEUR, couleur: blanc.includes(i) ? BLANC : ARDOISE, ancre: "middle"});
        debut += pct;
      });
      barres += libelleMultiligne(DEBUT_TRACE - ESPACE_LIBELLE, y + BARRE / 2, lib, {ancre: "end"}, COLONNE);
      y += BARRE + ECART(BARRE);
    }
    segments.push([hautGroupe, y - ECART(BARRE)]);
    y += ENTRE_GROUPES(BARRE) - ECART(BARRE);
  }
  const finTrace = y - ENTRE_GROUPES(BARRE) + ECART(BARRE) + 1;
  const graduations = d3.range(0, 101, 25);
  // lignes de grille continues, de la première barre du premier groupe à la dernière barre du dernier
  const hautGrille = segments[0][0], basGrille = segments[segments.length - 1][1];
  let svg = graduations.map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="${hautGrille.toFixed(2)}" y2="${basGrille.toFixed(2)}" stroke="${GRILLE}" stroke-width="0.4"/>`).join("") + barres;
  y = finTrace + 1;
  svg += `<line x1="${DEBUT_TRACE}" x2="${FIN_TRACE}" y1="${y}" y2="${y}" stroke="${ARDOISE}" stroke-width="0.6"/>`;
  svg += graduations.map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="${y}" y2="${y + 2.5}" stroke="${ARDOISE}" stroke-width="0.6"/>${texte(x(v), y + 8, v, {ancre: "middle"})}`).join("");
  y += AXE;
  // légende alignée sur l'axe, sur plusieurs lignes si nécessaire
  let lx = DEBUT_TRACE;
  libellesReponses.forEach((r, i) => {
    const l = 12 + largeurTexte(r) + 12;
    if (lx + l - 12 > DROITE_MAX && lx > DEBUT_TRACE) { lx = DEBUT_TRACE; y += LEGENDE_LIGNE; }
    const lignes = lignesLibelle(r, LARGEUR_LEGENDE);
    svg += `<rect x="${lx.toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" fill="${couleurs[i]}"/>`;
    lignes.forEach((t, k) => { svg += texte(lx + 12, y + k * 9, t); });
    if (lignes.length > 1) { y += (lignes.length - 1) * 9 + LEGENDE_LIGNE; lx = DEBUT_TRACE; } else lx += l;
  });
  if (lx === DEBUT_TRACE && libellesReponses.length) y -= LEGENDE_LIGNE;
  const HAUTEUR = Math.ceil(y + MARGE);
  // data-axe-x et data-fin-x : position de l'axe et bord droit du tracé, lus par le script InDesign pour caler titre et précisions
  return {barre: BARRE, colonne, voisins, trace: FIN_TRACE - DEBUT_TRACE, hauteur: HAUTEUR,
    svg: `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${g.largeur}pt" height="${HAUTEUR}pt" viewBox="0 0 ${g.largeur} ${HAUTEUR}" data-axe-x="${DEBUT_TRACE.toFixed(1)}" data-fin-x="${FIN_TRACE.toFixed(1)}">${svg}</svg>\n`};
}

const ids = process.argv.slice(2);
fs.mkdirSync(SORTIE, {recursive: true});
for (const g of CATALOGUE.filter((g) => !ids.length || ids.includes(g.id))) {
  const {svg, hauteur, barre, colonne, voisins, trace} = generer(g);
  fs.writeFileSync(path.join(SORTIE, `${g.id}.svg`), svg);
  console.log(`${g.id.padEnd(4)} p${String(BLOCS[g.fichier]?.page ?? "?").padEnd(4)} ${g.largeur} × ${hauteur} pt (bloc ${BLOCS[g.fichier]?.hauteur ?? "?"}, barre ${barre}, colonne ${colonne}${voisins.length ? ` alignée sur ${voisins.join(" ")}` : ""}, tracé ${trace.toFixed(0)}) → ${g.fichier}`);
}
