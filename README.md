# nsp-labo

Labo de la refonte de charte du collectif Nos Services Publics. Le spectre de couleurs est
**acté** (23 juillet 2026, scénario « resserré », 8 familles) : le repo est organisé autour de
cette source unique, des notebooks Observable qui la déclinent visuellement, et des objets
qu'elle génère pour chaque destinataire.

## Source unique et générateurs

Tout part de `notebooks/lib/spectre.js` (générateur OKLCH, contrastes, daltonisme, catégoriel
sous contraintes, catégoriel étendu par teintes intermédiaires) et `notebooks/lib/scenarios.js`
(les paramètres du spectre acté). Si une teinte évolue : modifier `scenarios.js`, relancer les
générateurs, tout suit.

| Destinataire | Objet | Générateur |
|--------------|-------|------------|
| Tout le monde (visuels de référence) | notebook `couleurs-showcase` : gammes, usages, garanties | `npm run preview` |
| Maëlle (chaîne R de l'enquête) | `exports/r/palette-maelle-resserre.R` (drop-in) + kit complet, cf. `exports/r/README.md` | `npm run gen:r` |
| Deck de présentation | SVG dans `nuxt-slides/public/images/nsp-refonte/` | `node scripts/gen-slides-assets.mjs` |
| Tram Anh (charte graphiques, InDesign) | table de correspondance dans la carte Pawn (`passation-couleurs-graphiques.md`) | - |

Les maquettes HTML (`mockups/`) et la couche de tokens CSS ont été retirées le 23 juillet
(premier jet redondant avec les notebooks ; git garde tout, générateur de tokens compris,
à réintroduire avec le chantier site).

## Lancer

```bash
npm install
npm run preview   # notebooks en local (vite, port 5173)
npm run check     # mesures CLI du spectre (garanties de contraste, catégoriel, daltonisme)
npm run gen:r     # régénère le kit R
```

## Structure

```
notebooks/                    # racine servie 1 (npm run preview)
├── index.html                # sommaire
├── couleurs-showcase.html    # le spectre acté décliné : gammes, catégoriel étendu, situations
├── enquete-hierarchie.html   # gabarit des figures web du rapport (likert, haltère)
├── lib/                      # spectre.js, scenarios.js, carte.js, deps.js
└── data/                     # TopoJSON départements, palettes relevées
exports/
├── r/                        # kit R (cf. son README) : la passation Maëlle
├── print/                    # POC gdoc -> md -> ICML (cf. son README ; contenu gitignoré)
└── web/                      # pendant web du rapport, généré (racine servie 2, port 18796)
scripts/
├── check.mjs                 # mesures CLI (npm run check)
├── gen-r.mjs                 # kit R (theme + drop-in, correspondance et audit uniques)
├── gen-slides-assets.mjs     # SVG du deck (nuancier, échelles, daltonisme, OKLCH vs HSL)
├── finition-md.mjs           # finition typographique de l'export Markdown du gdoc
├── build-web.mjs             # pendant web chapitré du rapport (même Markdown que l'ICML)
└── smoke-*.mjs               # smoke tests jsdom des notebooks
```

## Racines servies

Convention impérative : toute page ajoutée sous une racine servie est référencée dans son
`index.html` dans la même modification. Deux racines : notebooks (5173 en dev via
`npm run preview`, ou build statique servi en 18797 par la config `nsp-labo-notebooks` de
garden, relancer `npm run build` avant) et exports/web (18796, config `enquete-web-poc`).

## Conventions

- Un notebook par exploration ; un notebook sans usage est supprimé (git garde l'historique),
  les explorations abandonnées vivent dans la carte Pawn, pas ici.
- Pédagogie : lisible sans bagage design ni code (code masqué, notions expliquées, guides de lecture).
- La logique et les textes de fond vivent dans `notebooks/lib/`, pas dans les cellules.
- Jamais d'import `npm:` en cellule (compilé en CDN : casse hors ligne) : passer par `lib/deps.js`.
- Couleur, contraste, daltonisme : toujours calculés (culori, matrices de Viénot), jamais estimés à l'oeil.

## Contexte

La mémoire de travail du chantier est dans la carte Pawn :
`shallowred-garden/agents/workspace-pawn/content/projets/nos-services-publics/`
(`exploration-couleurs.md` pour la décision de spectre, `passation-couleurs-graphiques.md`
pour les rôles et objets frontières de l'enquête).
