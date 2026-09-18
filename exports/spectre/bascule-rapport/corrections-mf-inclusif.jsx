// Corrections relevées par MF et écriture inclusive, sur le document actif.
// Chaque règle ne s'applique que si elle trouve exactement le nombre d'occurrences
// vérifié au préalable sur l'export IDML du 13 septembre ; sinon elle est sautée.
// Lancer d'abord en simulation, lire le rapport, puis relancer en application.
// Toute l'application s'annule d'un seul Cmd+Z.

#target indesign

var REGLES = [
  ["MF p14 \u00ab et \u00bb en trop", "14", "panorama et ais\u00e9ment", "panorama ais\u00e9ment", 1],
  ["MF p14 acronyme HMSP", "14", "(?<=services publics[ \\x{00A0}\\x{202F}\\x{2009}]\u00bb)(?=\\.[ \\x{00A0}\\x{202F}\\x{2009}]Ainsi, seuls)", " (HMSP en abr\u00e9g\u00e9)", 1],
  ["MF p14 \u00c0 avec accent", "14", "\\bA cela s\u2019ajoutent", "\u00c0 cela s\u2019ajoutent", 1],
  ["MF p24 \u00ab les \u00bb manquant", "24", "chez r\u00e9pondant\u00b7es dont", "chez les r\u00e9pondant\u00b7es dont", 1],
  ["MF p32 guillemets", "32", "et la relation \u00e0 l\u2019usager(?=[ \\x{00A0}\\x{202F}\\x{2009}]\\(42)", "et la \u00ab\u00a0relation \u00e0 l\u2019usager\u00a0\u00bb", 1],
  ["MF p33 un\u00b7e", "33", "contre une r\u00e9pondant\u00b7e sur dix", "contre un\u00b7e r\u00e9pondant\u00b7e sur dix", 1],
  ["MF p39 pourtant", "39", "s\u2019av\u00e8re cependant une composante", "s\u2019av\u00e8re pourtant une composante", 1],
  ["MF p46 personnel m\u00e9dical hospitalier", "46", "(?<=36[ \\x{00A0}\\x{202F}\\x{2009}]%[ \\x{00A0}\\x{202F}\\x{2009}])des r\u00e9pondant\u00b7es de la FPH\\.", "du personnel m\u00e9dical hospitalier*.", 1],
  ["MF p46 \u00ab Pr\u00e8s de \u00bb en trop", "46", "Pr\u00e8s de (?=57[ \\x{00A0}\\x{202F}\\x{2009}]%[ \\x{00A0}\\x{202F}\\x{2009}]des personnes)", "", 1],
  ["MF p52 parenth\u00e8se manquante", "52", "(?<=\\(r\u00e9ponse[ \\x{00A0}\\x{202F}\\x{2009}]\u00ab[ \\x{00A0}\\x{202F}\\x{2009}]non[ \\x{00A0}\\x{202F}\\x{2009}]\u00bb)(?=[ \\x{00A0}\\x{202F}\\x{2009}]leurs relations)", ")", 1],
  ["MF p59 point en trop", "59", "premi\u00e8res questions\\.\\.", "premi\u00e8res questions.", 1],
  ["MF p60 \u00ab d\u2019autre part \u00bb", "60", "direct\u00b7e et, d\u2019autre part, le bien-\u00eatre", "direct\u00b7e et le bien-\u00eatre", 1],
  ["MF p61 fin de phrase supprim\u00e9e", "61", "des modes d\u2019emploi pour faire leur travail correctement\\.", "des modes d\u2019emploi.", 1],
  ["MF p62 virgule", "62", "les plus grandes o\u00f9 les instruments", "les plus grandes, o\u00f9 les instruments", 1],
  ["MF p63 met en \u00e9vidence", "63", "l\u2019analyse multivari\u00e9e conduit \u00e0 mettre en \u00e9vidence", "l\u2019analyse multivari\u00e9e met en \u00e9vidence", 1],
  ["MF p64 des r\u00e9pondant\u00b7es", "64", "Un peu moins de la moiti\u00e9 indiquent", "Un peu moins de la moiti\u00e9 des r\u00e9pondant\u00b7es indiquent", 1],
  ["MF p64 r\u00e9pondant\u00b7es", "64", "que les r\u00e9pondantes\\. de la FPE", "que les r\u00e9pondant\u00b7es de la FPE", 1],
  ["MF p69 guillemets autour de la question", "69", "(?<![\u00ab\u00a0])Comment allez-vous au travail(?=[ \\x{00A0}\\x{202F}\\x{2009}]en fonction de l\u2019accord)", "\u00ab\u00a0Comment allez-vous au travail\u00a0?\u00a0\u00bb", 1],
  ["MF p70 virgule", "70", "Cependant c\u2019est parmi", "Cependant, c\u2019est parmi", 1],
  ["MF p71 divergents", "71", "attentes(\\s)divergentes", "attentes$1divergents", 1],
  ["MF p76 espace manquante", "76", "principaleont choisi", "principale ont choisi", 1],
  ["MF p77 \u00ab des des \u00bb", "77", "des des r\u00e9pondant\u00b7es", "des r\u00e9pondant\u00b7es", 1],
  ["MF p84 minuscule, les 7 notes", "84 et autres", "(?<=Note de lecture[ \\x{00A0}\\x{202F}\\x{2009}]:[ \\x{00A0}\\x{202F}\\x{2009}])Parmi", "parmi", 7],
  ["MF p90 renvoi de page", "90", "cf\\. supra, p[ \\x{00A0}\\x{202F}\\x{2009}]?44\\)", "cf. supra)", 1],
  ["MF p98 virgule en trop", "98", "pression constante\\), et des secteurs", "pression constante) et des secteurs", 1],
  ["MF p100 versants", "100", "l\u2019un des versant\\b", "l\u2019un des versants", 1],
  ["MF p100 comment\u00e9es", "100", "Sont comment\u00e9\u00b7es ici", "Sont comment\u00e9es ici", 1],
  ["MF p106 prise", "106", "cette cat\u00e9gorie \u00e9tant pris comme", "cette cat\u00e9gorie \u00e9tant prise comme", 1],
  ["MF p112 mauvaises appr\u00e9ciations", "112", "Facteurs influen\u00e7ant les appr\u00e9ciations sur l\u2019ambiance", "Facteurs influen\u00e7ant les mauvaises appr\u00e9ciations sur l\u2019ambiance", 1],
  ["MF p112 turnover", "112", "turn-over", "turnover", 1],
  ["MF p116 guillemets", "116", "\u00ab[ \\x{00A0}\\x{202F}\\x{2009}]non ou plut\u00f4t non[ \\x{00A0}\\x{202F}\\x{2009}]\u00bb", "\u00ab\u00a0non\u00a0\u00bb ou \u00ab\u00a0plut\u00f4t non\u00a0\u00bb", 1],
  ["Inclusif du sup\u00e9rieur\u00b7e", "?", "La qualit\u00e9 d\u2019\u00e9coute du sup\u00e9rieur\u00b7e", "La qualit\u00e9 d\u2019\u00e9coute de la ou du sup\u00e9rieur\u00b7e", 1],
  ["Inclusif un\u00b7e encadrant\u00b7e", "?", "\\bun encadrant\u00b7e sur deux", "un\u00b7e encadrant\u00b7e sur deux", 1],
  ["Inclusif des agent\u00b7es", "?", "des agent\u00b7e d\u00e9clarant", "des agent\u00b7es d\u00e9clarant", 1],
  ["Inclusif d\u00e9brouill\u00e9\u00b7es seul\u00b7es (MF p77)", "77", "d\u00e9brouill\u00e9\\.e seul\\.e", "d\u00e9brouill\u00e9\u00b7es seul\u00b7es", 1],
  ["Inclusif faux point m\u00e9dian U+2027", "tout", "\\x{2027}", "\u00b7", 26],
  ["Inclusif r\u00e9pondant.es", "tout", "\\br\u00e9pondant\\.es\\b", "r\u00e9pondant\u00b7es", 6],
  ["Inclusif encadrant.es", "tout", "\\bencadrant\\.es\\b", "encadrant\u00b7es", 3],
  ["Inclusif agent.es", "tout", "\\bagent\\.es\\b", "agent\u00b7es", 3],
  ["Inclusif sup\u00e9rieur.e direct.e", "tout", "\\bsup\u00e9rieur\\.e hi\u00e9rarchique direct\\.e\\b", "sup\u00e9rieur\u00b7e hi\u00e9rarchique direct\u00b7e", 1],
  ["Inclusif enqu\u00eat\u00e9.es", "tout", "\\benqu\u00eat\u00e9\\.es\\b", "enqu\u00eat\u00e9\u00b7es", 1],
  ["Inclusif amen\u00e9.es", "97", "\\bamen\u00e9\\.es\\b", "amen\u00e9\u00b7es", 1],
  ["Inclusif un.e", "tout", "\\bun\\.e\\b", "un\u00b7e", 1],
  ["Inclusif identifi\u00e9.es", "59", "\\bidentifi\u00e9\\.es\\b", "identifi\u00e9\u00b7es", 1],
  ["Inclusif technicien.nes ouvrier.\u00e8res", "tout", "\\btechnicien\\.nes, ouvrier\\.\u00e8res\\b", "technicien\u00b7nes, ouvrier\u00b7\u00e8res", 1],
  ["URL https", "tout", "https[ \\x{00A0}\\x{202F}\\x{2009}]://", "https://", 1]
];
var ITALIQUE = ["A contrario en italique, les 6", "91 et autres", "\\bA contrario\\b", 6];

