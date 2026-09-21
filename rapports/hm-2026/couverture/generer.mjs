// Génère des pistes de couverture pour l'étude « Hiérarchie et management » avec des graphiques présents dans le rapport.
// Usage : node generer.mjs → sortie/<piste>.svg (A4 en points)

import fs from "node:fs";
import path from "node:path";
import * as d3 from "d3";

const ICI = path.dirname(new URL(import.meta.url).pathname);
const SORTIE = path.join(ICI, "sortie");
const FORET = path.join(ICI, "../annexes/donnees");
import {DONNEES as DONNEES_G} from "../graphiques/disposition.mjs";
import {teinte} from "../graphiques/couleurs.mjs";

const W = 595.28, H = 841.89, CHAMP = 557;
const GAUCHE = 51, DROITE = 522; // marge du titre, bord droit de l'année
const FILET = {x1: 216, x2: 440, y: 751};

// S.petrole[600] lit le palier dans le spectre courant
const famille = (nom) => new Proxy({}, {get: (_, palier) => teinte(`${nom} ${palier}`)});
const S = {petrole: famille("petrole"), ardoise: famille("ardoise")};
const BLANC = "#FFFFFF";

const logo = (couleur) => `data:image/png;base64,${fs.readFileSync(path.join(ICI, `logo-${couleur}.png`)).toString("base64")}`;

function page({fond, bande, signe, logoCouleur, etude, etudeY = 522, filet = S.petrole[700]}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}pt" height="${H}pt" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${CHAMP}" fill="${fond}"/>
<rect y="${CHAMP}" width="${W}" height="${H - CHAMP}" fill="${bande}"/>
${signe}
<image x="36" y="34" width="94.3" height="79.9" xlink:href="${logo(logoCouleur)}"/>
<text x="${GAUCHE}" y="${etudeY}" font-family="Poppins" font-weight="700" font-size="23" fill="${etude}">Étude</text>
<text font-family="Poppins" font-size="25" fill="${S.petrole[600]}"><tspan x="${GAUCHE}" y="600">Hiérarchie et management</tspan><tspan x="${GAUCHE}" y="631">dans le service public</tspan></text>
<line x1="${FILET.x1}" x2="${FILET.x2}" y1="${FILET.y}" y2="${FILET.y}" stroke="${filet}" stroke-width="0.75"/>
<text x="${DROITE}" y="761" text-anchor="end" font-family="Merriweather" font-weight="700" font-size="26" fill="${S.petrole[700]}">2026</text>
</svg>`;
}

const texte = (x, y, contenu, {taille, couleur, ancre = "start", gras = false}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" dy="0.35em" text-anchor="${ancre}" font-family="Poppins"${gras ? ` font-weight="700"` : ""} font-size="${taille}" fill="${couleur}">${contenu}</text>`;
const virgule = (v, n = 1) => v.toFixed(n).replace(".", ",");

