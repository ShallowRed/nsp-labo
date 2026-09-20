// Catalogue des graphiques qui ne sont pas des barres empilées : barres groupées (une barre par série et par item)
// et colonnes empilées côte à côte (G78). Données dans donnees-extraites/, reconstituées depuis les anciens SVG.

const VERSANT = [["FPE", "#E08DBC"], ["FPT", "#83BE76"], ["FPH", "#554C9F"]]; // framboise 300, prairie 300, lavande 600
const TAILLE = [["100 ou moins", "#7AC4EC"], ["100 à 500", "#3C9AC8"], ["500 à 5000", "#107098"], ["5000 et plus", "#0B4862"]];

export const FORMES = [
  {id: "G9", type: "groupes", legende: "Versant de la FP", fichier: "G9_sources_satisfaction_pleine_barre.svg", largeur: 471, series: VERSANT, max: 100, entete: "Part de réponses positives (oui ou plutôt oui)"},
  // les libellés de G17 sont vectorisés dans l'export : ils sont repris de la page 34
  {id: "G17", type: "groupes", legende: "Versant de la FP", fichier: "G17_changements_pro_long_pleine_barre.svg", largeur: 471, series: VERSANT, max: 40, entete: "Plusieurs réponses possibles",
    items: ["Changement dans l’organisation du travail", "Changement dans la hiérarchie", "Changement de poste / fonction", "Changement dans les techniques utilisées", "Fusion, déménagement, fermeture"]},
  {id: "G30", type: "groupes", legende: "Taille de l’administration", fichier: "G30_outils_pilotage_colonne_barre.svg", largeur: 340, series: TAILLE, max: 30, entete: "Part de réponses positives"},
  {id: "G45", type: "groupes", fichier: "G45_outils_pilotage_statut_large_barre.svg", largeur: 471, series: [["Organiser les journées de travail", "#E08DBC"], ["Mesurer le temps de travail", "#554C9F"]], max: 40},
  {id: "G46", type: "groupes", legende: "Versant de la FP", fichier: "G46_exprimer_maniere_manager_colonne_barre.svg", largeur: 328, series: VERSANT, max: 60, entete: "Plusieurs réponses possibles"},
  {id: "G66", type: "groupes", legende: "Versant de la FP", fichier: "G66_managers_benefice_accompagnement_long_colonne_barre.svg", largeur: 328, series: VERSANT, max: 60, entete: "Plusieurs réponses possibles"},
  {id: "G78", type: "colonnes", fichier: "G78_delta_valeur_agir_pleine_barre.svg", largeur: 350,
    colonnes: [["Importance de la valeur", [["Très important", "#0B4862"], ["Plutôt important", "#107098"]]], ["Capacité à agir", [["Oui", "#007777"], ["Plutôt oui", "#32C2C2"]]]]},
  // données de R (Donnees_graphiques/donnees_G40.xlsx), converties dans donnees-extraites/G40_aires.csv
  {id: "G40", type: "aires", legende: "Bien-être au travail", fichier: "G40_indice_qualite_collectif_large.svg", largeur: 366, max: 80, pas: 20, unite: "%",
    abscisse: "Indicateur de qualité du collectif", series: [["Mal", "#C24146"], ["Plutôt mal", "#DF6263"]]},
];
