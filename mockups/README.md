# Maquettes haute fidélité de la charte

Productions pour se projeter sur les implications du spectre, et pour outiller les
décisions suivantes (typo, composition) en gardant les concerns séparés.

## Séparation des concerns : deux jeux de variables indépendants

- `tokens-couleur.css` : la COUCHE COULEUR, générée du spectre acté par
  `npm run gen:tokens`. Primitifs `--sp-<famille>-<palier>` + rôles sémantiques
  `--c-*` (ink, brand, accent, thématiques, dataviz). Si le spectre évolue,
  régénérer ce fichier suffit, les maquettes suivent.
- `tokens-typo.css` : la COUCHE TYPO, trois partis sur l'axe proximité -> radicalité
  (classes `.type-proximite`, `.type-consolidation`, `.type-radicalite` sur `<html>`).

Les maquettes ne consomment que des rôles (`--c-*`, `--f-*`), jamais de valeur brute.
On tourne un bouton sans toucher l'autre : couleur et typo (et plus tard composition)
restent des variables indépendantes.

## Lancer

Serveur statique sur ce dossier (config `charte-mockups` du launch.json de garden,
port 18798) : `index.html` sert de sommaire, avec un lien vers chaque surface. Toute
nouvelle page ajoutée ici doit être référencée dans `index.html`, sinon elle reste
invisible depuis la racine servie. Barre du haut de chaque surface : bascule des
partis typo ; pour changer le spectre, régénérer `tokens-couleur.css` et recharger.

## Surfaces

- `rapport-spread.html` : double-page éditoriale (rapport enquête), la surface la plus
  révélatrice d'une charte (texte long, dataviz en situation, thématique, hiérarchie).
- `militant.html` : affiche, tuile réseau social, bannière. Le pôle saturé, en type et
  couleur, sans illustration coûteuse.
- `couvertures.html` : système de couvertures thématiques (une famille par politique
  publique, gabarit constant, motif de l'arc). Se lit en rayon.
- `dataviz.html` : planche du langage graphique (choroplèthe recolorable en direct via
  variables CSS, séries catégorielles validées, échelles séquentielle et divergente).
  La carte : `scripts/gen-dataviz-map.mjs` -> `carte-dep.svg` (fills en var CSS).
- `typo-usages.html` : outil de décision typo. Spécimens des trois partis en polices
  réelles + grille des usages (fort/moyen/faible par usage), sur l'axe proximité ->
  radicalité. Ne dépend pas du spectre régénéré (polices, pas couleurs).

Contenu et valeurs de démonstration (extraits du rapport H&M). Typo et composition
provisoires tant que ces concerns ne sont pas tranchés.
