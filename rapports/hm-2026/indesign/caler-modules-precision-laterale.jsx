// Met au carré les modules de graphiques dont la précision est posée à côté du graphique, et seulement ceux-là.
// Modèle (pages 51 et 55 du rapport) : le titre sur toute la largeur du module ; en dessous, le bloc du graphique à gauche
// et la précision à droite, sur la même étendue verticale ; le fond à la forme de l'ensemble.
//   1. Le haut du titre se cale sur la ligne de base la plus proche ; le titre prend la hauteur que demande son texte,
//      arrondie au pas de la grille. Une hauteur réglée à la main est gardée, arrondie au pas, tant que le texte y tient.
//   2. La précision garde sa position en largeur. Le bloc du graphique va du bord gauche du titre au bord de colonne qui
//      précède la précision ; l'image reste à 100 %, centrée dans son bloc.
//   3. Graphique et précision partent du bas du titre. Leur hauteur est la plus grande de : l'image arrondie au pas,
//      le texte de la précision arrondi au pas. Si le bas de la précision était sur un repère de rangée ou sur la marge
//      basse, l'étendue va jusqu'à ce repère.
//   4. Le fond prend la forme de l'ensemble ; un bord posé au bord de la page ou au fond perdu y reste. Un fond qui contient
//      aussi un graphique que ce script ne traite pas n'est pas touché.
// Ne sont pas traités : les modules dont la précision est sous le graphique (voir empiler-modules-graphiques.jsx), ceux
// dont le graphique ne tient pas dans son bloc, ceux dont la nouvelle hauteur dépasse l'objet suivant ou la marge basse.
// Avec une sélection, seuls les modules touchés par la sélection sont traités, et ils le sont même en conflit.
// La simulation applique, mesure, puis annule. L'application s'annule d'un seul Cmd+Z.

#target indesign

var MOTIF_TITRE = /^(titre graphique|tg sans t|titre annexe)/i;
var MOTIF_PRECISION = /^pr[eé]cision/i;
var MOTIF_FOND = /^fond graphique/i;
var RESERVE_IMAGE = 24;  // blank margin inside each chart SVG: the frame may crop it
var ECART_LARGEUR = 6;
var FIN = 0.05;

if (app.documents.length === 0) { alert("Aucun document ouvert."); exit(); }
var doc = app.activeDocument;
var appliquer = confirm("OK = APPLIQUER la mise au carré des modules à précision latérale.\nAnnuler = SIMULER (le script applique, mesure, puis annule).");

var pas, departGrille, grilleSurMarge;

function n2(v) { return Math.round(v * 100) / 100; }
function nomStyle(o) { try { return o.appliedObjectStyle.name; } catch (e) { return ""; } }
function recouvrementX(a, b) { return Math.min(a[3], b[3]) - Math.max(a[1], b[1]); }
function ligneDeBase(page, y) {
  var origine = (grilleSurMarge ? page.marginPreferences.top : 0) + departGrille;
  return origine + Math.round((y - origine) / pas) * pas;
}
function auPas(h) { return Math.ceil((h - 0.01) / pas) * pas; }
// An auto-sized title sits below the module top: the top is the baseline at or just above it, so that a second run changes nothing.
function ligneDeBasePrecedente(page, y) {
  var origine = (grilleSurMarge ? page.marginPreferences.top : 0) + departGrille;
  return origine + Math.floor((y - origine + 0.3) / pas) * pas;
}
function ligneDeBaseSuivante(page, y) {
  var origine = (grilleSurMarge ? page.marginPreferences.top : 0) + departGrille;
  return origine + Math.ceil((y - origine - 0.05) / pas) * pas;
}
function tailleAuto(bloc) {
  try { return bloc.textFramePreferences.autoSizingType !== AutoSizingTypeEnum.OFF; } catch (e) { return false; }
}
// An auto-sized frame sets its own height from its reference point: it is placed, then moved back so that its top is where asked.
function poser(bloc, bornes) {
  bloc.geometricBounds = bornes;
  if (!tailleAuto(bloc)) return;
  var b = bloc.geometricBounds;
  if (Math.abs(b[0] - bornes[0]) > 0.01) bloc.move(undefined, [0, bornes[0] - b[0]]);
}