// Extrait de l'annexe A1 limité aux variables qui portent sur la hiérarchie, dessiné avec les règles de l'annexe à une échelle k.
function foretHierarchie({x0, y0, k, domaine, c, interligne = 1.5}) {
  const lignes = d3.csvParse(fs.readFileSync(path.join(FORET, "A1.csv"), "utf8"), d3.autoType)
    .filter((d) => /hiérarchi/i.test(d.variable));
  const corps = 7 * k, largeur = 350 * k;
  const MARGE = 6 * k, FIN_MODALITES = 146 * k, FIN_VALEURS = 164 * k, DEBUT_TRACE = 178 * k;
  const PAS = corps * interligne, PAS_INTITULE = PAS * 1.08, RETRAIT = 0.6 * k;
  const x = d3.scaleLinear(domaine, [x0 + DEBUT_TRACE, x0 + largeur - MARGE]);
  let y = y0, svg = "", marques = "";
  for (const [i, [variable, groupe]] of d3.groups(lignes, (d) => d.variable).entries()) {
    const haut = y;
    y += RETRAIT;
    const yi = y + PAS_INTITULE / 2;
    marques += `<circle cx="${x(1)}" cy="${yi}" r="${1.2 * k}" fill="${c.pointRef}"/>`;
    marques += texte(x0 + MARGE, yi, variable, {taille: corps, couleur: c.intitule, gras: true});
    marques += texte(x(1) + 4 * k, yi, `réf. : ${groupe[0].reference.replace(/'/g, "’")}`, {taille: corps, couleur: c.secondaire});
    y += PAS_INTITULE;
    for (const m of groupe) {
      const ym = y + PAS / 2;
      marques += `<line x1="${x(m.ic_bas)}" x2="${x(m.ic_haut)}" y1="${ym}" y2="${ym}" stroke="${c.texte}" stroke-width="${0.6 * k}"/>`;
      marques += `<circle cx="${x(m.cote)}" cy="${ym}" r="${2.1 * k}" stroke="${c.point}" stroke-width="${0.9 * k}" fill="${m.significatif ? c.point : c.creux}"/>`;
      marques += texte(x0 + FIN_MODALITES, ym, m.modalite.replace(/'/g, "’").replace("je n’en jamais eu", "je n’en ai jamais eu"), {taille: corps, couleur: c.texte, ancre: "end"});
      marques += texte(x0 + FIN_VALEURS, ym, virgule(m.cote_ecrite), {taille: corps, couleur: c.texte, ancre: "end"});
      y += PAS;
    }
    y += RETRAIT;
    if (i % 2 === 0) svg += `<rect x="${x0}" y="${haut}" width="${largeur}" height="${y - haut}" fill="${c.bande}"/>`;
  }
  const graduations = d3.range(domaine[0], domaine[1] + 1);
  svg += graduations.filter((g) => g !== 1).map((g) => `<line x1="${x(g)}" x2="${x(g)}" y1="${y0}" y2="${y + 2 * k}" stroke="${c.grille}" stroke-width="${0.4 * k}"/>`).join("");
  svg += `<line x1="${x(1)}" x2="${x(1)}" y1="${y0}" y2="${y + 2 * k}" stroke="${c.grilleUn}" stroke-width="${0.6 * k}"/>`;
  svg += marques;
  const ya = y + 2 * k;
  svg += `<line x1="${x.range()[0]}" x2="${x.range()[1]}" y1="${ya}" y2="${ya}" stroke="${c.texte}" stroke-width="${0.6 * k}"/>`;
  svg += graduations.map((g) => `<line x1="${x(g)}" x2="${x(g)}" y1="${ya}" y2="${ya + 2.5 * k}" stroke="${c.texte}" stroke-width="${0.6 * k}"/>${texte(x(g), ya + 7.5 * k, g, {taille: corps, couleur: c.texte, ancre: "middle"})}`).join("");
  svg += texte(x0 + FIN_VALEURS, ya + 7.5 * k, "Cotes relatives et intervalles", {taille: corps, couleur: c.secondaire, ancre: "end"});
  svg += texte(x0 + FIN_VALEURS, ya + 16.5 * k, "de confiance à 95 %", {taille: corps, couleur: c.secondaire, ancre: "end"});
  svg += texte((x.range()[0] + x.range()[1]) / 2, ya + 16.5 * k, "Se sentir mal ou plutôt mal au travail", {taille: corps, couleur: c.intitule, ancre: "middle", gras: true});
  return {svg, xUn: x(1), bas: ya + 20 * k};
}

const CLAIR = {bande: BLANC, texte: S.ardoise[700], intitule: S.petrole[700], secondaire: S.ardoise[500], grille: S.ardoise[100], grilleUn: S.ardoise[300], pointRef: S.ardoise[400], point: S.petrole[500], creux: BLANC};
const SOMBRE = {bande: S.petrole[650], texte: S.petrole[100], intitule: BLANC, secondaire: S.petrole[250], grille: S.petrole[550], grilleUn: S.petrole[250], pointRef: S.petrole[250], point: BLANC, creux: S.petrole[600]};

// 1b. Extrait « hiérarchie » de l'annexe A1, sur fond clair.
function foretClaire() {
  const {svg} = foretHierarchie({x0: GAUCHE - 8, y0: 178, k: 1.45, domaine: [0, 3], c: CLAIR, interligne: 2.1});
  return page({fond: S.ardoise[50], bande: BLANC, signe: svg, logoCouleur: "petrole", etude: S.petrole[700]});
}

// 1c. Même extrait sur le champ pétrole ; la ligne de la cote 1 part du haut de la page.
function foretPetrole() {
  const y0 = 178;
  const {svg, xUn} = foretHierarchie({x0: GAUCHE - 8, y0, k: 1.45, domaine: [0, 3], c: SOMBRE, interligne: 2.1});
  const prolongement = `<line x1="${xUn}" x2="${xUn}" y1="0" y2="${y0}" stroke="${S.petrole[250]}" stroke-width="0.87"/>`;
  return page({fond: S.petrole[600], bande: S.petrole[50], signe: prolongement + svg, logoCouleur: "blanc", etude: BLANC});
}

// Barres de G1, avec les couleurs et les libellés du rapport.
const REPONSES = ["Bien", "Plutôt bien", "Plutôt mal", "Mal", "Ne sait pas ou autre"];
const COULEUR_REPONSE = {"Bien": "#007777", "Plutôt bien": "#32C2C2", "Plutôt mal": "#EBBF95", "Mal": "#C24146", "Ne sait pas ou autre": S.ardoise[100]};
const TEXTE_BLANC = new Set(["Bien", "Mal"]);
const lireG1 = (n) => d3.dsvFormat(";").parse(fs.readFileSync(path.join(DONNEES_G, `G1_bien_etre_travail_general_versant_${n}.csv`), "utf8"),
  (d) => ({reponse: d.v1, versant: d.v2, pct: +d.pct.replace(",", ".")}));

function barresG1({y0, x1, x2, epaisseur, ecart, corps, etiquettes, sousTitres, groupes = [["Bien-être en général", 1], ["Bien-être au travail", 2]]}) {
  const x = d3.scaleLinear([0, 100], [x1, x2]);
  let y = y0, svg = "";
  for (const [titre, n] of groupes) {
    const donnees = lireG1(n);
    if (titre) {
      svg += texte((x1 + x2) / 2, y, titre, {taille: corps + 1, couleur: sousTitres, ancre: "middle", gras: true});
      y += corps * 1.6;
    }
    for (const v of ["FPE", "FPT", "FPH"]) {
      let debut = 0;
      for (const r of REPONSES) {
        const {pct} = donnees.find((d) => d.versant === v && d.reponse === r);
        svg += `<rect x="${x(debut).toFixed(2)}" y="${y}" width="${(x(debut + pct) - x(debut)).toFixed(2)}" height="${epaisseur}" fill="${COULEUR_REPONSE[r]}"/>`;
        if (pct >= 4.5) svg += texte((x(debut) + x(debut + pct)) / 2, y + epaisseur / 2, Math.round(pct), {taille: corps, couleur: TEXTE_BLANC.has(r) ? BLANC : S.ardoise[700], ancre: "middle"});
        debut += pct;
      }
      svg += texte(x1 - 6, y + epaisseur / 2, v, {taille: corps, couleur: etiquettes, ancre: "end"});
      y += epaisseur + ecart;
    }
    y += corps * 2.2;
  }
  return {svg, bas: y};
}

// 4b. Les deux sous-graphiques de G1, sur fond clair.
function barresClaires() {
  const {svg} = barresG1({y0: 196, x1: GAUCHE + 34, x2: DROITE, epaisseur: 30, ecart: 5, corps: 10, etiquettes: S.ardoise[700], sousTitres: S.petrole[700]});
  return page({fond: S.ardoise[50], bande: BLANC, signe: svg, logoCouleur: "petrole", etude: S.petrole[700]});
}

// 4c. « Bien-être au travail » posé sur la limite entre le champ pétrole et la bande claire.
function barresLisiere() {
  const epaisseur = 26, ecart = 3;
  const y0 = CHAMP - 3 * epaisseur - 2 * ecart;
  const {svg} = barresG1({y0, x1: GAUCHE + 34, x2: DROITE, epaisseur, ecart, corps: 10, etiquettes: BLANC, sousTitres: BLANC, groupes: [[null, 2]]});
  const titre = texte((GAUCHE + 34 + DROITE) / 2, y0 - 18, "Bien-être au travail", {taille: 11, couleur: BLANC, ancre: "middle", gras: true});
  return page({fond: S.petrole[600], bande: S.petrole[50], signe: svg + titre, logoCouleur: "blanc", etude: BLANC, etudeY: y0 - 70});
}

// Filigranes : les tracés sans libellés, en couleur unique à faible opacité.
// Le graphique commence au bord gauche du filet de l'année et sort de la page à droite.

// A1 entière : bandes, grille, ligne de la cote 1, intervalles et points.
function foretFiligrane({encre, opacite}) {
  const donnees = lireForetA1();
  const x = d3.scaleLinear([0, 3], [FILET.x1, W + 30]);
  const nbLignes = d3.sum(d3.groups(donnees, (d) => d.variable), ([, g]) => g.length + 1);
  const pas = (CHAMP - 60) / nbLignes;
  let y = 30, svg = "";
  for (const [i, [, groupe]] of d3.groups(donnees, (d) => d.variable).entries()) {
    const haut = y;
    y += pas;
    for (const m of groupe) {
      const ym = y + pas / 2;
      svg += `<line x1="${x(m.ic_bas)}" x2="${x(Math.min(m.ic_haut, 3.2))}" y1="${ym}" y2="${ym}" stroke="${encre}" stroke-opacity="${opacite.trait}" stroke-width="1.1"/>`;
      svg += `<circle cx="${x(m.cote)}" cy="${ym}" r="2.6" fill="${encre}" fill-opacity="${m.significatif ? opacite.point : 0}" stroke="${encre}" stroke-opacity="${opacite.point}" stroke-width="0.9"/>`;
      y += pas;
    }
    if (i % 2 === 0) svg = `<rect x="${FILET.x1}" y="${haut}" width="${W - FILET.x1}" height="${y - haut}" fill="${encre}" fill-opacity="${opacite.bande}"/>` + svg;
  }
  const grille = [0, 2, 3].map((g) => `<line x1="${x(g)}" x2="${x(g)}" y1="0" y2="${CHAMP}" stroke="${encre}" stroke-opacity="${opacite.grille}" stroke-width="0.5"/>`).join("");
  const un = `<line x1="${x(1)}" x2="${x(1)}" y1="0" y2="${CHAMP}" stroke="${encre}" stroke-opacity="${opacite.un}" stroke-width="0.8"/>`;
  return grille + un + svg;
}
const lireForetA1 = () => d3.csvParse(fs.readFileSync(path.join(FORET, "A1.csv"), "utf8"), d3.autoType);

// 1d. Filigrane de A1 sur le champ pétrole.
function foretFiligranePetrole() {
  const signe = foretFiligrane({encre: BLANC, opacite: {bande: 0.04, grille: 0.1, un: 0.35, trait: 0.32, point: 0.45}});
  return page({fond: S.petrole[600], bande: S.petrole[50], signe, logoCouleur: "blanc", etude: BLANC});
}

// 1e. Filigrane de A1 sur fond clair.
function foretFiligraneClair() {
  const signe = foretFiligrane({encre: S.petrole[600], opacite: {bande: 0.035, grille: 0.08, un: 0.3, trait: 0.28, point: 0.38}});
  return page({fond: S.petrole[50], bande: BLANC, signe, logoCouleur: "petrole", etude: S.petrole[700]});
}

// Barres de G1 sans libellés ; chaque réponse est une opacité de la même encre, de « Bien » à « Ne sait pas ».
function barresFiligrane({groupes, y0, epaisseur, ecart, entreGroupes, encre, opacites, x1 = FILET.x1, x2 = W}) {
  const x = d3.scaleLinear([0, 100], [x1, x2]);
  let y = y0, svg = "";
  for (const n of groupes) {
    const donnees = lireG1(n);
    for (const v of ["FPE", "FPT", "FPH"]) {
      let debut = 0;
      REPONSES.forEach((r, i) => {
        const {pct} = donnees.find((d) => d.versant === v && d.reponse === r);
        svg += `<rect x="${x(debut).toFixed(2)}" y="${y}" width="${Math.max(0, x(debut + pct) - x(debut) - 1).toFixed(2)}" height="${epaisseur}" fill="${Array.isArray(encre) ? encre[i] : encre}" fill-opacity="${opacites[i]}"/>`;
        debut += pct;
      });
      y += epaisseur + ecart;
    }
    y += entreGroupes;
  }
  return svg;
}

// 4d. Les deux sous-graphiques de G1 en blanc translucide sur le champ pétrole.
function barresFiligranePetrole() {
  const signe = barresFiligrane({groupes: [1, 2], y0: 232, epaisseur: 22, ecart: 4, entreGroupes: 30, encre: BLANC, opacites: [0.5, 0.3, 0.16, 0.08, 0.03]});
  return page({fond: S.petrole[600], bande: S.petrole[50], signe, logoCouleur: "blanc", etude: BLANC});
}

// 4f. Les deux sous-graphiques de G1 en pétrole translucide sur fond clair.
function barresFiligraneClaires() {
  const signe = barresFiligrane({groupes: [1, 2], y0: 232, epaisseur: 22, ecart: 4, entreGroupes: 30, encre: S.petrole[600], opacites: [0.42, 0.24, 0.13, 0.07, 0.03]});
  return page({fond: S.petrole[50], bande: BLANC, signe, logoCouleur: "petrole", etude: S.petrole[700]});
}

// 4e. « Bien-être au travail » en blanc translucide, posé sur la limite du champ et sorti de la page des deux côtés.
function barresLisiereDiscretes() {
  const epaisseur = 16, ecart = 3;
  const y0 = CHAMP - 3 * epaisseur - 2 * ecart;
  const signe = barresFiligrane({groupes: [2], y0, epaisseur, ecart, entreGroupes: 0, x1: 0, x2: W,
    encre: BLANC, opacites: [0.5, 0.3, 0.16, 0.08, 0.03]});
  return page({fond: S.petrole[600], bande: S.petrole[50], signe, logoCouleur: "blanc", etude: BLANC, etudeY: y0 - 26});
}

// Barres avec axes : graduations 0 à 100 sur une grille verticale, étiquettes de graduation sous l'axe.
const GRADUATIONS = [0, 25, 50, 75, 100];
const OPACITES_BLANC = [0.5, 0.3, 0.16, 0.08, 0.03];
const OPACITES_PETROLE = [0.42, 0.24, 0.13, 0.07, 0.03];

function barresAxees({x1, x2, y0, epaisseur, ecart, entreGroupes, groupes, encre, opacites, grilleY1, grilleY2, axeY, etiquettesY, versants, versantsX}) {
  const x = d3.scaleLinear([0, 100], [x1, x2]);
  const grille = GRADUATIONS.map((g) => `<line x1="${x(g)}" x2="${x(g)}" y1="${grilleY1}" y2="${grilleY2}" stroke="${encre}" stroke-opacity="${g === 0 ? 0.5 : 0.14}" stroke-width="${g === 0 ? 0.8 : 0.5}"/>`).join("");
  const axe = `<line x1="${x1}" x2="${x(100)}" y1="${axeY}" y2="${axeY}" stroke="${encre}" stroke-opacity="0.5" stroke-width="0.8"/>`
    + GRADUATIONS.map((g) => `<line x1="${x(g)}" x2="${x(g)}" y1="${axeY}" y2="${axeY + (etiquettesY < axeY ? -4 : 4)}" stroke="${encre}" stroke-opacity="0.5" stroke-width="0.8"/>`).join("")
    + GRADUATIONS.map((g) => texte(x(g), etiquettesY, g === 100 ? "100 %" : g, {taille: 7.5, couleur: encre, ancre: "middle"})).join("").replaceAll("<text ", `<text fill-opacity="0.6" `);
  let y = y0, svg = "";
  for (const n of groupes) {
    const donnees = lireG1(n);
    ["FPE", "FPT", "FPH"].forEach((v, iv) => {
      let debut = 0;
      REPONSES.forEach((r, i) => {
        const {pct} = donnees.find((d) => d.versant === v && d.reponse === r);
        svg += `<rect x="${x(debut).toFixed(2)}" y="${y}" width="${Math.max(0, x(debut + pct) - x(debut) - 0.8).toFixed(2)}" height="${epaisseur}" fill="${encre}" fill-opacity="${opacites[i]}"/>`;
        debut += pct;
      });
      if (versants) svg += texte(versantsX, y + epaisseur / 2, v, {taille: 7.5, couleur: encre, ancre: "end"}).replace("<text ", `<text fill-opacity="0.55" `);
      y += epaisseur + ecart;
    });
    y += entreGroupes;
  }
  return {svg: grille + svg + axe, bas: y};
}

// 4g. Les deux sous-graphiques de G1, calés entre le filet et l'année ; la grille traverse le champ, l'axe et ses graduations sont sur la lisière.
function barresAxeesLisiere() {
  const epaisseur = 24, ecart = 5, entreGroupes = 30;
  const hauteur = 2 * (3 * epaisseur + 2 * ecart) + entreGroupes;
  const y0 = CHAMP - 26 - hauteur;
  const {svg} = barresAxees({x1: FILET.x1, x2: DROITE, y0, epaisseur, ecart, entreGroupes, groupes: [1, 2], encre: BLANC, opacites: OPACITES_BLANC,
    grilleY1: 0, grilleY2: CHAMP, axeY: CHAMP, etiquettesY: -100, versants: true, versantsX: FILET.x1 - 8});
  // les étiquettes de graduation se posent dans la bande claire, en pétrole
  const x = d3.scaleLinear([0, 100], [FILET.x1, DROITE]);
  const etiquettes = GRADUATIONS.map((g) => texte(x(g), CHAMP + 12, g === 100 ? "100 %" : g, {taille: 7.5, couleur: S.petrole[700], ancre: "middle"})).join("");
  return page({fond: S.petrole[600], bande: S.petrole[50], signe: svg + etiquettes, logoCouleur: "blanc", etude: BLANC});
}

// 4h. G1 « au travail » en grand, sur toute la largeur du titre ; la grille descend du haut de la page jusqu'à l'axe.
function barresAxeesGrandes() {
  const epaisseur = 48, ecart = 10, y0 = 286;
  const axeY = y0 + 3 * epaisseur + 2 * ecart + 8;
  const {svg} = barresAxees({x1: GAUCHE, x2: DROITE, y0, epaisseur, ecart, entreGroupes: 0, groupes: [2], encre: BLANC, opacites: OPACITES_BLANC,
    grilleY1: 0, grilleY2: axeY, axeY, etiquettesY: axeY + 12, versants: false});
  return page({fond: S.petrole[600], bande: S.petrole[50], signe: svg, logoCouleur: "blanc", etude: BLANC});
}

// 4i. Fond clair, les deux sous-graphiques de G1 en pétrole translucide sur la largeur du titre, axe gradué en haut du bloc et libellés de versant.
function barresAxeesClaires() {
  const epaisseur = 30, ecart = 6, entreGroupes = 30, y0 = 190;
  const bas = y0 + 2 * (3 * epaisseur + 2 * ecart) + entreGroupes;
  const {svg} = barresAxees({x1: GAUCHE + 30, x2: DROITE, y0, epaisseur, ecart, entreGroupes, groupes: [1, 2], encre: S.petrole[700], opacites: OPACITES_PETROLE,
    grilleY1: y0 - 10, grilleY2: bas, axeY: y0 - 10, etiquettesY: y0 - 20, versants: true, versantsX: GAUCHE + 22});
  return page({fond: S.petrole[50], bande: BLANC, signe: svg, logoCouleur: "petrole", etude: S.petrole[700]});
}

// Finale. Composition 4g : G3, « Comment vous sentez-vous au travail ? » selon le bien-être en général (p. 21), normalisé à 100 %, dans la colonne du filet et de l'année.
// « Rapport » reste à sa place à gauche ; le bas des barres est aligné sur sa ligne de base ; l'axe est posé sur la lisière, ses graduations dans la bande.
// Tailles et positions des textes relevées dans le PDF V8 : Rapport et titre Poppins 26, année Merriweather Black 26.
function finale({sansHabillage = false} = {}) {
  // relevés dans l'export du document du 21 septembre 2026 : lisière du champ et ligne de base de « Rapport »
  const CHAMP = 558.044, BASE_RAPPORT = 532.04, TRAIT = 0.8;
  const x1 = FILET.x1, x2 = 521.57, epaisseur = 34, ecart = 7, encre = BLANC;
  const lignes = ["Bien", "Plutôt bien", "Plutôt mal", "Mal"];
  const y0 = BASE_RAPPORT - (lignes.length * epaisseur + (lignes.length - 1) * ecart);
  const x = d3.scaleLinear([0, 100], [x1, x2]);
  let y = y0, barres = "", versants = "";
  const donnees = d3.dsvFormat(";").parse(fs.readFileSync(path.join(DONNEES_G, "G3_bien_etre_general_croise_travail.csv"), "utf8"),
    (d) => ({general: d.v1, travail: d.v2, pct: +d.pct.replace(",", ".")}));
  for (const v of lignes) {
    let debut = 0;
    REPONSES.forEach((r, i) => {
      const {pct} = donnees.find((d) => d.travail === v && d.general === r);
      barres += `<rect x="${x(debut).toFixed(2)}" y="${y}" width="${Math.max(0, x(debut + pct) - x(debut) - 0.8).toFixed(2)}" height="${epaisseur}" fill="${encre}" fill-opacity="${OPACITES_BLANC[i]}"/>`;
      debut += pct;
    });
    versants += texte(x1 - 7, y + epaisseur / 2, v, {taille: 7, couleur: encre, ancre: "end"}).replace("<text ", `<text fill-opacity="0.5" `);
    y += epaisseur + ecart;
  }
  // Aucun tracé translucide n'en recouvre un autre, pour qu'aucune surépaisseur claire n'apparaisse :
  // la ligne 0 longe le bord gauche des barres, la ligne 100 est continue au-delà de leur bord droit, les autres s'interrompent derrière les barres
  // et s'arrêtent au-dessus de l'axe, l'axe part du bord droit de la ligne 0.
  const xTrait = (g) => (g === 0 ? x1 - TRAIT / 2 : x(g));
  const hautBarres = lignes.map((_, i) => y0 + i * (epaisseur + ecart));
  const troncons = [[-14, y0], ...hautBarres.slice(1).map((h) => [h - ecart, h]), [hautBarres.at(-1) + epaisseur, CHAMP - TRAIT]];
  const grille = `<line x1="${xTrait(0)}" x2="${xTrait(0)}" y1="-14" y2="${CHAMP}" stroke="${encre}" stroke-opacity="0.5" stroke-width="${TRAIT}"/>`
    + GRADUATIONS.slice(1).map((g) => (g === 100 ? [[-14, CHAMP - TRAIT]] : troncons).map(([a, b]) => `<line x1="${x(g)}" x2="${x(g)}" y1="${a}" y2="${b}" stroke="${encre}" stroke-opacity="0.13" stroke-width="0.5"/>`).join("")).join("");
  // axe sur la lisière : trait blanc dans le champ, graduations et étiquettes dans la bande, dans le prolongement des lignes
  const axe = `<line x1="${x1}" x2="${x2 + 0.25}" y1="${CHAMP - TRAIT / 2}" y2="${CHAMP - TRAIT / 2}" stroke="${encre}" stroke-opacity="0.5" stroke-width="${TRAIT}"/>`
    + GRADUATIONS.map((g) => `<line x1="${xTrait(g)}" x2="${xTrait(g)}" y1="${CHAMP}" y2="${CHAMP + 4}" stroke="${S.petrole[600]}" stroke-opacity="0.6" stroke-width="${g === 0 ? TRAIT : 0.6}"/>`
      + texte(xTrait(g), CHAMP + 12, g === 100 ? "100 %" : g, {taille: 7, couleur: S.petrole[600], ancre: "middle"})).join("");
  const graphique = grille + barres + versants + axe;
  // le bloc du graphique seul part du bord gauche de la page et couvre le fond perdu de 14 pt à droite, en tête et en pied ;
  // le dessin est décalé de la hauteur du fond perdu de tête, et la grille monte jusqu'au bord du bloc
  const FOND_PERDU = 14, largeurBloc = (595.276 + FOND_PERDU).toFixed(3), hauteurBloc = (H + 2 * FOND_PERDU).toFixed(2);
  if (sansHabillage) return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeurBloc}pt" height="${hauteurBloc}pt" viewBox="0 0 ${largeurBloc} ${hauteurBloc}"><g transform="translate(0,${FOND_PERDU})">${graphique}</g></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}pt" height="${H}pt" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${CHAMP}" fill="${S.petrole[600]}"/>
<rect y="${CHAMP}" width="${W}" height="${H - CHAMP}" fill="${S.petrole[50]}"/>
${graphique}
<image x="36" y="34" width="94.3" height="79.9" xlink:href="${logo("blanc")}"/>
<text x="${GAUCHE}" y="${BASE_RAPPORT}" font-family="Poppins" font-weight="700" font-size="26" fill="${S.petrole[50]}">Rapport</text>
<text font-family="Poppins" font-size="26" fill="${S.petrole[600]}"><tspan x="${GAUCHE}" y="599">Travailler dans le service public :</tspan><tspan x="${GAUCHE}" y="630.2">enquête sur le vécu des</tspan><tspan x="${GAUCHE}" y="661.4">agent·es public·ques</tspan></text>
<line x1="${FILET.x1}" x2="${FILET.x2}" y1="${FILET.y}" y2="${FILET.y}" stroke="${S.petrole[600]}" stroke-width="0.75"/>
<text x="${x2}" y="755" text-anchor="end" font-family="Merriweather" font-weight="900" font-size="26" fill="${S.petrole[600]}">2026</text>
</svg>`;
}

fs.mkdirSync(SORTIE, {recursive: true});
for (const [nom, f] of Object.entries({"1b-foret-claire": foretClaire, "1c-foret-petrole": foretPetrole, "4b-barres-claires": barresClaires, "4c-barres-lisiere": barresLisiere,
  "1d-foret-filigrane-petrole": foretFiligranePetrole, "1e-foret-filigrane-clair": foretFiligraneClair, "4d-barres-filigrane": barresFiligranePetrole, "4e-barres-lisiere-discretes": barresLisiereDiscretes, "4f-barres-filigrane-claires": barresFiligraneClaires, "4g-barres-axees-lisiere": barresAxeesLisiere, "4h-barres-axees-grandes": barresAxeesGrandes, "4i-barres-axees-claires": barresAxeesClaires, "finale-couverture": finale, "finale-graphique-seul": () => finale({sansHabillage: true})})) {
  fs.writeFileSync(path.join(SORTIE, `${nom}.svg`), f());
  console.log(nom);
}
