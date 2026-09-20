// Cale les bords des blocs de texte sur la grille de mise en page du document actif.
//   Bords gauche et droit : marges et colonnes de la page, repères verticaux de la page et de son gabarit.
//   Bords haut et bas     : marges haute et basse, repères horizontaux de la page et de son gabarit.
// Un bord ne bouge que s'il est à moins de la tolérance d'un repère ; au-delà il reste en place et le rapport le signale.
// Les bords gauche et droit ne bougent que si les deux sont sur la grille ou dans la tolérance.
// Titres et précisions de graphiques (styles d'objet reconnus par MOTIF_GRAPHIQUES) : calés en largeur, mais en hauteur seulement à moins de 0,75 pt, pour garder leur distance au graphique.
// Sans sélection : tous les blocs de texte non vides posés sur les pages. Avec sélection : les blocs sélectionnés.
// Laissés en place : blocs verrouillés, pivotés, groupés, ancrés, et tout bloc que le calage ferait déborder.
// Lancer d'abord en simulation. Toute l'application s'annule d'un seul Cmd+Z.

#target indesign

var TOLERANCE_DEFAUT = 5; // points
// Titles and notes of charts are placed relative to their chart: vertically they only follow the systematic grid shift.
var MOTIF_GRAPHIQUES = /graphique|^TG\b|pr[eé]cision/i;
var TOL_Y_GRAPHIQUES = 0.75;
var SEUIL_CALE = 0.02;           // below this distance an edge counts as already aligned

if (app.documents.length === 0) { alert("Aucun document ouvert."); exit(); }
var doc = app.activeDocument;
var saisie = prompt("Tolérance en points : un bord plus éloigné d’un repère que cette valeur n’est pas déplacé.", String(TOLERANCE_DEFAUT));
if (saisie === null) exit();
var TOL = parseFloat(String(saisie).replace(",", "."));
if (isNaN(TOL) || TOL <= 0) { alert("Tolérance invalide."); exit(); }
var blocSelectionne = false;
for (var s = 0; s < app.selection.length; s++) if (app.selection[s].constructor.name === "TextFrame") blocSelectionne = true;
if (app.selection.length && !blocSelectionne &&
    !confirm("La s\u00e9lection ne contient aucun bloc de texte. Traiter tout le document ?")) exit();
var appliquer = confirm("OK = APPLIQUER le calage.\nAnnuler = SIMULER (rien n’est modifié, un rapport est produit).");

function arrondi(v) { return Math.round(v * 100) / 100; }

function ajouter(liste, v) {
  for (var i = 0; i < liste.length; i++) if (Math.abs(liste[i] - v) < SEUIL_CALE) return;
  liste.push(v);
}

function pageDeMemeCote(planche, page) {
  var pages = planche.pages;
  for (var i = 0; i < pages.length; i++) if (pages[i].side === page.side) return pages[i];
  return pages[0];
}

function lireReperes(planche, pageRef, X, Y) {
  var reperes = planche.guides.everyItem().getElements();
  for (var i = 0; i < reperes.length; i++) {
    var r = reperes[i], surLaPage = false;
    try { surLaPage = r.parentPage && r.parentPage.isValid && r.parentPage.id === pageRef.id; } catch (e) {}
    if (r.orientation === HorizontalOrVertical.HORIZONTAL) {
      if (surLaPage || !r.fitToPage) ajouter(Y, r.location);
    } else if (surLaPage) {
      ajouter(X, r.location);
    }
  }
}

