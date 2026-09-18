// Remet à l'échelle les graphiques SVG qui n'ont pas été régénérés (exports R et Illustrator) :
// ajustement proportionnel au bloc, puis centrage. Les graphiques régénérés (liste ci-dessous) restent à 100 %.
// Écrit un rapport sur le bureau : graphiques-anciens-ajuster.txt

app.doScript(function () {
  var regeneres = /^(G(1|2|3|4|5|6|7|8|10|11|19|20|21|22|23|24|25|27|28|31|32|33|34|35|36|37|38|39|41|42|43|44|48|49|50|51|52|53|54|55|56|57|58|59|60|61|62|63|64|65|67|68|69|70|71|72|73|74|75|76|77|81|82|83|84|85|86|87|88|89|90|91)_|[ABC][1-4]\.svg$|couverture-graphique\.svg$)/;
  var doc = app.activeDocument, graphiques = doc.allGraphics, lignes = [], faits = 0;
  for (var i = 0; i < graphiques.length; i++) {
    var g = graphiques[i], nom = "";
    try { nom = g.itemLink ? g.itemLink.name : ""; } catch (e) {}
    if (!/\.svg$/i.test(nom) || regeneres.test(nom)) continue;
    try {
      g.parent.fit(FitOptions.PROPORTIONALLY);
      g.parent.fit(FitOptions.CENTER_CONTENT);
      var page = "?";
      try { page = g.parentPage ? g.parentPage.name : "?"; } catch (e2) {}
      lignes.push("p" + page + "\t" + nom + "\téchelle " + g.absoluteHorizontalScale.toFixed(0) + " %");
      faits++;
    } catch (e3) {
      lignes.push(nom + "\tERREUR " + e3.message);
    }
  }
  lignes.sort();
  var rapport = new File(Folder.desktop + "/graphiques-anciens-ajuster.txt");
  rapport.encoding = "UTF-8";
  rapport.lineFeed = "Unix";
  rapport.open("w");
  rapport.write(faits + " graphiques anciens ajustés proportionnellement à leur bloc\n\n" + lignes.join("\n") + "\n");
  rapport.close();
  alert(faits + " graphiques anciens ajustés à leur bloc.\nRapport : " + rapport.fsName);
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Graphiques anciens ajustés");
