// Injecte les graphiques régénérés sans toucher aux titres ni aux précisions :
// pour chaque SVG régénéré (G1 à G91 sauf G40, annexes A1 à C4), met à jour le lien s'il a changé,
// passe l'image à 100 %, la centre dans son bloc, puis ajuste le bloc à l'image.
// Sans sélection : tout le document. Avec sélection : les blocs sélectionnés. Rapport sur le bureau : injecter-graphiques.txt

app.doScript(function () {
  var regeneres = /^(G(?!40_)\d+_.*|[ABC][1-4])\.svg$/i;
  var doc = app.activeDocument;
  var cibles = app.selection.length ? [] : doc.allGraphics;
  for (var s = 0; s < app.selection.length; s++) {
    var it = app.selection[s];
    if (it.hasOwnProperty("allGraphics")) cibles = cibles.concat(it.allGraphics);
    else if (it.hasOwnProperty("itemLink")) cibles.push(it);
  }
  var lignes = [], faits = 0, misAJour = 0;
  for (var i = 0; i < cibles.length; i++) {
    var g = cibles[i], nom = "";
    try { nom = g.itemLink ? g.itemLink.name : ""; } catch (e) {}
    if (!regeneres.test(nom)) continue;
    try {
      if (g.itemLink.status == LinkStatus.LINK_OUT_OF_DATE) { g.itemLink.update(); misAJour++; }
      var cadre = g.parent;
      var avant = cadre.geometricBounds;
      g.absoluteHorizontalScale = 100;
      g.absoluteVerticalScale = 100;
      cadre.fit(FitOptions.CENTER_CONTENT);
      cadre.fit(FitOptions.FRAME_TO_CONTENT);
      var apres = cadre.geometricBounds;
      var page = "?";
      try { page = cadre.parentPage ? cadre.parentPage.name : "?"; } catch (e2) {}
      lignes.push("p" + page + "\t" + nom + "\tbloc " + (avant[3] - avant[1]).toFixed(0) + " x " + (avant[2] - avant[0]).toFixed(0)
        + " → " + (apres[3] - apres[1]).toFixed(0) + " x " + (apres[2] - apres[0]).toFixed(0)
        + "\tdécalage vertical " + (apres[0] - avant[0]).toFixed(0) + " / " + (apres[2] - avant[2]).toFixed(0));
      faits++;
    } catch (e3) {
      lignes.push(nom + "\tERREUR " + e3.message);
    }
  }
  lignes.sort();
  var rapport = new File(Folder.desktop + "/injecter-graphiques.txt");
  rapport.encoding = "UTF-8";
  rapport.lineFeed = "Unix";
  rapport.open("w");
  rapport.write(faits + " graphiques injectés à 100 %, centrés, blocs ajustés (" + misAJour + " liens mis à jour)\n\n" + lignes.join("\n") + "\n");
  rapport.close();
  alert(faits + " graphiques injectés (" + misAJour + " liens mis à jour).\nRapport : " + rapport.fsName);
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Injecter les graphiques");