function reperesDe(page) {
  var X = [], Y = [];
  var b = page.bounds, largeur = b[3] - b[1], hauteur = b[2] - b[0];
  var m = page.marginPreferences;
  var miroir = doc.documentPreferences.facingPages && page.side === PageSideOptions.LEFT_HAND;
  var gauche = miroir ? m.right : m.left, droite = miroir ? m.left : m.right;
  ajouter(Y, m.top); ajouter(Y, hauteur - m.bottom);
  ajouter(X, gauche); ajouter(X, largeur - droite);
  // page edges and bleed: full-width blocks and chart titles run to them
  var dp = doc.documentPreferences;
  var fondInt = dp.documentBleedInsideOrLeftOffset, fondExt = dp.documentBleedOutsideOrRightOffset;
  ajouter(X, 0); ajouter(X, largeur); ajouter(X, -(miroir ? fondExt : fondInt)); ajouter(X, largeur + (miroir ? fondInt : fondExt));
  ajouter(Y, 0); ajouter(Y, hauteur); ajouter(Y, -dp.documentBleedTopOffset); ajouter(Y, hauteur + dp.documentBleedBottomOffset);
  var n = m.columnCount, g = m.columnGutter, perso = false;
  try { perso = m.customColumns; } catch (e) {}
  if (perso) {
    var pos = m.columnsPositions;
    for (var i = 0; i < pos.length; i++) ajouter(X, gauche + pos[i]);
  } else if (n > 1) {
    var lc = (largeur - gauche - droite - (n - 1) * g) / n;
    for (var c = 0; c < n; c++) { ajouter(X, gauche + c * (lc + g)); ajouter(X, gauche + c * (lc + g) + lc); }
  }
  lireReperes(page.parent, page, X, Y);
  var gabarit = page.appliedMaster, garde = 0;
  while (gabarit && gabarit.isValid && garde++ < 5) {
    lireReperes(gabarit, pageDeMemeCote(gabarit, page), X, Y);
    gabarit = gabarit.appliedMaster;
  }
  X.sort(function (a, b2) { return a - b2; });
  Y.sort(function (a, b2) { return a - b2; });
  return { X: X, Y: Y };
}

function plusProche(liste, v) {
  var best = null;
  for (var i = 0; i < liste.length; i++) if (best === null || Math.abs(liste[i] - v) < Math.abs(best - v)) best = liste[i];
  return best;
}

// Returns the move to apply to one edge: 0 when aligned or too far, and says which.
function ecart(liste, v, stats, tol) {
  var c = plusProche(liste, v);
  if (c === null) return { d: 0, note: "?" };
  var d = c - v;
  if (Math.abs(d) < SEUIL_CALE) { stats.cales++; return { d: 0, note: "0" }; }
  if (Math.abs(d) <= tol) {
    stats.deplaces++;
    var cle = (Math.ceil(Math.abs(d) * 2) / 2).toFixed(1);
    stats.histo[cle] = (stats.histo[cle] || 0) + 1;
    return { d: d, note: (d > 0 ? "+" : "") + arrondi(d) };
  }
  stats.loin++;
  return { d: 0, note: "loin (" + arrondi(d) + ")" };
}

function blocsCibles() {
  var cibles = [], i;
  if (app.selection.length) {
    for (i = 0; i < app.selection.length; i++) if (app.selection[i].constructor.name === "TextFrame") cibles.push(app.selection[i]);
    if (cibles.length) return cibles;
  }
  var pages = doc.pages.everyItem().getElements();
  for (var p = 0; p < pages.length; p++) {
    var blocs = pages[p].textFrames.everyItem().getElements();
    for (i = 0; i < blocs.length; i++) cibles.push(blocs[i]);
  }
  return cibles;
}

