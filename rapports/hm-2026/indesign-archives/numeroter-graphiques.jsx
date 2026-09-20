// Pose un numéro discret sur chaque graphique du rapport (G1 à G91, pas les annexes) : un petit bloc de texte en haut à droite
// de la zone du graphique, calé sur la marge droite du fond bleu, juste au-dessus du titre. Le numéro vient d'une numérotation
// automatique (liste « Graphiques », style de paragraphe « Numéro graphique »), dans l'ordre de lecture : page, puis haut vers bas.
// Relançable : les blocs posés par une exécution précédente sont d'abord supprimés. Rapport sur le bureau : numeroter-graphiques.txt

var STYLE = "Numéro graphique", LISTE = "Graphiques", ETIQUETTE = "numero-graphique";
var COULEUR = "Pétrole 700", RVB = [11, 72, 98];
var STYLES_TITRE = /TITRE GRAPHIQUE|TG SANS TETE|^Titre graphique$/, PARAGRAPHES_TITRE = /^Titre graph|^Titre du graphique|^Titre graphique/;
var STYLE_FOND = /Fond graphique/;
var RETRAIT_DROITE = 24, LARGEUR = 40, HAUTEUR = 10, ESPACE_TITRE = 2;

app.doScript(function () {
  var doc = app.activeDocument, lignes = [];
  // nettoyage des blocs d'une exécution précédente
  var anciens = doc.textFrames.everyItem().getElements(), retires = 0;
  for (var a = anciens.length - 1; a >= 0; a--) if (anciens[a].label === ETIQUETTE) { anciens[a].remove(); retires++; }

  var couleur = doc.swatches.itemByName(COULEUR);
  if (!couleur.isValid) couleur = doc.colors.add({name: COULEUR, model: ColorModel.PROCESS, space: ColorSpace.RGB, colorValue: RVB});
  var liste = doc.numberingLists.itemByName(LISTE);
  if (!liste.isValid) liste = doc.numberingLists.add({name: LISTE, continueNumbersAcrossStories: true, continueNumbersAcrossDocuments: false});
  var style = doc.paragraphStyles.itemByName(STYLE);
  if (!style.isValid) style = doc.paragraphStyles.add({name: STYLE});
  try { style.appliedFont = app.fonts.itemByName("Poppins\tSemiBold"); } catch (e0) { try { style.appliedFont = "Poppins"; style.fontStyle = "SemiBold"; } catch (e1) {} }
  style.pointSize = 7;
  style.leading = 8;
  style.fillColor = couleur;
  style.justification = Justification.RIGHT_ALIGN;
  style.leftIndent = 0;
  style.firstLineIndent = 0;
  // numérotation automatique ; selon la version d'InDesign la liste s'accroche par objet ou par nom, sinon le numéro est écrit en dur
  var automatique = false;
  try { style.properties = {bulletsAndNumberingListType: ListType.NUMBERED_LIST, numberingLevel: 1, numberingFormat: "1, 2, 3, 4...", numberingExpression: "^#", numberingContinue: true, numberingApplyRestartPolicy: false}; } catch (e6) {}
  try { style.numberingList = liste; automatique = true; } catch (e7) {
    try { style.numberingList = LISTE; automatique = true; } catch (e8) {
      try { style.properties = {numberingList: liste}; automatique = true; } catch (e9) {}
    }
  }
  if (!automatique) try { style.bulletsAndNumberingListType = ListType.NO_LIST; } catch (e10) {}

  // graphiques dans l'ordre de lecture : page, puis haut de la zone (titre s'il existe, sinon bloc), puis gauche
  var graphiques = doc.allGraphics, entrees = [];
  for (var i = 0; i < graphiques.length; i++) {
    var g = graphiques[i], nom = "";
    try { nom = g.itemLink ? g.itemLink.name : ""; } catch (e2) {}
    if (!/^G\d+_.*\.svg$/i.test(nom)) continue;
    var cadre = g.parent, page = null;
    try { page = cadre.parentPage; } catch (e3) {}
    if (!page) continue;
    var b = cadre.geometricBounds, titre = voisin(page, cadre), fond = fondDe(page, cadre);
    var haut = titre ? titre.geometricBounds[0] : b[0] - 16;
    entrees.push({nom: nom, page: page, ordre: page.documentOffset, y: haut, x: b[1], droite: (fond ? fond.geometricBounds[3] : b[3]) - RETRAIT_DROITE, titre: titre});
  }
  entrees.sort(function (p, q) { return p.ordre - q.ordre || p.y - q.y || p.x - q.x; });

  for (var k = 0; k < entrees.length; k++) {
    var e = entrees[k];
    var basBloc = e.y - ESPACE_TITRE, hautBloc = basBloc - HAUTEUR;
    var bloc = e.page.textFrames.add({geometricBounds: [hautBloc, e.droite - LARGEUR, basBloc, e.droite], label: ETIQUETTE});
    bloc.textFramePreferences.insetSpacing = [0, 0, 0, 0];
    bloc.textFramePreferences.verticalJustification = VerticalJustification.BOTTOM_ALIGN;
    bloc.textFramePreferences.ignoreWrap = true;
    bloc.contents = automatique ? "​" : String(k + 1);
    bloc.paragraphs[0].appliedParagraphStyle = style;
    bloc.paragraphs[0].clearOverrides(OverrideType.ALL);
    var obtenu = String(k + 1);
    if (automatique) try { obtenu = bloc.paragraphs[0].numberingResultNumber; } catch (e4) { obtenu = "?"; }
    var titreTexte = "";
    try { titreTexte = e.titre ? e.titre.contents.replace(/\s+/g, " ").substr(0, 60) : "(titre non trouvé)"; } catch (e5) {}
    lignes.push((String(obtenu) === String(k + 1) ? "" : "ORDRE À VÉRIFIER  ") + "n° " + (k + 1) + " (affiché " + obtenu + ")\tp" + e.page.name + "\t" + e.nom.replace(/_.*/, "") + "\t" + titreTexte);
  }
  var rapport = new File(Folder.desktop + "/numeroter-graphiques.txt");
  rapport.encoding = "UTF-8";
  rapport.lineFeed = "Unix";
  rapport.open("w");
  rapport.write(entrees.length + " numéros posés (" + retires + " anciens retirés), numérotation " + (automatique ? "automatique (liste « Graphiques »)" : "ÉCRITE EN DUR : la liste n’a pas pu être accrochée au style, relancer le script après tout déplacement de graphique") + ". Renvois dans le texte : « (graphique 12) ».\n\n" + lignes.join("\n") + "\n");
  rapport.close();
  alert(entrees.length + " numéros posés.\nRapport : " + rapport.fsName);

  function fondDe(page, cadre) {
    var b = cadre.geometricBounds, rects = page.rectangles, meilleur = null, aire = 1e12;
    for (var r = 0; r < rects.length; r++) {
      var nomStyle = "";
      try { nomStyle = rects[r].appliedObjectStyle.name; } catch (e) {}
      if (!STYLE_FOND.test(nomStyle)) continue;
      var rb = rects[r].geometricBounds;
      if (rb[0] > b[0] + 2 || rb[2] < b[2] - 2 || rb[1] > b[1] + 2 || rb[3] < b[3] - 2) continue;
      var s = (rb[2] - rb[0]) * (rb[3] - rb[1]);
      if (s < aire) { aire = s; meilleur = rects[r]; }
    }
    return meilleur;
  }

  // bloc de titre le plus proche au-dessus du graphique, qui le chevauche horizontalement
  function voisin(page, cadre) {
    var b = cadre.geometricBounds, meilleur = null, dist = 1e9, blocs = page.textFrames;
    for (var t = 0; t < blocs.length; t++) {
      var f = blocs[t], nomStyle = "", nomParagraphe = "";
      if (f.label === ETIQUETTE) continue;
      try { nomStyle = f.appliedObjectStyle.name; } catch (e) {}
      try { nomParagraphe = f.paragraphs[0].appliedParagraphStyle.name; } catch (e1) {}
      if (!STYLES_TITRE.test(nomStyle) && !PARAGRAPHES_TITRE.test(nomParagraphe)) continue;
      if (/^Champ/.test(f.contents)) continue;
      var tb = f.geometricBounds;
      if (tb[3] < b[1] || tb[1] > b[3]) continue;
      var d = b[0] - tb[2];
      if (d < -6 || d > 160) continue;
      if (d < dist) { dist = d; meilleur = f; }
    }
    return meilleur;
  }
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Numéroter les graphiques");
