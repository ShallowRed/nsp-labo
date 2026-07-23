# nsp-labo

Labo de la refonte de charte du collectif Nos Services Publics. Le spectre de couleurs est
**acté** (23 juillet 2026, scénario « resserré », 8 familles) : le repo est organisé autour de
cette source unique et des objets qu'elle génère pour chaque destinataire.

## Source unique et générateurs

Tout part de `notebooks/lib/spectre.js` (générateur OKLCH, contrastes, daltonisme, catégoriel
sous contraintes) et `notebooks/lib/scenarios.js` (les paramètres du spectre acté). Si une
teinte évolue : modifier `scenarios.js`, relancer les générateurs, tout suit.

| Destinataire | Objet | Générateur |
|--------------|-------|------------|
| Maëlle (chaîne R de l'enquête) | `exports/r/palette-maelle-resserre.R` (drop-in) + kit complet, cf. `exports/r/README.md` | `npm run gen:r` |
| Web et maquettes | `mockups/tokens-couleur.css` (primitifs + rôles) | `npm run gen:tokens` |
| Deck de présentation | SVG dans `nuxt-slides/public/images/nsp-refonte/` | `node scripts/gen-slides-assets.mjs` |
| Tram Anh (charte graphiques, InDesign) | table de correspondance dans la carte Pawn (`passation-couleurs-graphiques.md`) | - |

## Lancer

```bash
npm install
npm run preview   # notebooks en local (vite, port 5173)
npm run check     # mesures CLI du spectre (garanties de contraste, catégoriel, daltonisme)
npm run gen:r     # régénère le kit R
npm run gen:tokens # régénère les tokens CSS
```

## Structure

```
notebooks/                    # racine servie 1 (npm run preview)
├── index.html                # sommaire
├── couleurs-showcase.html    # le spectre acté en situation (vision daltonienne simulée)
├── enquete-hierarchie.html   # gabarit des figures web du rapport (likert, haltère)
├── lib/                      # spectre.js, scenarios.js, carte.js, deps.js
└── data/                     # TopoJSON départements, palettes relevées
mockups/                      # racine servie 3 (config charte-mockups, port 18798)
│                             # maquettes haute fidélité : rapport, couvertures, militant,
│                             # dataviz, usages typo ; tokens-couleur.css + tokens-typo.css
exports/
├── r/                        # kit R (cf. son README) : la passation Maëlle
├── print/                    # POC gdoc -> md -> ICML (cf. son README ; contenu gitignoré)
└── web/                      # pendant web du rapport, généré (racine servie 2, port 18796)
scripts/
├── check.mjs                 # mesures CLI (npm run check)
├── gen-r.mjs                 # kit R (theme + drop-in, correspondance et audit uniques)
├── gen-tokens-css.mjs        # tokens CSS des maquettes
├── gen-dataviz-map.mjs       # fond de carte des maquettes
├── gen-slides-assets.mjs     # SVG du deck (nuancier, échelles, daltonisme, OKLCH vs HSL)
├── finition-md.mjs           # finition typographique de l'export Markdown du gdoc
├── build-web.mjs             # pendant web chapitré du rapport (même Markdown que l'ICML)
└── smoke-*.mjs               # smoke tests jsdom des notebooks
```

## Racines servies

Convention impérative : toute page ajoutée sous une racine servie est référencée dans son
`index.html` dans la même modification. Les trois racines (notebooks 5173 en dev via
`npm run preview`, ou build statique servi en 18797 par la config `nsp-labo-notebooks` de
garden ; exports/web 18796 ; mockups 18798) se pointent mutuellement et ont chacune une
config dans le `launch.json` de garden.

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
