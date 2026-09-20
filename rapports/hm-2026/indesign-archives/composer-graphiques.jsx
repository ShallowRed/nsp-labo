// Compose chaque graphique régénéré avec son titre et ses précisions :
//  1. met à jour le lien si le SVG a changé, échelle 100 %, bloc ajusté au contenu (le bloc prend la hauteur du SVG) ;
//  2. lit dans le SVG la position de l'axe (data-axe-x) et le bord droit du tracé (data-fin-x) ;
//  3. cale le bloc de titre (style d'objet TITRE GRAPHIQUE ou TG SANS TETE) : bord gauche sur l'axe, bord droit sur le tracé,
//     bas du bloc contre le haut du graphique ; le bloc passe en [Bloc de texte standard] sans marge intérieure,
//     ses paragraphes en style « Titre graph » (à défaut « Titre graphique gauche ») ;
//     tout style de caractère et toute mise en forme locale du titre sont retirés ;
//  4. cale le bloc de précisions (PRECISION GRAPHIQUE ou Precision SANS PIED, texte commençant par « Champ ») sur toute la largeur
//     du fond bleu (style d'objet Fond graphique), haut contre le bas du graphique, hauteur ajustée au texte.
// Les espacements verticaux viennent des marges intérieures des styles d'objet ; ESPACE_TITRE et ESPACE_PRECISION s'y ajoutent.
// Sans sélection : tout le document. Avec sélection : les graphiques sélectionnés. Rapport sur le bureau : composer-graphiques.txt

var ESPACE_TITRE = 8; // le bloc de titre n'a plus de marge intérieure : l'espace se règle ici
var ESPACE_PRECISION = 0;
var STYLES_PARAGRAPHE_TITRE = ["Titre graph", "Titre graphique gauche"];
var STYLES_TITRE = /TITRE GRAPHIQUE|TG SANS TETE|^Titre graphique$/;
var PARAGRAPHES_TITRE = /^Titre graph|^Titre du graphique|^Titre graphique/; // reconnaît aussi un titre déjà passé en bloc standard
var STYLES_PRECISION = /PRECISION GRAPHIQUE|Precision SANS PIED/;
var STYLE_FOND = /Fond graphique/;

