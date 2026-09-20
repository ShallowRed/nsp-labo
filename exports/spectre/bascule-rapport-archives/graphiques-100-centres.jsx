// Met les graphiques SVG liés à 100 % d'échelle et les centre dans leur bloc.
// Sans sélection : tous les SVG du document. Avec sélection : les blocs sélectionnés seulement.
// Écrit un rapport sur le bureau : graphiques-100-centres.txt

app.doScript(function () {
  var doc = app.activeDocument;
  var cibles = [];
  if (app.selection.length > 0) {
    for (var s = 0; s < app.selection.length; s++) {
      var item = app.selection[s];
      if (item.hasOwnProperty("allGraphics")) cibles = cibles.concat(item.allGraphics);
      else if (item.hasOwnProperty("parent") && item.parent.hasOwnProperty("allGraphics")) cibles.push(item);
    }
  } else {
    cibles = doc.allGraphics;
  }
  var lignes = [], faits = 0, ignores = 0;
  for (var i = 0; i < cibles.length; i++) {
    var g = cibles[i];
    var nom = "";
    try { nom = g.itemLink ? g.itemLink.name : ""; } catch (e) {}
    if (!/\.svg$/i.test(nom)) { ignores++; continue; }
    try {
      g.absoluteHorizontalScale = 100;
      g.absoluteVerticalScale = 100;
      g.parent.fit(FitOptions.CENTER_CONTENT);
      var b = g.parent.geometricBounds, c = g.geometricBounds;
      var cadreL = (b[3] - b[1]).toFixed(1), cadreH = (b[2] - b[0]).toFixed(1);
      var imgL = (c[3] - c[1]).toFixed(1), imgH = (c[2] - c[0]).toFixed(1);
      var page = "?";
      try { page = g.parentPage ? g.parentPage.name : "?"; } catch (e2) {}
      var alerte = (c[3] - c[1] > b[3] - b[1] + 0.5 || c[2] - c[0] > b[2] - b[0] + 0.5) ? "  DÉPASSE" : "";
      lignes.push("p" + page + "\t" + nom + "\tbloc " + cadreL + " x " + cadreH + "\timage " + imgL + " x " + imgH + alerte);
      faits++;
    } catch (e3) {
      lignes.push(nom + "\tERREUR " + e3.message);
    }
  }
  lignes.sort();
  var rapport = new File(Folder.desktop + "/graphiques-100-centres.txt");
  rapport.encoding = "UTF-8";
  rapport.lineFeed = "Unix";
  rapport.open("w");
  rapport.write(faits + " graphiques SVG à 100 % et centrés, " + ignores + " autres images ignorées\n\n" + lignes.join("\n") + "\n");
  rapport.close();
  alert(faits + " graphiques SVG mis à 100 % et centrés.\nRapport : " + rapport.fsName);
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Graphiques à 100 % et centrés");