function traiter() {
  var stats = { cales: 0, deplaces: 0, loin: 0, histo: {} };
  var lignes = [], modifies = 0, intacts = 0, ecartes = 0, debordements = 0, relignes = 0;
  var cache = {}, echantillons = {}, parStyle = {};
  var cibles = blocsCibles();
  for (var i = 0; i < cibles.length; i++) {
    var f = cibles[i], page = null;
    try { page = f.parentPage; } catch (e) {}
    if (!page || !page.isValid || f.contents === "") continue;
    if (f.locked || f.itemLayer.locked || Math.abs(f.rotationAngle) > 0.01 || f.parent.constructor.name === "Group" || f.parent.constructor.name === "Character") { ecartes++; continue; }
    if (!cache[page.id]) {
      cache[page.id] = reperesDe(page);
      var cote = page.side === PageSideOptions.LEFT_HAND ? "page de gauche" : "page de droite";
      if (!echantillons[cote]) echantillons[cote] = "p" + page.name + " (" + cote + ")\n  X : " + cache[page.id].X.join("  ").replace(/(\.\d\d)\d+/g, "$1") + "\n  Y : " + cache[page.id].Y.join("  ").replace(/(\.\d\d)\d+/g, "$1");
    }
    var style = "?";
    try { style = f.appliedObjectStyle.name; } catch (e3) {}
    var tolY = MOTIF_GRAPHIQUES.test(style) ? Math.min(TOL, TOL_Y_GRAPHIQUES) : TOL;
    var R = cache[page.id], gb = f.geometricBounds;
    var h = ecart(R.Y, gb[0], stats, tolY), g = ecart(R.X, gb[1], stats, TOL), b = ecart(R.Y, gb[2], stats, tolY), d = ecart(R.X, gb[3], stats, TOL);
    // A block whose other vertical edge is far from any column is not set on the grid: its width is left alone.
    if (g.note.indexOf("loin") === 0 || d.note.indexOf("loin") === 0) {
      if (g.d !== 0) { stats.deplaces--; g = { d: 0, note: "laiss\u00e9 (" + g.note + ")" }; }
      if (d.d !== 0) { stats.deplaces--; d = { d: 0, note: "laiss\u00e9 (" + d.note + ")" }; }
    }
    var auto = AutoSizingTypeEnum.OFF;
    try { auto = f.textFramePreferences.autoSizingType; } catch (e2) {}
    var nb;
    if (auto === AutoSizingTypeEnum.OFF) nb = [gb[0] + h.d, gb[1] + g.d, gb[2] + b.d, gb[3] + d.d];
    else if (auto === AutoSizingTypeEnum.HEIGHT_ONLY) nb = [gb[0] + h.d, gb[1] + g.d, gb[2] + h.d, gb[3] + d.d];
    else nb = [gb[0] + h.d, gb[1] + g.d, gb[2] + h.d, gb[3] + g.d];
    var bouge = Math.abs(nb[0] - gb[0]) + Math.abs(nb[1] - gb[1]) + Math.abs(nb[2] - gb[2]) + Math.abs(nb[3] - gb[3]) > SEUIL_CALE;
    var statut = bouge ? (appliquer ? "calé" : "à caler") : "en place";
    if (bouge && (nb[2] - nb[0] < 1 || nb[3] - nb[1] < 1)) { bouge = false; statut = "laissé : bloc trop petit après calage"; }
    if (bouge && appliquer) {
      var debordait = f.overflows, nLignes = f.lines.length;
      f.geometricBounds = nb;
      if (f.overflows && !debordait) { f.geometricBounds = gb; statut = "LAISSÉ : le calage faisait déborder le texte"; debordements++; bouge = false; }
      else if (f.lines.length !== nLignes) { statut += ", lignes " + nLignes + " → " + f.lines.length; relignes++; }
    }
    if (bouge) modifies++; else intacts++;
    if (!parStyle[style]) parStyle[style] = { blocs: 0, haut: 0, bas: 0, cotes: 0 };
    parStyle[style].blocs++;
    if (h.d !== 0) parStyle[style].haut++;
    if (b.d !== 0) parStyle[style].bas++;
    if (g.d !== 0 || d.d !== 0) parStyle[style].cotes++;
    var loin = (h.note + g.note + b.note + d.note).indexOf("loin") >= 0;
    if (bouge || loin || statut.indexOf("LAISS") === 0) {
      var debut = String(f.contents).substr(0, 32).replace(/[\r\n\t]/g, " ");
      lignes.push("p" + page.name + "\thaut " + h.note + " | gauche " + g.note + " | bas " + b.note + " | droite " + d.note + (auto !== AutoSizingTypeEnum.OFF ? " | taille auto" : "") + "\t" + statut + "\t[" + style + "]" + "\t« " + debut + " »");
    }
  }
  return { stats: stats, lignes: lignes, modifies: modifies, intacts: intacts, ecartes: ecartes, debordements: debordements, relignes: relignes, echantillons: echantillons, parStyle: parStyle, total: cibles.length };
}

