// Relie chaque graphique SVG au fichier de même nom dans le dossier Links à côté du document,
// quel que soit le dossier vers lequel le lien pointait (ancien dossier V6.2, V8, V9…), puis le recharge.
// Sans sélection : tout le document. Rapport sur le bureau : relier-graphiques.txt

app.doScript(function () {
  var doc = app.activeDocument;
  var links = Folder(doc.filePath + "/Links");
  if (!links.exists) { alert("Pas de dossier Links à côté du document : " + links.fsName); return; }
  var cibles = app.selection.length ? [] : doc.allGraphics;
  for (var s = 0; s < app.selection.length; s++) {
    var it = app.selection[s];
    if (it.hasOwnProperty("allGraphics")) cibles = cibles.concat(it.allGraphics);
    else if (it.hasOwnProperty("itemLink")) cibles.push(it);
  }
  // a text cursor or an empty frame counts as a selection and would silently relink nothing
  if (app.selection.length && !cibles.length) {
    if (!confirm("La sélection ne contient aucun graphique. Relier tous les graphiques du document ?")) return;
    cibles = doc.allGraphics;
  }
  var lignes = [], relies = 0, absents = 0;
  for (var i = 0; i < cibles.length; i++) {
    var g = cibles[i], lien = null, nom = "";
    try { lien = g.itemLink; nom = lien ? lien.name : ""; } catch (e) {}
    if (!lien || !/\.svg$/i.test(nom)) continue;
    var cible = File(links.fsName + "/" + nom);
    if (!cible.exists) { lignes.push(nom + "\tABSENT de " + links.fsName); absents++; continue; }
    var avant = "";
    try { avant = lien.filePath; } catch (e1) {}
    try {
      lien.relink(cible);
      lien.update();
      relies++;
      var page = "?";
      try { page = g.parent.parentPage ? g.parent.parentPage.name : "?"; } catch (e2) {}
      lignes.push("p" + page + "\t" + nom + "\t" + (avant == cible.fsName ? "même fichier, rechargé" : "depuis " + avant));
    } catch (e3) {
      lignes.push(nom + "\tERREUR " + e3.message);
    }
  }
  lignes.sort();
  var rapport = new File(Folder.desktop + "/relier-graphiques.txt");
  rapport.encoding = "UTF-8";
  rapport.lineFeed = "Unix";
  rapport.open("w");
  rapport.write(relies + " liens reliés à " + links.fsName + " (" + absents + " absents)\n\n" + lignes.join("\n") + "\n");
  rapport.close();
  alert(relies + " liens reliés, " + absents + " absents.\nRapport : " + rapport.fsName);
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Relier les graphiques");
