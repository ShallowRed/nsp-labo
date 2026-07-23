// Correspondance directe avec la « Charte couleurs graphiques » de Tram Anh
// (document InDesign du 21 juillet 2026, taxonomie par type de donnée).
// Sa taxonomie reste le cadre ; seules les valeurs changent, et ses seize lignes
// se replient sur quatre règles. Les recettes sont des paires [famille, palier]
// du spectre acté ; cohérentes avec le drop-in R (bleu1 = petrole 700, etc.).

// Les quatre règles qui engendrent toutes les lignes.
export const REGLES = [
  {
    id: 1,
    titre: "Opinion (négatif vers positif)",
    resume:
      "Divergente coquelicot vers canard, jamais rouge-vert. Pivot impair : ambre 300 à 3 modalités, ardoise 100 à 5 (un pivot moutarde se confond avec le pôle chaud en daltonisme, dE 7 mesuré contre 15).",
    recette: [["coquelicot", 600], ["coquelicot", 300], ["canard", 450], ["canard", 600]],
  },
  {
    id: 2,
    titre: "Fréquence, intensité (jamais vers toujours)",
    resume:
      "Progression pétrole, une seule famille. Remplace les variantes « majorité positive/négative » : au-delà de deux crans par pôle, une seule famille se lit mieux qu'une divergente déséquilibrée.",
    recette: [["petrole", 700], ["petrole", 450], ["petrole", 250], ["petrole", 100]],
  },
  {
    id: 3,
    titre: "Catégories sans ordre",
    resume:
      "Jeu catégoriel calculé (bande de clarté, daltonisme), pris dans l'ordre : les 3 premières couleurs pour 3 catégories, etc.",
    recette: [["coquelicot", 500], ["canard", 450], ["ambre", 400], ["lavande", 300]],
  },
  {
    id: 4,
    titre: "« Ne sait pas, non renseigné »",
    resume: "Ardoise 150, toujours le même gris clair, quelle que soit la figure.",
    recette: [["ardoise", 150]],
  },
];

// Ses lignes, une à une : hex d'origine (son PDF), règle qui la couvre, recette spectre.
// note : présente quand la correspondance simplifie au lieu de transposer.
const NEUTRE = ["ardoise", 150];
const DIV2 = [["coquelicot", 500], ["canard", 500]];
const DIV3 = [["coquelicot", 500], ["ambre", 300], ["canard", 450]];
const DIV4 = [["coquelicot", 600], ["coquelicot", 300], ["canard", 450], ["canard", 600]];
const DIV5 = [["coquelicot", 600], ["coquelicot", 300], ["ardoise", 100], ["canard", 450], ["canard", 600]];
const PROG4 = [["petrole", 700], ["petrole", 450], ["petrole", 250], ["petrole", 100]];
const PROG5 = [["petrole", 750], ["petrole", 550], ["petrole", 400], ["petrole", 250], ["petrole", 100]];
const CAT = [["coquelicot", 500], ["canard", 450], ["ambre", 400], ["lavande", 300]];

