# nsp-labo

Système de couleurs du collectif Nos services publics. Le dépôt contient la source du spectre, les générateurs qui la déclinent pour chaque environnement de production, et les notebooks qui l'expliquent. Les productions qui ont consommé ce système sont rangées à part, dans `rapports/`.

## La source

Le spectre est calculé, jamais saisi à la main : 8 familles (coquelicot, framboise, lavande, pétrole, canard, prairie, ambre, ardoise) en 11 paliers nommés, de 50 à 950, plus les crans intermédiaires, soit 152 couleurs.

- `notebooks/lib/spectre.js` : le générateur OKLCH, les mesures de contraste, la simulation du daltonisme, le choix des couleurs catégorielles sous contraintes.
- `notebooks/lib/scenarios.js` : les paramètres du spectre acté le 23 juillet 2026 (scénario « resserré »).

Hors du gamut sRGB, le chroma est réduit à teinte constante, ce qui laisse la clarté et la teinte exactes. La règle des teintes claires a été fixée le 18 septembre 2026 après un test papier ; la décision et ses mesures sont dans `nsp-site/docs/ddr/DDR-005-teintes-claires-du-spectre.md`, et le notebook `variantes-teintes-claires` montre les variantes comparées.

Pour faire évoluer une teinte : modifier `scenarios.js`, lancer `npm run check`, puis relancer les générateurs du tableau ci-dessous.

## Les livraisons, par environnement

| Environnement | Objet livré | Générateur | Destinataire et usage |
|---|---|---|---|
| Tous | `exports/spectre/spectre-nsp.csv` : les 152 couleurs en hex et en `oklch()` exact | `npm run gen:ase` | Référence commune, lue par les autres environnements |
| Web | le même CSV, copié dans `nsp-site/tokens/spectre-nsp.csv` | dans nsp-site : `mise run tokens` écrit `tokens.css` (variables `--color-<famille>-<palier>` en `oklch()`) | Site du collectif ; les rôles (`--nsp-brand`…) sont définis dans `nsp-site/tokens/roles.css` |
| Impression, Adobe | `exports/spectre/spectre-nsp.ase` : nuancier à charger dans InDesign ou Illustrator | `npm run gen:ase` | Maquettistes ; mode d'emploi dans `exports/spectre/README.md` |
| Impression, épreuve | `exports/spectre/epreuve-cmjn.csv` et `.html` : séparations Coated FOGRA39 et ΔE2000 par couleur | `.venv/bin/python scripts/epreuve-cmjn.py` | Vérifier ce que la presse rend avant un bon à tirer |
| R | `exports/r/` : thème ggplot, palettes par modalité, export des figures | `npm run gen:r` | Chaîne d'analyse des enquêtes ; mode d'emploi dans `exports/r/README.md` |
| Présentations | SVG du nuancier, des échelles et du daltonisme, écrits dans `nuxt-slides/public/images/nsp-refonte/` | `node scripts/gen-slides-assets.mjs` | Deck de présentation de la refonte |
| Notebooks | https://shallowred.github.io/nsp-labo/ | publication automatique depuis `main` | Article de référence et explorations, lisibles sans bagage design ni code |

Les recettes pour les graphiques (échelles d'opinion, fréquences, catégories sans ordre, « ne sait pas ») sont les mêmes dans le nuancier Adobe et dans le kit R : un graphique R et une figure InDesign qui les suivent ont les mêmes couleurs. `scripts/smoke-charte.mjs` vérifie que chaque recette de la charte graphique se résout dans le spectre.

## Les notebooks

Les notebooks sont la surface de présentation du travail sur la couleur et la charte graphique : ce qui doit être montré ou expliqué y va, et leur page d'accueil (`notebooks/index.html`) reprend la liste des fichiers livrés par environnement. Ce README s'adresse à qui maintient le dépôt.

- `couleurs-showcase` : l'article de référence (nuancier, échelles, accessibilité).
- `palette-rapport` : la palette des enquêtes en situation, avec le bloc R.
- `categories-sans-ordre` : les trios de couleurs pour les modalités qu'on ne peut pas classer.
- `variantes-teintes-claires` : la comparaison des règles pour l'extrémité claire du spectre.

Un notebook par exploration ; un notebook sans usage est supprimé, git garde l'historique. La logique et les textes de fond sont dans `notebooks/lib/`, pas dans les cellules. Aucun import `npm:` en cellule : passer par `lib/deps.js`. Couleur, contraste et daltonisme sont toujours calculés (culori, matrices de Viénot). Toute page ajoutée est référencée dans `notebooks/index.html` dans la même modification.

## Les productions

`rapports/hm-2026/` : la production du rapport d'enquête « Travailler dans le service public » (graphiques en D3, annexes, couverture, scripts InDesign). Voir son README. Le texte du rapport n'est pas dans ce dépôt.

## Lancer

```bash
npm install
npm run preview   # notebooks en local (port 5173)
npm run build     # site statique dans notebooks/.observable/dist
npm run check     # garanties du spectre : contrastes, catégoriel, daltonisme
npm run gen:ase   # CSV et nuancier Adobe
npm run gen:r     # kit R
```

`scripts/smoke-showcase.mjs` et `scripts/smoke-charte.mjs` sont des tests rapides des notebooks et des recettes.

## Points ouverts

- Le générateur de graphiques de `rapports/hm-2026/graphiques/` écrit des couleurs saisies en dur, celles du spectre du 4 septembre 2026, puis les SVG sont recolorés. Il devrait lire `spectre-nsp.csv` par nom de palier ; les données reconstituées depuis les anciens SVG utilisent ces valeurs comme clé, ce qui demande de séparer la clé de lecture de la couleur de sortie.
- Les données de ces graphiques sont lues dans un dossier du poste de Lucas et ne sont pas versionnées ; leur emplacement reste à décider, ce dépôt étant public.
- La copie du CSV vers nsp-site est manuelle.

## Contexte

La mémoire de travail du chantier est dans la carte Pawn : `shallowred-garden/agents/workspace-pawn/content/projets/nos-services-publics/`.