function objetsDeLaPage(page) {
  var tous = page.parent.pageItems.everyItem().getElements(), sortie = [];
  for (var i = 0; i < tous.length; i++) {
    var p = null;
    try { p = tous[i].parentPage; } catch (e) {}
    if (p && p.isValid && p.id === page.id) sortie.push(tous[i]);
  }
  return sortie;
}

function reperesY(page) {
  var Y = [page.marginPreferences.top, (page.bounds[2] - page.bounds[0]) - page.marginPreferences.bottom];
  function lire(planche) {
    var g = planche.guides.everyItem().getElements();
    for (var i = 0; i < g.length; i++) if (g[i].orientation === HorizontalOrVertical.HORIZONTAL) Y.push(g[i].location);
  }
  lire(page.parent);
  var gabarit = page.appliedMaster, garde = 0;
  while (gabarit && gabarit.isValid && garde++ < 5) { lire(gabarit); gabarit = gabarit.appliedMaster; }
  return Y;
}

function reperesX(page) {
  var X = [], L = page.bounds[3] - page.bounds[1], m = page.marginPreferences, dp = doc.documentPreferences;
  var miroir = dp.facingPages && page.side === PageSideOptions.LEFT_HAND;
  var gauche = miroir ? m.right : m.left, droite = miroir ? m.left : m.right, n = m.columnCount, g = m.columnGutter;
  var lc = (L - gauche - droite - (n - 1) * g) / n;
  for (var c = 0; c < n; c++) { X.push(gauche + c * (lc + g)); X.push(gauche + c * (lc + g) + lc); }
  X.push(0, L, -(miroir ? dp.documentBleedOutsideOrRightOffset : dp.documentBleedInsideOrLeftOffset), L + (miroir ? dp.documentBleedInsideOrLeftOffset : dp.documentBleedOutsideOrRightOffset));
  function lire(planche, pageRef) {
    var r = planche.guides.everyItem().getElements();
    for (var i = 0; i < r.length; i++) {
      var sur = false;
      try { sur = r[i].parentPage && r[i].parentPage.isValid && r[i].parentPage.id === pageRef.id; } catch (e) {}
      if (sur && r[i].orientation === HorizontalOrVertical.VERTICAL) X.push(r[i].location);
    }
  }
  lire(page.parent, page);
  var gabarit = page.appliedMaster, garde = 0;
  while (gabarit && gabarit.isValid && garde++ < 5) {
    var pg = gabarit.pages[0];
    for (var k = 0; k < gabarit.pages.length; k++) if (gabarit.pages[k].side === page.side) pg = gabarit.pages[k];
    lire(gabarit, pg);
    gabarit = gabarit.appliedMaster;
  }
  return X;
}

function versRepere(X, x) {
  var best = null;
  for (var i = 0; i < X.length; i++) if (Math.abs(X[i] - x) <= ECART_LARGEUR && (best === null || Math.abs(X[i] - x) < Math.abs(best - x))) best = X[i];
  return best;
}

function surUnRepere(Y, y) {
  for (var i = 0; i < Y.length; i++) if (Math.abs(Y[i] - y) < 0.6) return Y[i];
  return null;
}

