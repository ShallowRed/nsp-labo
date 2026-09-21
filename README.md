# nsp-labo

Système de couleurs du collectif Nos services publics : la source du spectre, les fichiers qu'elle produit pour chaque environnement, et les notebooks qui présentent le travail. La production du rapport d'enquête de 2026, qui a consommé ce système, est rangée à part dans `rapports/hm-2026/`.

## La source

Le spectre est calculé en OKLCH : 8 familles en 11 paliers nommés, de 50 à 950, et leurs crans intermédiaires, soit 152 couleurs. Le générateur, les mesures de contraste et la simulation du daltonisme sont dans `notebooks/lib/spectre.js` ; les paramètres du spectre acté sont dans `notebooks/lib/scenarios.js`. Hors du gamut sRGB, le chroma est réduit à teinte constante : la clarté et la teinte restent exactes. La règle des teintes claires a été fixée le 18 septembre 2026 (`nsp-site/docs/ddr/DDR-005-teintes-claires-du-spectre.md`).

Une teinte se modifie dans `scenarios.js`. Les garanties se vérifient avec `npm run check`, puis chaque fichier livré se régénère avec sa commande `npm run gen:*` ou son script de `scripts/` ; `npm run` liste les commandes.

## Les fichiers livrés

- `exports/spectre/spectre-nsp.csv` : les 152 couleurs en hex et en `oklch()` exact. C'est la référence commune, et la livraison pour le web : nsp-site en garde une copie dans `tokens/` et en tire ses variables CSS.
- `exports/spectre/spectre-nsp.css` : les mêmes 152 couleurs en propriétés CSS `--nsp-<famille>-<palier>`, pour une page ou une feuille Sass. Le thème `nsp` des présentations vignettes en garde une copie.
- `exports/spectre/spectre-nsp.ase` : le nuancier pour InDesign et Illustrator, avec les recettes des graphiques nommées par modalité. Mode d'emploi dans `exports/spectre/README.md`.
- `exports/spectre/epreuve-cmjn.csv` : la séparation Coated FOGRA39 de chaque couleur et son écart ΔE2000 avec l'écran.
- `exports/r/` : le kit R, thème ggplot et palettes par modalité. Mode d'emploi dans `exports/r/README.md`.
- Les SVG du deck de présentation (nuancier, échelles, daltonisme), écrits dans `vignettes/presentations/assets/images/nsp-refonte/` par `scripts/gen-slides-assets.mjs`.

Les recettes des graphiques sont les mêmes dans le nuancier Adobe et dans le kit R : un graphique R et une figure InDesign qui les suivent ont les mêmes couleurs.

## Les notebooks

Les notebooks sont la surface de présentation du travail sur la couleur : ce qui doit être montré ou expliqué y va. Ils sont publiés depuis `main` sur https://shallowred.github.io/nsp-labo/, et leur page d'accueil liste les fichiers livrés.

Un notebook par sujet ; un notebook sans usage est supprimé, git garde l'historique. La logique et les textes de fond sont dans `notebooks/lib/`. Les dépendances passent par `lib/deps.js`, jamais par un import `npm:` en cellule. Couleur, contraste et daltonisme sont toujours calculés. Toute page ajoutée est liée depuis `notebooks/index.html` dans la même modification, avec son extension `.html`.

## Points ouverts

- Les traits de grille des graphiques du rapport sont d'un gris, `#E6ECEF`, qui n'appartient pas au spectre.
- Les données de ces graphiques sont sur le poste de Lucas et ne sont pas versionnées ; ce dépôt est public.
- La copie du CSV vers nsp-site est manuelle.

La mémoire de travail du chantier est dans la carte Pawn : `shallowred-garden/agents/workspace-pawn/content/projets/nos-services-publics/`.