var doc = app.activeDocument;
if (doc.name !== "A4-H&M copie-2.indd" &&
    !confirm("Le document actif est « " + doc.name + " », pas « A4-H&M copie-2.indd ». Continuer ?")) {
  exit();
}
var appliquer = confirm("OK = APPLIQUER les corrections.\nAnnuler = SIMULER (rien n'est modifié, un rapport est produit).");

function preparer() {
  app.findGrepPreferences = NothingEnum.nothing;
  app.changeGrepPreferences = NothingEnum.nothing;
  var o = app.findChangeGrepOptions;
  o.includeFootnotes = true;
  o.includeMasterPages = false;
  o.includeHiddenLayers = false;
  o.includeLockedLayersForFind = false;
  o.includeLockedStoriesForFind = false;
}

function traiter() {
  var lignes = [], faites = 0, sautees = 0;
  for (var i = 0; i < REGLES.length; i++) {
    var r = REGLES[i];
    preparer();
    app.findGrepPreferences.findWhat = r[2];
    var n = doc.findGrep().length;
    var statut;
    if (n !== r[4]) { statut = "SAUTÉE : " + n + " trouvée(s), " + r[4] + " attendue(s)"; sautees++; }
    else if (appliquer) { app.changeGrepPreferences.changeTo = r[3]; doc.changeGrep(); statut = "appliquée (" + n + ")"; faites++; }
    else { statut = "ok, " + n + " à corriger"; faites++; }
    lignes.push("p" + r[1] + "\t" + r[0] + "\t" + statut);
  }
  preparer();
  var style = doc.characterStyleGroups.itemByName("Forme").characterStyles.itemByName("Italique");
  app.findGrepPreferences.findWhat = ITALIQUE[2];
  var k = doc.findGrep().length;
  if (!style.isValid) { lignes.push("p" + ITALIQUE[1] + "\t" + ITALIQUE[0] + "\tSAUTÉE : style Forme:Italique introuvable"); sautees++; }
  else if (k !== ITALIQUE[3]) { lignes.push("p" + ITALIQUE[1] + "\t" + ITALIQUE[0] + "\tSAUTÉE : " + k + " trouvée(s), 6 attendues"); sautees++; }
  else if (appliquer) { app.changeGrepPreferences.appliedCharacterStyle = style; doc.changeGrep(); lignes.push("p" + ITALIQUE[1] + "\t" + ITALIQUE[0] + "\tappliquée (6)"); faites++; }
  else { lignes.push("p" + ITALIQUE[1] + "\t" + ITALIQUE[0] + "\tok, 6 à corriger"); faites++; }
  preparer();
  return { lignes: lignes, faites: faites, sautees: sautees };
}

var res;
if (appliquer) {
  app.doScript(function () { res = traiter(); }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Corrections MF et inclusif");
} else {
  res = traiter();
}

var mode = appliquer ? "application" : "simulation";
var fichier = new File(doc.filePath + "/rapport-corrections-" + mode + ".txt");
fichier.encoding = "UTF-8";
fichier.lineFeed = "Unix";
fichier.open("w");
fichier.write("Mode : " + mode + "\n" + res.faites + " règles " + (appliquer ? "appliquées" : "prêtes") + ", " + res.sautees + " sautées\n\n" + res.lignes.join("\n"));
fichier.close();
alert((appliquer ? "Application" : "Simulation") + " terminée.\n" + res.faites + " règles " + (appliquer ? "appliquées" : "prêtes") + ", " + res.sautees + " sautées.\n\nRapport : " + fichier.fsName);