// Height a text frame needs: bottom of its last line plus the bottom inset, measured with the frame made tall enough.
// garder : a height set by hand is kept, rounded to the grid, as long as the text fits in it
function hauteurDuTexte(bloc, y1, x1, x2, garder) {
  var b = bloc.geometricBounds, actuelle = b[2] - b[0];
  b = [b[0], x1, b[2], x2];
  if (tailleAuto(bloc)) {
    poser(bloc, [y1, x1, y1 + actuelle, x2]);
    var ba = bloc.geometricBounds;
    return ba[2] - ba[0];
  }
  bloc.geometricBounds = [y1, x1, y1 + actuelle, x2];
  if (garder) {
    var voulue = Math.max(pas, Math.round(actuelle / pas) * pas);
    bloc.geometricBounds = [y1, x1, y1 + voulue, x2];
    if (!bloc.overflows) return voulue;
  }
  // a title is bottom-aligned: its text height only reads with the frame aligned to the top
  var prefs = bloc.textFramePreferences, justification = prefs.verticalJustification;
  if (justification !== VerticalJustification.TOP_ALIGN) prefs.verticalJustification = VerticalJustification.TOP_ALIGN;
  bloc.geometricBounds = [y1, b[1], y1 + 900, b[3]];
  var marges = bloc.textFramePreferences.insetSpacing, bas = marges instanceof Array ? marges[2] : marges;
  var h;
  if (bloc.lines.length === 0) h = pas;
  else { var l = bloc.lines[-1]; h = l.baseline + l.descent + bas - y1; }
  h = auPas(h);
  if (prefs.verticalJustification !== justification) prefs.verticalJustification = justification;
  bloc.geometricBounds = [y1, b[1], y1 + h, b[3]];
  var garde = 0;
  while (bloc.overflows && garde++ < 80) { h += pas; bloc.geometricBounds = [y1, b[1], y1 + h, b[3]]; }
  // the measure above can be one step too generous: keep the smallest height on the grid that does not overflow
  garde = 0;
  while (h - pas >= pas && garde++ < 80) {
    bloc.geometricBounds = [y1, b[1], y1 + h - pas, b[3]];
    if (bloc.overflows) { bloc.geometricBounds = [y1, b[1], y1 + h, b[3]]; break; }
    h -= pas;
  }
  return h;
}

function trouverModules(page) {
  var objets = objetsDeLaPage(page), graphiques = [], titres = [], precisionsDessous = [], fonds = [], textes = [], tous = [];
  for (var i = 0; i < objets.length; i++) {
    var o = objets[i], type = o.constructor.name, style = nomStyle(o);
    if (MOTIF_FOND.test(style)) { fonds.push(o); continue; }
    tous.push(o);
    if (type === "TextFrame" && MOTIF_TITRE.test(style)) { titres.push(o); continue; }
    if (type === "TextFrame" && MOTIF_PRECISION.test(style)) { precisionsDessous.push(o); continue; }
    if (type === "TextFrame") { textes.push(o); continue; }
    var lien = "";
    try { if (type !== "Group" && o.allGraphics.length === 1) lien = o.allGraphics[0].itemLink.name; } catch (e) {}
    if (/\.svg$/i.test(lien)) graphiques.push(o);
  }
  var modules = [];
  for (var g = 0; g < graphiques.length; g++) {
    var G = graphiques[g], gb = G.geometricBounds, T = [], P = [], B = [], dessous = 0, k, b;
    for (k = 0; k < precisionsDessous.length; k++) { b = precisionsDessous[k].geometricBounds; if (recouvrementX(b, gb) > 50 && b[2] > gb[2] - 5 && b[0] - gb[2] < 40 && b[0] > gb[0]) dessous++; }
    for (k = 0; k < titres.length; k++) { b = titres[k].geometricBounds; if (recouvrementX(b, gb) > 50 && b[0] < gb[0] + 5 && gb[0] - b[2] < 60 && b[2] < gb[2]) T.push(titres[k]); }
    // side note: a text frame right of the chart centre, sharing its height, whose text starts with « Champ »
    var cotes = textes.concat(precisionsDessous);
    for (k = 0; k < cotes.length; k++) {
      b = cotes[k].geometricBounds;
      var debut = "";
      try { debut = String(cotes[k].contents).substr(0, 5); } catch (e2) {}
      if (debut === "Champ" && b[1] > (gb[1] + gb[3]) / 2 && Math.min(b[2], gb[2]) - Math.max(b[0], gb[0]) > 30) P.push(cotes[k]);
    }
    for (k = 0; k < fonds.length; k++) { b = fonds[k].geometricBounds; if (b[0] <= gb[0] + 1 && b[2] >= gb[2] - 1 && b[1] <= gb[1] + 3 && b[3] >= gb[3] - 3) B.push(fonds[k]); }
    modules.push({ G: G, T: T, P: P, B: B, dessous: dessous, nom: G.allGraphics[0].itemLink.name, haut: gb[0] });
  }
  modules.sort(function (a, c) { return a.haut - c.haut; });
  return { modules: modules, tous: tous };
}

