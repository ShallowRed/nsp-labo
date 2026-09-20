// Range les objets du document actif sur trois calques : « Textes » devant, « Graphiques » au milieu,
// « Fonds » derrière. Pages et gabarits. L'ordre d'empilement entre objets d'un même calque est conservé.
//   Textes     : blocs de texte qui contiennent du texte, groupes sans image qui en contiennent.
//   Graphiques : blocs qui contiennent une image importée (SVG, PDF, photo), groupes qui en contiennent.
//   Fonds      : formes sans image (aplats, filets), blocs de texte vides qui portent une couleur de fond.
// Un groupe n'est pas défait : il va tout entier sur un calque, et le rapport liste les groupes mixtes.
// Les objets verrouillés, ceux d'un calque verrouillé et les objets ancrés dans un texte ne bougent pas.
// Lancer d'abord en simulation. Toute l'application s'annule d'un seul Cmd+Z.

#target indesign

var NOMS = { texte: "Textes", graphique: "Graphiques", fond: "Fonds" };

if (app.documents.length === 0) { alert("Aucun document ouvert."); exit(); }
var doc = app.activeDocument;
var appliquer = confirm("OK = APPLIQUER le rangement sur trois calques.\nAnnuler = SIMULER (rien n’est modifié, un rapport est produit).");

function aDuTexte(bloc) {
  try { return bloc.contents !== ""; } catch (e) { return true; }
}

function aUnFond(objet) {
  try { return objet.fillColor.name !== "None"; } catch (e) { return false; }
}

function classer(objet) {
  var type = objet.constructor.name;
  if (type === "Group") {
    var images = 0, textes = 0, membres = objet.allPageItems;
    try { images = objet.allGraphics.length; } catch (e) {}
    for (var i = 0; i < membres.length; i++) {
      if (membres[i].constructor.name === "TextFrame" && aDuTexte(membres[i])) textes++;
    }
    return { calque: images ? "graphique" : (textes ? "texte" : "fond"), mixte: images > 0 && textes > 0 };
  }
  if (type === "TextFrame") {
    if (aDuTexte(objet)) return { calque: "texte" };
    return { calque: aUnFond(objet) ? "fond" : "texte" };
  }
  if (type === "Rectangle" || type === "Oval" || type === "Polygon" || type === "GraphicLine") {
    var n = 0;
    try { n = objet.allGraphics.length; } catch (e2) {}
    return { calque: n ? "graphique" : "fond" };
  }
  return null;
}

function nomPage(objet) {
  try { return objet.parentPage ? objet.parentPage.name : "hors page"; } catch (e) { return "?"; }
}

function calque(nom) {
  var c = doc.layers.itemByName(nom);
  return c.isValid ? c : doc.layers.add({ name: nom });
}

function traiter() {
  var compte = { texte: 0, graphique: 0, fond: 0 }, deja = 0, verrouilles = 0, ignores = 0, mixtes = [];
  var calques = null;
  if (appliquer) {
    calques = { texte: calque(NOMS.texte), graphique: calque(NOMS.graphique), fond: calque(NOMS.fond) };
    calques.texte.move(LocationOptions.AT_BEGINNING);
    calques.graphique.move(LocationOptions.AFTER, calques.texte);
    calques.fond.move(LocationOptions.AT_END);
  }
  var planches = doc.spreads.everyItem().getElements().concat(doc.masterSpreads.everyItem().getElements());
  for (var p = 0; p < planches.length; p++) {
    var objets = planches[p].pageItems.everyItem().getElements();
    // From back to front: an object moved to a layer lands on top of it, so the stacking order is kept.
    for (var i = objets.length - 1; i >= 0; i--) {
      var objet = objets[i];
      var c = classer(objet);
      if (!c) { ignores++; continue; }
      if (c.mixte) mixtes.push("p" + nomPage(objet) + "\tgroupe avec image et texte, rangé sur " + NOMS[c.calque]);
      if (objet.locked || objet.itemLayer.locked) { verrouilles++; continue; }
      if (objet.itemLayer.name === NOMS[c.calque]) deja++;
      compte[c.calque]++;
      if (appliquer) objet.itemLayer = calques[c.calque];
    }
  }
  var restants = [];
  for (var k = 0; k < doc.layers.length; k++) {
    var l = doc.layers[k];
    if (l.name !== NOMS.texte && l.name !== NOMS.graphique && l.name !== NOMS.fond) {
      restants.push("calque « " + l.name + " » : " + l.pageItems.length + " objet(s)" + (l.locked ? ", verrouillé" : ""));
    }
  }
  return { compte: compte, deja: deja, verrouilles: verrouilles, ignores: ignores, mixtes: mixtes, restants: restants };
}

// With this preference on, a wrap only pushes the text placed below it: text moved in front would reflow.
var habillages = 0;
if (doc.textPreferences.zOrderTextWrap) {
  var tous = doc.allPageItems;
  for (var h = 0; h < tous.length; h++) {
    try { if (tous[h].textWrapPreferences.textWrapMode !== TextWrapModes.NONE) habillages++; } catch (e) {}
  }
  if (habillages && appliquer &&
      !confirm(habillages + " objet(s) ont un habillage, et la préférence « L’habillage n’affecte que le texte situé en dessous » est active : passer les textes devant peut les faire refluer. Continuer ?")) {
    exit();
  }
}

var res;
var redessin = app.scriptPreferences.enableRedraw;
app.scriptPreferences.enableRedraw = false;
try {
  if (appliquer) {
    app.doScript(function () { res = traiter(); }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Rangement sur trois calques");
  } else {
    res = traiter();
  }
} finally {
  app.scriptPreferences.enableRedraw = redessin;
}

var mode = appliquer ? "application" : "simulation";
var lignes = [
  "Mode : " + mode,
  NOMS.texte + " : " + res.compte.texte,
  NOMS.graphique + " : " + res.compte.graphique,
  NOMS.fond + " : " + res.compte.fond,
  "déjà sur le bon calque : " + res.deja,
  "verrouillés, laissés en place : " + res.verrouilles,
  "autres types, laissés en place (boutons, champs…) : " + res.ignores,
  "habillages à surveiller : " + habillages,
  "",
  appliquer ? "Autres calques après rangement :" : "Autres calques du document :"
].concat(res.restants.length ? res.restants : ["aucun"]).concat(["", "Groupes mixtes : " + res.mixtes.length]).concat(res.mixtes);

var fichier = new File(doc.filePath + "/rapport-calques-" + mode + ".txt");
fichier.encoding = "UTF-8";
fichier.lineFeed = "Unix";
fichier.open("w");
fichier.write(lignes.join("\n") + "\n");
fichier.close();
alert((appliquer ? "Rangement terminé" : "Simulation terminée") + ".\n" + NOMS.texte + " : " + res.compte.texte + "\n" + NOMS.graphique + " : " + res.compte.graphique + "\n" + NOMS.fond + " : " + res.compte.fond + "\nVerrouillés : " + res.verrouilles + ", groupes mixtes : " + res.mixtes.length + "\n\nRapport : " + fichier.fsName);
