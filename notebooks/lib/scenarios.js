// Spectre NSP acté le 23 juillet 2026 : scénario « resserré », 8 familles.
// Chaque famille = { H : teinte OKLCH constante, k : caractère de chroma (1 = vif) }.
// Les scénarios écartés (continuité, v1 psp, vif-rupture) sont documentés dans la
// carte Pawn (exploration-couleurs.md) ; git garde leurs paramètres si besoin.

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
    options: { profil: "cloche" },
  },
};

// Familles candidates au jeu catégoriel dataviz (l'ordre final est recalculé
// sous contraintes par bestCategorical dans spectre.js).
export const CATEGORIEL = {
  "resserre": ["coquelicot", "ambre", "prairie", "canard", "lavande", "framboise"],
};
