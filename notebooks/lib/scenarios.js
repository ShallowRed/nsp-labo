// Scénarios de spectre : l'espace de variations consigné dans la carte Pawn
// (nombre de teintes, distance au bleu pétrole NSP, profils de chroma).
// Chaque scénario = un jeu de familles {H, k} + des options de génération.
// H : teinte OKLCH constante de la famille ; k : caractère de chroma (1 = vif).

export const SCENARIOS = {
  "continuite": {
    label: "Continuité : gravité pétrole",
    these:
      "L'identité reste ancrée dans le bleu pétrole actuel. Peu de familles, saturation tempérée, les couleurs chaudes ne servent que d'accent. Répond à la crainte de rupture du camp analytique.",
    implications:
      "Le collectif reste immédiatement reconnaissable : le logo et les rapports existants ne détonnent pas. En contrepartie, les graphiques riches sont limités (4 séries distinctes au lieu de 6, car les bleus tempérés sont trop discrets pour la dataviz), et toute l'énergie visuelle repose sur le seul rouge coquelicot.",
    familles: {
      petrole: { H: 235, k: 0.55 },
      canard: { H: 195, k: 0.75 },
      prairie: { H: 145, k: 0.7 },
      ambre: { H: 65, k: 0.7 },
      coquelicot: { H: 22, k: 0.95 },
      ardoise: { H: 235, k: 0.12 },
    },
    options: { profil: "cloche" },
  },

  "median-v01": {
    label: "Médian : draft v0.1",
    these:
      "Le draft de la première passe, comme référence : 11 familles qui réconcilient tout l'existant (PSP, cartos, satellites), avec un caractère de saturation propre à chaque famille.",
    implications:
      "Toutes les couleurs déjà utilisées (charte du Printemps, cartes interactives, sites satellites) trouvent une place dans le nouveau spectre : rien n'est renié, tout converge. En contrepartie, 11 familles font un système riche mais long à documenter et à faire respecter.",
    familles: {
      coquelicot: { H: 22, k: 1.0 },
      framboise: { H: 355, k: 0.95 },
      amethyste: { H: 320, k: 0.85 },
      lavande: { H: 285, k: 0.9 },
      petrole: { H: 235, k: 0.55 },
      myosotis: { H: 230, k: 0.9 },
      canard: { H: 195, k: 0.75 },
      prairie: { H: 145, k: 0.85 },
      olive: { H: 120, k: 0.6 },
      ambre: { H: 65, k: 0.8 },
      ardoise: { H: 235, k: 0.12 },
    },
    options: { profil: "cloche" },
  },

  "resserre": {
    label: "Resserré : 8 familles",
    these:
      "Un spectre minimal qui couvre quand même tous les usages : une seule famille par zone de teinte utile. Le bleu franc fusionne dans le pétrole, le violet dans la framboise, l'olive disparaît. Moins à gouverner, moins à expliquer.",
    implications:
      "Les mesures montrent que 8 familles offrent les mêmes garanties de lisibilité et des graphiques aussi bons que 11 : le système devient plus simple à expliquer, à maintenir et à transmettre. En contrepartie, moins de nuances disponibles le jour où il faut distinguer beaucoup de thématiques de politiques publiques.",
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

  "vif-rupture": {
    label: "Vif : rupture assumée",
    these:
      "L'énergie militante prend la main : saturation poussée sur toute la gamme, le rouge coquelicot devient le centre de gravité, le bleu pétrole reste présent mais redevient une couleur parmi d'autres.",
    implications:
      "L'identité gagne nettement en énergie et en présence, sur les réseaux comme en affiche. En contrepartie : le bleu actuel du logo n'est plus exactement représentable dans le spectre (rupture à assumer auprès des habitués), et la règle de lisibilité s'affaiblit un peu (il faut 550 paliers d'écart au lieu de 500 pour garantir un texte lisible).",
    familles: {
      coquelicot: { H: 22, k: 1.1 },
      framboise: { H: 355, k: 1.05 },
      amethyste: { H: 320, k: 0.95 },
      lavande: { H: 285, k: 1.0 },
      myosotis: { H: 230, k: 1.0 },
      canard: { H: 195, k: 0.85 },
      prairie: { H: 145, k: 0.95 },
      olive: { H: 115, k: 0.75 },
      ambre: { H: 65, k: 0.95 },
      ardoise: { H: 245, k: 0.15 },
    },
    options: { profil: "plateau", kGlobal: 1.1 },
  },
};

// familles proposées pour le jeu catégoriel dataviz de chaque scénario.
// continuite : pétrole et ardoise sont trop tempérés pour passer le plancher de
// chroma dans la bande de clarté -> catégoriel réduit à 4 séries (constat, pas un choix).
export const CATEGORIEL = {
  "continuite": ["coquelicot", "ambre", "prairie", "canard"],
  "median-v01": ["coquelicot", "ambre", "prairie", "canard", "lavande", "framboise"],
  "resserre": ["coquelicot", "ambre", "prairie", "canard", "lavande", "framboise"],
  "vif-rupture": ["coquelicot", "ambre", "prairie", "canard", "lavande", "framboise"],
};
