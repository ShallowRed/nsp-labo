// Catalogue des graphiques qui ne sont pas des barres empilées : barres groupées (une barre par série et par item)
// et colonnes empilées côte à côte (G78). Données dans donnees-extraites/, reconstituées depuis les anciens SVG.

const VERSANT = [["FPE", "framboise 300"], ["FPT", "prairie 300"], ["FPH", "lavande 600"]];
const TAILLE = [["100 ou moins", "petrole 250"], ["100 à 500", "petrole 400"], ["500 à 5000", "petrole 550"], ["5000 et plus", "petrole 700"]];

export const FORMES = [
  {id: "G9", type: "groupes", legende: "Versant de la FP", fichier: "G9_sources_satisfaction_pleine_barre.svg", largeur: 471, series: VERSANT, max: 100, entete: "Part de réponses positives (oui ou plutôt oui)"},
  // les libellés de G17 sont vectorisés dans l'export : ils sont repris de la page 34
  {id: "G17", type: "groupes", legende: "Versant de la FP", fichier: "G17_changements_pro_long_pleine_barre.svg", largeur: 471, series: VERSANT, max: 40, entete: "Plusieurs réponses possibles",
    items: ["Changement dans l’organisation du travail", "Changement dans la hiérarchie", "Changement de poste / fonction", "Changement dans les techniques utilisées", "Fusion, déménagement, fermeture"]},
  {id: "G30", type: "groupes", legende: "Taille de l’administration", fichier: "G30_outils_pilotage_colonne_barre.svg", largeur: 340, series: TAILLE, max: 30, entete: "Part de réponses positives"},
  {id: "G45", type: "groupes", fichier: "G45_outils_pilotage_statut_large_barre.svg", largeur: 471, series: [["Organiser les journées de travail", "framboise 300"], ["Mesurer le temps de travail", "lavande 600"]], max: 40},
  {id: "G46", type: "groupes", legende: "Versant de la FP", fichier: "G46_exprimer_maniere_manager_colonne_barre.svg", largeur: 328, series: VERSANT, max: 60, entete: "Plusieurs réponses possibles"},
  {id: "G66", type: "groupes", legende: "Versant de la FP", fichier: "G66_managers_benefice_accompagnement_long_colonne_barre.svg", largeur: 328, series: VERSANT, max: 60, entete: "Plusieurs réponses possibles"},
  {id: "G78", type: "colonnes", fichier: "G78_delta_valeur_agir_pleine_barre.svg", largeur: 350,
    colonnes: [["Importance de la valeur", [["Très important", "petrole 700"], ["Plutôt important", "petrole 550"]]], ["Capacité à agir", [["Oui", "canard 550"], ["Plutôt oui", "canard 300"]]]]},
  // données de R (Donnees_graphiques/donnees_G40.xlsx), converties dans donnees-extraites/G40_aires.csv
  {id: "G40", type: "aires", legende: "Bien-être au travail", fichier: "G40_indice_qualite_collectif_large.svg", largeur: 366, max: 80, pas: 20, unite: "%",
    abscisse: "Indicateur de qualité du collectif", series: [["Mal", "coquelicot 500"], ["Plutôt mal", "coquelicot 400"]]},
];