export const LIGNES = [
  { section: "Nominales", nom: "3 catégories", avant: ["#ad287d", "#438d86", "#715298"], regle: 3, apres: CAT.slice(0, 3) },
  { section: "Nominales", nom: "4 catégories", avant: ["#ad287d", "#cc5426", "#438d86", "#715298"], regle: 3, apres: CAT },
  { section: "Ordinales", nom: "2 — divergence", avant: ["#cc5426", "#438f44"], regle: 1, apres: DIV2 },
  { section: "Ordinales", nom: "2 — divergence + neutre", avant: ["#dadada", "#cc5426", "#438f44"], regle: 1, apres: [NEUTRE, ...DIV2] },
  { section: "Ordinales", nom: "3 — divergence", avant: ["#cc5426", "#ccbd2f", "#438f44"], regle: 1, apres: DIV3 },
  { section: "Ordinales", nom: "3 — divergence + neutre", avant: ["#dadada", "#cc5426", "#ccbd2f", "#438f44"], regle: 1, apres: [NEUTRE, ...DIV3] },
  { section: "Ordinales", nom: "4 — divergence", avant: ["#cc5426", "#f1881d", "#8da83a", "#438f44"], regle: 1, apres: DIV4 },
  { section: "Ordinales", nom: "4 — progression", avant: ["#323786", "#52539e", "#8783bd", "#b2afd7"], regle: 2, apres: PROG4 },
  { section: "Ordinales", nom: "4 — divergence + neutre", avant: ["#dadada", "#cc5426", "#f1881d", "#8da83a", "#438f44"], regle: 1, apres: [NEUTRE, ...DIV4] },
  { section: "Ordinales", nom: "4 — divergence majorité négative + neutre", avant: ["#dadada", "#cc5426", "#f1881d", "#f5a207", "#438f44"], regle: 2, apres: [NEUTRE, ...PROG4], note: "échelle de fréquence : progression, pas divergente déséquilibrée" },
  { section: "Ordinales", nom: "4 — divergence majorité positive + neutre", avant: ["#dadada", "#cc5426", "#a5b836", "#8da83a", "#438f44"], regle: 2, apres: [NEUTRE, ...PROG4], note: "idem : progression" },
  { section: "Ordinales", nom: "4 — progression + neutre", avant: ["#dadada", "#323786", "#52539e", "#8783bd", "#b2afd7"], regle: 2, apres: [NEUTRE, ...PROG4] },
  { section: "Ordinales", nom: "5 — divergence", avant: ["#cc5426", "#f1881d", "#ccbd2f", "#8da83a", "#438f44"], regle: 1, apres: DIV5, note: "pivot neutre clair, pas moutarde (mesuré)" },
  { section: "Ordinales", nom: "5 — divergence majorité négative", avant: ["#cc5426", "#f1881d", "#f5a207", "#ccbd2f", "#438f44"], regle: 2, apres: PROG5, note: "échelle de fréquence : progression" },
  { section: "Ordinales", nom: "5 — divergence majorité positive", avant: ["#cc5426", "#ccbd2f", "#a5b836", "#8da83a", "#438f44"], regle: 2, apres: PROG5, note: "idem : progression" },
  { section: "Ordinales", nom: "5 — progression", avant: ["#323786", "#52539e", "#8783bd", "#b2afd7", "#d3d1e9"], regle: 2, apres: PROG5 },
  { section: "Ordinales", nom: "5 — progression + neutre", avant: ["#dadada", "#323786", "#52539e", "#8783bd", "#b2afd7", "#d3d1e9"], regle: 2, apres: [NEUTRE, ...PROG5] },
];

// Deux vraies figures du rapport, pour l'avant/après.
export const FIGURES = [
  {
    titre: "Comment vous sentez-vous... (module 1)",
    modalites: ["mal", "plutôt mal", "plutôt bien", "bien", "ne sait pas"],
    avant: ["#cc5426", "#f1881d", "#8da83a", "#438f44", "#dadada"],
    apres: [["coquelicot", 600], ["coquelicot", 300], ["canard", 450], ["canard", 600], NEUTRE],
    lignes: {
      "en général": [4, 16, 57, 17, 6],
      "au travail": [12, 31, 41, 10, 6],
    },
  },
  {
    titre: "Appliquez-vous strictement les consignes pour faire votre travail ? (par catégorie statutaire A+, A, B, C)",
    modalites: ["applique strictement", "parfois autrement", "souvent autrement", "ne sait pas"],
    avant: ["#00913b", "#f1881d", "#cc5426", "#dadada"],
    apres: [["canard", 500], ["ambre", 300], ["coquelicot", 500], NEUTRE],
    lignes: {
      "A+": [9, 60, 15, 16],
      "A": [9, 61, 15, 15],
      "B": [21, 57, 10, 11],
      "C": [26, 52, 10, 12],
      "Autre": [15, 59, 9, 17],
    },
  },
];
