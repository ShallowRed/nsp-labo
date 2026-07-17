# nsp-labo

Expérimentations du collectif Nos Services Publics : notebooks Observable (Notebook Kit v2, Observable Plot, D3). Premier chantier : le système de couleurs de la refonte de charte.

## Lancer

```bash
npm install
npm run preview   # serveur local (vite), édition à chaud des notebooks
npm run build     # site statique dans dist/
npm run check     # contrôles CLI des scénarios (mêmes calculs que le notebook)
```

## Structure

```
notebooks/                    # racine des notebooks (un .html = un notebook)
├── index.html                # sommaire
├── couleurs-scenarios.html   # scénarios de spectre : continuité, médian, resserré, vif
├── lib/
│   ├── spectre.js            # générateur OKLCH, contrastes, daltonisme, catégoriel sous contraintes
│   └── scenarios.js          # les scénarios paramétrés et leurs thèses
└── data/
    └── sources.json          # palettes existantes relevées (cartos, charte PSP, ancres web)
scripts/check.mjs             # batterie de mesures en CLI (npm run check)
```

## Conventions

- Un notebook par exploration, cellules en JavaScript standard (Notebooks 2.0).
- La logique réutilisable vit dans `notebooks/lib/` (importée par les notebooks et par `scripts/`), pas dans les cellules.
- Les données sont figées dans `notebooks/data/` avec leur provenance et leur date de relevé.
- Tout ce qui touche couleur, contraste ou daltonisme est calculé (culori, matrices de Viénot), jamais estimé à l'oeil.

## Contexte

La mémoire de travail du chantier (couches constat / partagé / positions Lucas) est dans la carte Pawn : `shallowred-garden/agents/workspace-pawn/content/projets/nos-services-publics/` (notes `exploration-couleurs.md`, `refonte-charte.md`, `roadmap.md`).