function estSelectionne(m) {
  var ids = {}, i;
  for (i = 0; i < app.selection.length; i++) { try { ids[app.selection[i].id] = true; } catch (e) {} }
  var membres = [m.G].concat(m.T).concat(m.P).concat(m.B);
  for (i = 0; i < membres.length; i++) if (ids[membres[i].id]) return true;
  return false;
}

function colonneAvant(X, x) {
  var best = null;
  for (var i = 0; i < X.length; i++) if (X[i] < x - 1 && (best === null || X[i] > best)) best = X[i];
  return best;
}

function traiter(avecSelection) {
  var lignes = [], compte = { conforme: 0, ajuste: 0, conflit: 0, ecarte: 0, fonds: 0 };
  var fondsATraiter = {}, fondsBloques = {}, pages = doc.pages.everyItem().getElements();
  for (var p = 0; p < pages.length; p++) {
    var page = pages[p], trouve = trouverModules(page);
    if (!trouve.modules.length) continue;
    var H = page.bounds[2] - page.bounds[0], L = page.bounds[3] - page.bounds[1];
    var Y = reperesY(page), X = reperesX(page), margeBasse = H - page.marginPreferences.bottom;
    for (var i = 0; i < trouve.modules.length; i++) {
      var m = trouve.modules[i], ent = "p" + page.name + "\t" + m.nom + "\t", k2;
      // a chart this script does not handle freezes the background it shares
      if (m.dessous > 0 || m.P.length === 0) { for (k2 = 0; k2 < m.B.length; k2++) fondsBloques[m.B[k2].id] = true; continue; }
      var raison = "";
      if (m.T.length !== 1) raison = m.T.length + " titre(s) au-dessus";
      else if (m.P.length !== 1) raison = m.P.length + " précisions latérales";
      else if (m.B.length > 1) raison = m.B.length + " fonds autour";
      else if (m.G.locked || m.T[0].locked || m.P[0].locked || (m.B.length && m.B[0].locked)) raison = "objet verrouillé";
      else if (Math.abs(m.G.rotationAngle) > 0.01) raison = "graphique pivoté";
      var image = m.G.allGraphics[0];
      if (!raison && (Math.abs(image.horizontalScale - 100) > 0.5 || Math.abs(image.verticalScale - 100) > 0.5)) raison = "image à " + n2(image.horizontalScale) + " %";
      var T = m.T[0], P = m.P[0], G = m.G, B = m.B.length ? m.B[0] : null;
      var t0, g0, p0, i0, gx1, gx2;
      if (!raison) {
        t0 = T.geometricBounds; g0 = G.geometricBounds; p0 = P.geometricBounds; i0 = image.geometricBounds;
        gx1 = versRepere(X, t0[1]); if (gx1 === null) gx1 = t0[1];
        gx2 = colonneAvant(X, p0[1]);
        if (gx2 === null || gx2 <= gx1) raison = "pas de bord de colonne avant la précision";
        else if (gx2 - gx1 < (i0[3] - i0[1]) - 2 * RESERVE_IMAGE - FIN) raison = "le graphique (" + n2(i0[3] - i0[1]) + " pt) ne tient pas dans " + n2(gx2 - gx1) + " pt";
      }
      if (raison) {
        for (k2 = 0; k2 < m.B.length; k2++) fondsBloques[m.B[k2].id] = true;
        if (!avecSelection || estSelectionne(m)) { lignes.push(ent + "ÉCARTÉ\t" + raison); compte.ecarte++; }
        continue;
      }
      if (B && !fondsATraiter[B.id]) fondsATraiter[B.id] = { B: B, b0: B.geometricBounds, H: H, L: L, page: page.name, blocs: [] };
      if (avecSelection && !estSelectionne(m)) { if (B) fondsATraiter[B.id].blocs.push(t0, g0, p0); continue; }

      var basAvant = Math.max(p0[2], g0[2]), limite = basAvant <= margeBasse + 0.6 ? margeBasse : H + doc.documentPreferences.documentBleedBottomOffset;
      for (var v = 0; v < trouve.tous.length; v++) {
        var o = trouve.tous[v];
        if (o.id === T.id || o.id === P.id || o.id === G.id) continue;
        var ob = o.geometricBounds, calque = "";
        try { calque = o.itemLayer.name; } catch (e1) {}
        if (calque === "Fonds") continue;
        if (recouvrementX(ob, [0, gx1, 0, p0[3]]) > 10 && ob[0] >= basAvant - 2 && ob[0] < limite) limite = ob[0];
      }

      var y0 = ligneDeBase(page, t0[0]);
      var hT = hauteurDuTexte(T, y0, t0[1], t0[3], true);
      var y1 = y0 + hT;
      var hP = hauteurDuTexte(P, y1, p0[1], p0[3], false);
      var h = Math.max(auPas(i0[2] - i0[0]), hP);
      var ancreBas = surUnRepere(Y, p0[2]);
      if (ancreBas !== null && ancreBas - y1 >= h - FIN) h = ancreBas - y1;
      var bas = y1 + h;
      P.geometricBounds = [y1, p0[1], bas, p0[3]];
      G.geometricBounds = [y1, gx1, bas, gx2];
      G.fit(FitOptions.CENTER_CONTENT);

      var conflit = bas > limite + FIN;
      if (conflit && !avecSelection) {
        T.geometricBounds = t0; G.geometricBounds = g0; image.geometricBounds = i0; P.geometricBounds = p0;
        if (B) fondsATraiter[B.id].blocs.push(t0, g0, p0);
        lignes.push(ent + "CONFLIT\til manque " + n2(bas - limite) + " pt avant " + (limite === margeBasse ? "la marge basse" : "l’objet suivant") + " (hauteur nécessaire " + n2(h) + ", titre " + n2(hT) + ")");
        compte.conflit++;
        continue;
      }
      if (B) fondsATraiter[B.id].blocs.push(T.geometricBounds, G.geometricBounds, P.geometricBounds);
      var t1 = T.geometricBounds, g1 = G.geometricBounds, p1 = P.geometricBounds, bouge = 0, q;
      for (q = 0; q < 4; q++) bouge += Math.abs(t1[q] - t0[q]) + Math.abs(g1[q] - g0[q]) + Math.abs(p1[q] - p0[q]);
      if (bouge < 0.1) { compte.conforme++; continue; }
      compte.ajuste++;
      lignes.push(ent + (conflit ? "AJUSTÉ MALGRÉ CONFLIT" : "ajusté") + "\ttitre " + n2(t0[0]) + "–" + n2(t0[2]) + " → " + n2(t1[0]) + "–" + n2(t1[2]) +
        " ; graphique x " + n2(g0[1]) + "–" + n2(g0[3]) + " → " + n2(g1[1]) + "–" + n2(g1[3]) + ", y " + n2(g0[0]) + "–" + n2(g0[2]) + " → " + n2(g1[0]) + "–" + n2(g1[2]) +
        " ; précision y " + n2(p0[0]) + "–" + n2(p0[2]) + " → " + n2(p1[0]) + "–" + n2(p1[2]) + (ancreBas !== null && Math.abs(bas - ancreBas) < FIN ? " (bas gardé sur son repère)" : ""));
    }
  }
  for (var id in fondsATraiter) {
    if (fondsBloques[id]) continue;
    var f = fondsATraiter[id], u = [Infinity, Infinity, -Infinity, -Infinity];
    if (!f.blocs.length) continue;
    for (var k = 0; k < f.blocs.length; k++) { var bb = f.blocs[k]; u[0] = Math.min(u[0], bb[0]); u[1] = Math.min(u[1], bb[1]); u[2] = Math.max(u[2], bb[2]); u[3] = Math.max(u[3], bb[3]); }
    var nb = [f.b0[0] <= 0.5 ? f.b0[0] : u[0], f.b0[1] <= 0.5 ? f.b0[1] : u[1], f.b0[2] >= f.H - 0.5 ? f.b0[2] : u[2], f.b0[3] >= f.L - 0.5 ? f.b0[3] : u[3]];
    if (Math.abs(nb[0] - f.b0[0]) + Math.abs(nb[1] - f.b0[1]) + Math.abs(nb[2] - f.b0[2]) + Math.abs(nb[3] - f.b0[3]) > 0.1) {
      f.B.geometricBounds = nb;
      compte.fonds++;
      lignes.push("p" + f.page + "\tfond\tajusté\t" + n2(f.b0[0]) + " " + n2(f.b0[1]) + " " + n2(f.b0[2]) + " " + n2(f.b0[3]) + " → " + n2(nb[0]) + " " + n2(nb[1]) + " " + n2(nb[2]) + " " + n2(nb[3]));
    }
  }
  return { lignes: lignes, compte: compte };
}

