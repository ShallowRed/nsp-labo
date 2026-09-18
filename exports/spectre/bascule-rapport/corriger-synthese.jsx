// Applique à la synthèse (pages 5 à 11) les dernières modifications du Word « Synthese-longue_20260914_avec_suivi-fin-matinee »
// (modifications suivies acceptées) : remplacements de texte, suppression de la mention des arrêts maladie et de sa note,
// mise à jour des notes de bas de page. Apostrophes typographiques, points médians U+00B7 et numérotation InDesign conservés.
// Rapport sur le bureau : corriger-synthese.txt

var REMPLACEMENTS = [
  ["Un dogme, qui s’incarne régulièrement, et encore récemment, dans des cibles de réduction des effectifs et des polémiques régulières autour du statut des fonctionnaires.",
   "Un dogme qui s’est encore récemment incarné dans des cibles de réduction des effectifs et des polémiques autour du statut des fonctionnaires."],
  ["autour de la crise d’attractivité", "autour du défaut d’attractivité"],
  ["division par trois des candidat·es présent·es", "division par trois du nombre de candidat·es présent·es"],
  ["encadré·es ; entre les catégories", "encadré·es, entre les catégories"],
  ["un attachement certain et une valorisation du travail effectué pour les missions de service public.", "un attachement aux missions de service public et à la capacité à faire un travail de qualité."],
  ["des répondants de la FPH déclarent", "des répondant·es de la FPH déclarent"],
  ["confrontés à ces mêmes difficultés", "confronté·es à ces mêmes difficultés"],
  ["de manager de ses encadrant·es", "de manager de leurs encadrant·es"],
  ["L’accompagnement dont ils et elles ont bénéficié à leur prise de poste", "L’accompagnement dispensé lors de la prise de poste"],
  ["être contraints de renoncer", "être contraint·es de renoncer"],
  ["être mis en situation de relayer", "être mis·es en situation de relayer"],
  ["affirme recevoir très fréquemment", "affirment recevoir très fréquemment"],
  ["lorsqu’un d’un droit garanti", "lorsqu’un droit garanti"],
];
// GREP : la mention des arrêts maladie et son appel de note (~F) disparaissent, ce qui supprime la note
var SUPPRESSION_GREP = ", hausse d’un tiers des arrêts maladie entre 2019 et 2023~F?";
var NOTE_FRANCE_STRATEGIE = /^France Stratégie \(2024\), Travailler dans la fonction publique/;
var NOTE_1 = "France Stratégie (2024), Travailler dans la fonction publique : le défi de l’attractivité.";
var NOTE_2 = "Direction générale de l’administration et de la fonction publique (2020 & 2025), Rapport annuel sur l’état de la fonction publique.";
var NOTE_4 = "France Stratégie (2024), rapport cité.";

app.doScript(function () {
  var doc = app.activeDocument, lignes = [];
  app.findTextPreferences = NothingEnum.NOTHING;
  app.changeTextPreferences = NothingEnum.NOTHING;
  app.findChangeTextOptions.includeFootnotes = true;
  app.findChangeTextOptions.caseSensitive = true;
  for (var i = 0; i < REMPLACEMENTS.length; i++) {
    app.findTextPreferences.findWhat = REMPLACEMENTS[i][0];
    app.changeTextPreferences.changeTo = REMPLACEMENTS[i][1];
    var trouves = doc.findText(), pages = [];
    for (var k = 0; k < trouves.length; k++) { try { pages.push(trouves[k].parentTextFrames[0].parentPage.name); } catch (e) { pages.push("?"); } }
    var faits = doc.changeText();
    lignes.push((faits.length ? "OK  " : "ABSENT  ") + faits.length + " × p" + pages.join(", p") + "\t« " + REMPLACEMENTS[i][0].substr(0, 60) + " » → « " + REMPLACEMENTS[i][1].substr(0, 60) + " »");
  }
  app.findTextPreferences = NothingEnum.NOTHING;
  app.changeTextPreferences = NothingEnum.NOTHING;
  app.findGrepPreferences = NothingEnum.NOTHING;
  app.changeGrepPreferences = NothingEnum.NOTHING;
  app.findGrepPreferences.findWhat = SUPPRESSION_GREP;
  app.changeGrepPreferences.changeTo = "";
  var supprimes = doc.changeGrep();
  lignes.push((supprimes.length ? "OK  " : "ABSENT  ") + supprimes.length + " ×\tsuppression « hausse d’un tiers des arrêts maladie… » et de sa note");
  app.findGrepPreferences = NothingEnum.NOTHING;
  app.changeGrepPreferences = NothingEnum.NOTHING;
  // notes de bas de page de la synthèse : deux notes France Stratégie (la première complète, la seconde « rapport cité »),
  // note DGAFP à écrire, note IGAS-IGF supprimée si la suppression GREP ne l'a pas retirée
  var notes = [], stories = doc.stories;
  for (var s = 0; s < stories.length; s++) for (var f = 0; f < stories[s].footnotes.length; f++) notes.push(stories[s].footnotes[f]);
  var rangFS = 0;
  for (var n = 0; n < notes.length; n++) {
    var texte = "";
    try { texte = notes[n].texts[0].contents.replace(/^[\s￼]+/, ""); } catch (e1) { continue; }
    var page = "?";
    try { page = notes[n].storyOffset.parentTextFrames[0].parentPage.name; } catch (e2) {}
    if (page !== "5" && page !== "6") continue;
    if (NOTE_FRANCE_STRATEGIE.test(texte)) {
      rangFS++;
      var cible = rangFS === 1 ? NOTE_1 : NOTE_4;
      notes[n].texts[0].contents = cible;
      lignes.push("OK  note p" + page + " : « " + texte.substr(0, 50) + "… » → « " + cible + " »");
    } else if (/^Pavis I\./.test(texte)) {
      notes[n].remove();
      lignes.push("OK  note p" + page + " : note IGAS-IGF supprimée");
    } else if (/^DGAFP/.test(texte) || texte.replace(/\s/g, "") === "") {
      notes[n].texts[0].contents = NOTE_2;
      lignes.push("OK  note p" + page + " : « " + texte + " » → « " + NOTE_2 + " »");
    }
  }
  var rapport = new File(Folder.desktop + "/corriger-synthese.txt");
  rapport.encoding = "UTF-8";
  rapport.lineFeed = "Unix";
  rapport.open("w");
  rapport.write(lignes.join("\n") + "\n");
  rapport.close();
  alert("Synthèse corrigée.\nRapport : " + rapport.fsName);
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Corriger la synthèse");
