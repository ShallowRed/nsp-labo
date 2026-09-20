// Spectre NSP acté le 23 juillet 2026 : scénario « resserré », 8 familles.
// Chaque famille = { H : teinte OKLCH constante, k : caractère de chroma (1 = vif) }.
// Les scénarios écartés (continuité, v1 psp, vif-rupture) sont documentés dans la
// carte Pawn (exploration-couleurs.md) ; git garde leurs paramètres si besoin.
// Hors gamut sRGB, le chroma est réduit à teinte constante : la clarté et la teinte
// restent exactes, seule la saturation cède. Le plafond de cloche `plafondGamut` n'est
// plus appliqué au scénario acté, il ne sert plus qu'aux variantes : posé sous le gamut
// de la teinte la plus étroite, il tenait toute la branche claire à la même valeur et
// coûtait 9,4 % de chroma (notebook variantes-teintes-claires).

const plafondGamut = (L) => 0.45 * (1 - L);
const plafondClair = (L) => (L >= 0.92 ? plafondGamut(L) : Infinity);

export const SCENARIOS = {
  "resserre": {
    label: "Spectre NSP resserré (8 familles)",
    these:
      "Un spectre minimal qui couvre tous les usages : une seule famille par zone de teinte utile. Moins à gouverner, moins à expliquer.",
    implications:
      "Les mesures montrent que 8 familles offrent les mêmes garanties de lisibilité et des graphiques aussi bons que 11 : le système est simple à expliquer, à maintenir et à transmettre.",
    familles: {
      coquelicot: { H: 22, k: 1.0 },
      framboise: { H: 345, k: 0.9 },
      lavande: { H: 285, k: 0.9 },
      petrole: { H: 233, k: 0.65 },
      canard: { H: 195, k: 0.75 },
      prairie: { H: 140, k: 0.8 },
      ambre: { H: 65, k: 0.8 },
      ardoise: { H: 235, k: 0.12 },
    },
    options: { profil: "cloche", ecretage: "oklch", plafond: null },
  },
};

// Variantes de l'extrémité claire comparées avant de retenir la règle ci-dessus
// (notebook variantes-teintes-claires). Overrides de genScale ; « sRGB » est la règle
// d'origine, celle des premiers graphiques du rapport d'enquête de 2026.
export const VARIANTES = {
  "ecretage-srgb": { label: "écrêtage sRGB (règle d'origine)", options: { ecretage: "rgb", plafond: null } },
  "plafond-50-100": { label: "écrêtage sRGB + plafond gamut sur 50 et 100", options: { ecretage: "rgb", plafond: plafondClair } },
  "plafond-continu": { label: "écrêtage sRGB + plafond gamut sur toute l'échelle", options: { ecretage: "rgb", plafond: plafondGamut } },
  "teinte-constante": { label: "écrêtage à teinte constante (retenue le 18 septembre 2026)", options: { ecretage: "oklch", plafond: null } },
  "teinte-constante-plafond": { label: "teinte constante + plafond sur 50 et 100", options: { ecretage: "oklch", plafond: plafondClair } },
  "teinte-constante-plafond-continu": { label: "teinte constante + plafond sur toute l'échelle (retenue du 4 au 18 septembre 2026)", options: { ecretage: "oklch", plafond: plafondGamut } },
};

// Familles candidates au jeu catégoriel dataviz (l'ordre final est recalculé
// sous contraintes par bestCategorical dans spectre.js).
export const CATEGORIEL = {
  "resserre": ["coquelicot", "ambre", "prairie", "canard", "lavande", "framboise"],
};