var res, erreur = null;
var unite = app.scriptPreferences.measurementUnit, origine = doc.viewPreferences.rulerOrigin, zero = doc.zeroPoint, redessin = app.scriptPreferences.enableRedraw;
function regler() {
  app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
  doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
  doc.zeroPoint = [0, 0];
}
function retablir() {
  doc.viewPreferences.rulerOrigin = origine;
  doc.zeroPoint = zero;
  app.scriptPreferences.measurementUnit = unite;
  app.scriptPreferences.enableRedraw = redessin;
}
app.scriptPreferences.enableRedraw = false;
try {
  if (appliquer) {
    app.doScript(function () { regler(); res = traiter(); doc.viewPreferences.rulerOrigin = origine; doc.zeroPoint = zero; }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Calage des blocs de texte");
  } else {
    regler();
    res = traiter();
  }
} catch (e) {
  erreur = e;
} finally {
  retablir();
}
if (erreur) { alert("Erreur : " + erreur.message + (erreur.line ? " (ligne " + erreur.line + ")" : "")); exit(); }

var mode = appliquer ? "application" : "simulation";
var histo = [];
for (var cle in res.stats.histo) histo.push(cle);
histo.sort(function (a, b) { return parseFloat(a) - parseFloat(b); });
for (var k = 0; k < histo.length; k++) histo[k] = "  jusqu’à " + histo[k] + " pt : " + res.stats.histo[histo[k]] + " bord(s)";

var sortie = [
  "Mode : " + mode + ", tolérance " + TOL + " pt",
  "Blocs " + (appliquer ? "calés" : "à caler") + " : " + res.modifies + " ; déjà en place ou hors tolérance : " + res.intacts + " ; écartés (verrouillés, pivotés, groupés, ancrés) : " + res.ecartes,
  "Bords déjà sur un repère : " + res.stats.cales + " ; bords déplacés : " + res.stats.deplaces + " ; bords trop loin d’un repère : " + res.stats.loin,
  appliquer ? "Blocs laissés pour débordement : " + res.debordements + " ; blocs dont le nombre de lignes a changé : " + res.relignes : "",
  "",
  "Déplacements par taille :"
].concat(histo.length ? histo : ["  aucun"]).concat(["", "Repères lus (en points depuis le coin haut gauche de la page) :"]);
for (var cote in res.echantillons) sortie.push(res.echantillons[cote]);
sortie.push("", "Par style d’objet (blocs, dont bord haut à déplacer, bord bas, côtés) :");
for (var st in res.parStyle) sortie.push("  " + st + " : " + res.parStyle[st].blocs + " blocs, haut " + res.parStyle[st].haut + ", bas " + res.parStyle[st].bas + ", côtés " + res.parStyle[st].cotes);
sortie = sortie.concat(["", "Détail des blocs concernés :"]).concat(res.lignes);

var fichier = new File(doc.filePath + "/rapport-calage-" + mode + ".txt");
fichier.encoding = "UTF-8";
fichier.lineFeed = "Unix";
fichier.open("w");
fichier.write(sortie.join("\n") + "\n");
fichier.close();
alert((appliquer ? "Calage terminé" : "Simulation terminée") + ".\nBlocs " + (appliquer ? "calés" : "à caler") + " : " + res.modifies + "\nBords trop loin d’un repère : " + res.stats.loin + (appliquer ? "\nLaissés pour débordement : " + res.debordements : "") + "\n\nRapport : " + fichier.fsName);
