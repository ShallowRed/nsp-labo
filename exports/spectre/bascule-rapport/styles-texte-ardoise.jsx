// Passe couleur du rapport : couleur des styles de texte.
// Le texte courant quitte le noir riche pour l'ardoise 700, et les étiquettes de
// graphique composées dans InDesign suivent la même règle que les SVG : le titre
// garde le pétrole 700, graduations, étiquettes et légende passent en ardoise 700.
// Fenêtre > Utilitaires > Scripts, glisser ce fichier dans le panneau, double-cliquer.

#target indesign

var doc = app.activeDocument;

var VERS_ARDOISE = [
  "Contenu chapitre:Texte:Corps SM",
  "Contenu chapitre:Texte:Note de bas de page",
  "Contenu chapitre:Encadré:Texte courant",
  "Contenu chapitre:Graphiques:Champ/Note de lecture",
  "Meta - Document:Gabarit:Numéro de page",
  "Contenu chapitre:Graphiques:Etiquette graduations",
  "Contenu chapitre:Graphiques:Etiquette mineur",
  "Contenu chapitre:Graphiques:Etiquette majeur",
  "Contenu chapitre:Graphiques:Légende couleur"
];

function styleParChemin(chemin) {
  var morceaux = chemin.split(":");
  var conteneur = doc;
  for (var i = 0; i < morceaux.length - 1; i++) {
    var groupe = conteneur.paragraphStyleGroups.itemByName(morceaux[i]);
    if (!groupe.isValid) return null;
    conteneur = groupe;
  }
  var style = conteneur.paragraphStyles.itemByName(morceaux[morceaux.length - 1]);
  return style.isValid ? style : null;
}

var ardoise = doc.colors.itemByName("ardoise 700");
if (!ardoise.isValid) {
  alert("La nuance « ardoise 700 » est absente du document. Exécuter d'abord nuances-indesign-rvb.jsx.");
} else {
  var faits = [], manquants = [];
  for (var i = 0; i < VERS_ARDOISE.length; i++) {
    var style = styleParChemin(VERS_ARDOISE[i]);
    if (style) {
      style.fillColor = ardoise;
      faits.push(VERS_ARDOISE[i]);
    } else {
      manquants.push(VERS_ARDOISE[i]);
    }
  }
  var message = faits.length + " styles passés en ardoise 700.";
  if (manquants.length) message += "\n\nIntrouvables :\n" + manquants.join("\n");
  message += "\n\nLe style « Titre du graphique » garde le pétrole 700, il n'est pas touché.";
  alert(message);
}
