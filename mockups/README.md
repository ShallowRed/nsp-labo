# Maquettes haute fidélité de la charte

Productions pour se projeter sur les implications du spectre acté, et pour outiller les
décisions suivantes (typo, composition) en gardant les concerns séparés. La liste des
surfaces et leur description vivent dans `index.html` (le sommaire servi), pas ici.

## Séparation des concerns : deux jeux de variables indépendants

- `tokens-couleur.css` : la COUCHE COULEUR, générée du spectre acté par
  `npm run gen:tokens`. Primitifs `--sp-<famille>-<palier>` + rôles sémantiques
  `--c-*` (ink, brand, accent, thématiques, dataviz). Si le spectre évolue,
  régénérer ce fichier suffit, les maquettes suivent.
- `tokens-typo.css` : la COUCHE TYPO, trois partis sur l'axe proximité -> radicalité.
  Source unique des polices : les surfaces posent `.type-*` sur `<html>` (bascule via
  la barre d'outils), `typo-usages.html` pose les mêmes classes par colonne.

Les maquettes ne consomment que des rôles (`--c-*`, `--f-*`), jamais de valeur brute.
Le chrome commun (barre d'outils, bascule typo) est factorisé dans `chrome.css` +
`chrome.js` : hors charte, c'est l'outillage du labo. La carte de `dataviz.html` est
générée par `scripts/gen-dataviz-map.mjs` -> `carte-dep.svg` (fills en variables CSS,
recolorable sans régénérer les chemins).

## Lancer

Serveur statique sur ce dossier (config `charte-mockups` du launch.json de garden,
port 18798) : `index.html` sert de sommaire. Toute nouvelle page ajoutée ici doit y
être référencée, sinon elle reste invisible depuis la racine servie.

Contenu et valeurs de démonstration (extraits du rapport H&M). Typo et composition
provisoires tant que ces concerns ne sont pas tranchés.