var res, erreur = null, avecSelection = app.selection.length > 0;
var unite = app.scriptPreferences.measurementUnit, origineRegle = doc.viewPreferences.rulerOrigin, zero = doc.zeroPoint, redessin = app.scriptPreferences.enableRedraw;
app.scriptPreferences.enableRedraw = false;
try {
  app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
  pas = doc.gridPreferences.baselineDivision;
  departGrille = doc.gridPreferences.baselineStart;
  grilleSurMarge = doc.gridPreferences.baselineGridRelativeOption === BaselineGridRelativeOption.TOP_OF_MARGIN_OF_BASELINE_GRID_RELATIVE_OPTION;
  app.doScript(function () {
    doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
    doc.zeroPoint = [0, 0];
    res = traiter(avecSelection);
    doc.viewPreferences.rulerOrigin = origineRegle;
    doc.zeroPoint = zero;
  }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Modules à précision latérale");
  if (!appliquer) doc.undo();
} catch (e) {
  erreur = e;
} finally {
  app.scriptPreferences.measurementUnit = unite;
  app.scriptPreferences.enableRedraw = redessin;
}
if (erreur) { alert("Erreur : " + erreur.message + (erreur.line ? " (ligne " + erreur.line + ")" : "") + "\nSi des objets ont bougé, Cmd+Z les remet en place."); exit(); }

var mode = appliquer ? "application" : "simulation";
var sortie = [
  "Mode : " + mode + (avecSelection ? ", modules sélectionnés" : ", tout le document"),
  "Grille : pas de " + pas + " pt, départ " + departGrille + " pt " + (grilleSurMarge ? "depuis la marge haute" : "depuis le haut de la page"),
  "Déjà conformes : " + res.compte.conforme + " ; " + (appliquer ? "ajustés" : "à ajuster") + " : " + res.compte.ajuste + " ; en conflit, laissés : " + res.compte.conflit + " ; écartés : " + res.compte.ecarte + " ; fonds " + (appliquer ? "ajustés" : "à ajuster") + " : " + res.compte.fonds,
  ""
].concat(res.lignes);
var fichier = new File(doc.filePath + "/rapport-modules-lateraux-" + mode + ".txt");
fichier.encoding = "UTF-8";
fichier.lineFeed = "Unix";
fichier.open("w");
fichier.write(sortie.join("\n") + "\n");
fichier.close();
alert((appliquer ? "Mise au carré terminée" : "Simulation terminée, document remis en l’état") + ".\nConformes : " + res.compte.conforme + "\n" + (appliquer ? "Ajustés : " : "À ajuster : ") + res.compte.ajuste + "\nEn conflit : " + res.compte.conflit + "\nÉcartés : " + res.compte.ecarte + "\n\nRapport : " + fichier.fsName);
