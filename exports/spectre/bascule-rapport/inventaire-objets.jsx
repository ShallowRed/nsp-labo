// Inventaire en lecture seule des objets posés sur les pages du document actif : une ligne par objet, avec sa page,
// son calque, son style d'objet, ses bornes en points depuis le coin haut gauche de la page, son fond, et selon le cas
// le début de son texte, son débordement, ses marges internes, ou le fichier lié, son échelle et les bornes de l'image.
// Rien n'est modifié dans le document. Sortie : inventaire-objets.tsv à côté du document.

#target indesign

if (app.documents.length === 0) { alert("Aucun document ouvert."); exit(); }
var doc = app.activeDocument;

function n2(v) { return Math.round(v * 100) / 100; }
function bornes(b) { return n2(b[0]) + "\t" + n2(b[1]) + "\t" + n2(b[2]) + "\t" + n2(b[3]); }
function essai(f, defaut) { try { var v = f(); return v === undefined || v === null ? defaut : v; } catch (e) { return defaut; } }

function ligneObjet(objet, page, parentId) {
  var type = objet.constructor.name;
  var fond = essai(function () { return objet.fillColor.name; }, "");
  var teinte = essai(function () { return objet.fillTint; }, "");
  var contour = essai(function () { return objet.strokeColor.name; }, "");
  var texte = "", deborde = "", marges = "", justif = "", auto = "", lignes = "", ancre = "", hauteurMin = "";
  var lien = "", echelle = "", bornesImage = "\t\t\t";
  if (type === "TextFrame") {
    texte = String(essai(function () { return objet.contents; }, "")).substr(0, 48).replace(/[\r\n\t]/g, " ");
    deborde = essai(function () { return objet.overflows ? "oui" : "non"; }, "");
    lignes = essai(function () { return objet.lines.length; }, "");
    marges = essai(function () { var m = objet.textFramePreferences.insetSpacing; return m instanceof Array ? m.join(" ") : String(m); }, "");
    justif = essai(function () { return String(objet.textFramePreferences.verticalJustification); }, "");
    auto = essai(function () { return String(objet.textFramePreferences.autoSizingType); }, "");
    ancre = essai(function () { return String(objet.textFramePreferences.autoSizingReferencePoint); }, "");
    hauteurMin = essai(function () { return objet.textFramePreferences.useMinimumHeightForAutoSizing ? n2(objet.textFramePreferences.minimumHeightForAutoSizing) : ""; }, "");
  }
  var images = essai(function () { return objet.allGraphics; }, []);
  if (type !== "Group" && images.length) {
    var im = images[0];
    lien = essai(function () { return im.itemLink.name; }, "");
    echelle = essai(function () { return n2(im.horizontalScale) + " x " + n2(im.verticalScale); }, "");
    bornesImage = essai(function () { return bornes(im.geometricBounds); }, "\t\t\t");
  }
  return [
    page.name, page.side === PageSideOptions.LEFT_HAND ? "gauche" : "droite", objet.id, parentId, type,
    essai(function () { return objet.itemLayer.name; }, ""), essai(function () { return objet.appliedObjectStyle.name; }, ""),
    bornes(objet.geometricBounds), n2(essai(function () { return objet.rotationAngle; }, 0)),
    essai(function () { return objet.locked ? "oui" : "non"; }, ""), fond, teinte, contour,
    lien, echelle, bornesImage, deborde, lignes, marges, justif, auto, ancre, hauteurMin, texte
  ].join("\t");
}

function parcourir(objets, page, parentId, sortie) {
  for (var i = 0; i < objets.length; i++) {
    var objet = objets[i];
    var p = essai(function () { return objet.parentPage; }, null);
    if (!p || !p.isValid || p.id !== page.id) continue;
    sortie.push(ligneObjet(objet, page, parentId));
    if (objet.constructor.name === "Group") parcourir(objet.pageItems.everyItem().getElements(), page, objet.id, sortie);
  }
}

var unite = app.scriptPreferences.measurementUnit, origine = doc.viewPreferences.rulerOrigin, zero = doc.zeroPoint;
var sortie = [["page", "cote", "id", "groupe", "type", "calque", "style", "y1", "x1", "y2", "x2", "rotation", "verrou", "fond", "teinte", "contour",
  "lien", "echelle", "iy1", "ix1", "iy2", "ix2", "deborde", "lignes", "marges_internes", "justification", "taille_auto", "ancre_auto", "hauteur_min", "texte"].join("\t")];
var erreur = null;
try {
  app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
  doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
  doc.zeroPoint = [0, 0];
  var planches = doc.spreads.everyItem().getElements();
  for (var s = 0; s < planches.length; s++) {
    var objets = planches[s].pageItems.everyItem().getElements();
    var pages = planches[s].pages.everyItem().getElements();
    for (var p = 0; p < pages.length; p++) parcourir(objets, pages[p], "", sortie);
  }
} catch (e) {
  erreur = e;
} finally {
  doc.viewPreferences.rulerOrigin = origine;
  doc.zeroPoint = zero;
  app.scriptPreferences.measurementUnit = unite;
}
if (erreur) { alert("Erreur : " + erreur.message + (erreur.line ? " (ligne " + erreur.line + ")" : "")); exit(); }

var fichier = new File(doc.filePath + "/inventaire-objets.tsv");
fichier.encoding = "UTF-8";
fichier.lineFeed = "Unix";
fichier.open("w");
fichier.write(sortie.join("\n") + "\n");
fichier.close();
alert("Inventaire terminé : " + (sortie.length - 1) + " objets.\n" + fichier.fsName);