app.doScript(function () {
  var doc = app.activeDocument;
  var cibles = app.selection.length ? [] : doc.allGraphics;
  for (var s = 0; s < app.selection.length; s++) {
    var it = app.selection[s];
    if (it.hasOwnProperty("allGraphics")) cibles = cibles.concat(it.allGraphics);
    else if (it.hasOwnProperty("itemLink")) cibles.push(it);
  }
  var styleTitre = null, nomStyleTitre = "";
  for (var si = 0; si < STYLES_PARAGRAPHE_TITRE.length && !styleTitre; si++) {
    styleTitre = trouverStyle(doc, STYLES_PARAGRAPHE_TITRE[si]);
    if (styleTitre) nomStyleTitre = STYLES_PARAGRAPHE_TITRE[si];
  }
  var blocStandard = doc.objectStyles.itemByName("$ID/[Normal Text Frame]");
  try { blocStandard.name; } catch (e0) { blocStandard = doc.objectStyles[1]; }
  var lignes = [], faits = 0;
  for (var i = 0; i < cibles.length; i++) {
    var g = cibles[i], nom = "";
    try { nom = g.itemLink ? g.itemLink.name : ""; } catch (e3) {}
    if (!/^G\d+_.*\.svg$/i.test(nom)) continue;
    try {
      if (g.itemLink.status == LinkStatus.LINK_OUT_OF_DATE) g.itemLink.update();
      var cadre = g.parent, page = cadre.parentPage;
      g.absoluteHorizontalScale = 100;
      g.absoluteVerticalScale = 100;
      cadre.fit(FitOptions.FRAME_TO_CONTENT);
      var b = cadre.geometricBounds; // [haut, gauche, bas, droite]
      var svg = lireSvg(g.itemLink.filePath);
      var axeX = svg.axeX, finX = svg.finX;
      var gauche = b[1] + axeX, droite = b[1] + finX;
      var titre = voisin(page, cadre, STYLES_TITRE, "haut");
      var precision = voisin(page, cadre, STYLES_PRECISION, "bas");
      var note = "p" + page.name + "\t" + nom + "\taxe " + axeX.toFixed(1);
      if (titre) {
        var tb = titre.geometricBounds, h = tb[2] - tb[0];
        titre.appliedObjectStyle = blocStandard;
        titre.textFramePreferences.insetSpacing = [0, 0, 0, 0];
        titre.textFramePreferences.verticalJustification = VerticalJustification.BOTTOM_ALIGN;
        titre.geometricBounds = [b[0] - ESPACE_TITRE - h, gauche, b[0] - ESPACE_TITRE, droite];
        var texteTitre = titre.parentStory.texts[0];
        texteTitre.appliedCharacterStyle = doc.characterStyles[0]; // [Aucun]
        if (styleTitre) titre.parentStory.paragraphs.everyItem().appliedParagraphStyle = styleTitre;
        else titre.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
        texteTitre.clearOverrides(OverrideType.ALL);
        note += "\ttitre calé (" + (nomStyleTitre || "style Titre graph introuvable, ferré à gauche") + ")";
      } else note += "\tTITRE INTROUVABLE";
      if (precision) {
        var fond = fondDe(page, cadre);
        var fb = fond ? fond.geometricBounds : b;
        var pb = precision.geometricBounds, hp = pb[2] - pb[0];
        precision.geometricBounds = [b[2] + ESPACE_PRECISION, fb[1], b[2] + ESPACE_PRECISION + hp, fb[3]];
        try { precision.fit(FitOptions.FRAME_TO_CONTENT); } catch (e5) {}
        note += "\tprécisions calées sur " + (fond ? "le fond" : "le graphique");
      } else note += "\tPRÉCISIONS INTROUVABLES";
      lignes.push(note);
      faits++;
    } catch (e4) {
      lignes.push(nom + "\tERREUR " + e4.message);
    }
  }
  lignes.sort();
  var rapport = new File(Folder.desktop + "/composer-graphiques.txt");
  rapport.encoding = "UTF-8";
  rapport.lineFeed = "Unix";
  rapport.open("w");
  rapport.write(faits + " graphiques composés\n\n" + lignes.join("\n") + "\n");
  rapport.close();
  alert(faits + " graphiques composés.\nRapport : " + rapport.fsName);

  // style de paragraphe par nom, à la racine ou dans un groupe de styles
  function trouverStyle(conteneur, nomStyle) {
    try { var st = conteneur.paragraphStyles.itemByName(nomStyle); st.name; return st; } catch (e) {}
    for (var k = 0; k < conteneur.paragraphStyleGroups.length; k++) {
      var r = trouverStyle(conteneur.paragraphStyleGroups[k], nomStyle);
      if (r) return r;
    }
    return null;
  }

  function lireSvg(chemin) {
    var f = new File(chemin);
    f.encoding = "UTF-8";
    f.open("r");
    var tete = f.read(2000);
    f.close();
    var a = tete.match(/data-axe-x="([\d.]+)"/), z = tete.match(/data-fin-x="([\d.]+)"/), l = tete.match(/width="([\d.]+)pt"/);
    if (!a) throw new Error("data-axe-x absent du SVG");
    return {axeX: parseFloat(a[1]), finX: z ? parseFloat(z[1]) : parseFloat(l[1]) - 24};
  }

  // rectangle de fond (style d'objet Fond graphique) qui contient le cadre du graphique
  function fondDe(page, cadre) {
    var b = cadre.geometricBounds, rects = page.rectangles, meilleur = null, aire = 1e12;
    for (var k = 0; k < rects.length; k++) {
      var r = rects[k], nomStyle = "";
      try { nomStyle = r.appliedObjectStyle.name; } catch (e) {}
      if (!STYLE_FOND.test(nomStyle)) continue;
      var rb = r.geometricBounds;
      if (rb[0] > b[0] + 2 || rb[2] < b[2] - 2 || rb[1] > b[1] + 2 || rb[3] < b[3] - 2) continue;
      var a = (rb[2] - rb[0]) * (rb[3] - rb[1]);
      if (a < aire) { aire = a; meilleur = r; }
    }
    return meilleur;
  }

  // bloc de texte du style d'objet demandé, le plus proche au-dessus ou en dessous du cadre, qui le chevauche horizontalement
  function voisin(page, cadre, motif, cote) {
    var b = cadre.geometricBounds, meilleur = null, dist = 1e9;
    var blocs = page.textFrames;
    for (var k = 0; k < blocs.length; k++) {
      var t = blocs[k], nomStyle = "", nomParagraphe = "";
      try { nomStyle = t.appliedObjectStyle.name; } catch (e) {}
      try { nomParagraphe = t.paragraphs[0].appliedParagraphStyle.name; } catch (e1) {}
      if (!motif.test(nomStyle) && !(cote == "haut" && PARAGRAPHES_TITRE.test(nomParagraphe))) continue;
      if (cote == "haut" && /^Champ/.test(t.contents)) continue; // un bloc de précisions n'est jamais un titre
      var tb = t.geometricBounds;
      if (tb[3] < b[1] || tb[1] > b[3]) continue;
      var d = cote == "haut" ? b[0] - tb[2] : tb[0] - b[2];
      if (d < -6 || d > 160) continue;
      if (d < dist) { dist = d; meilleur = t; }
    }
    return meilleur;
  }
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Composer les graphiques");
