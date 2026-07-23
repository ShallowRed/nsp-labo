# Kit R : enquête Hiérarchie et management

Habillage NSP pour la chaîne d'analyse R de l'enquête, en surcouche : aucun fichier du repo
d'analyse n'est modifié. Spectre acté le 23 juillet 2026 ; source unique
`notebooks/lib/scenarios.js`, fichiers régénérés par `node scripts/gen-r.mjs`.

## Deux voies d'intégration

**Voie 1, minimale (la passation retenue)** : `palette-maelle-resserre.R` reprend les noms de
variables du code d'analyse (`rouge1..gris4`, convention 1 = foncé). Coller le bloc à la place
du bloc de couleurs existant : les palettes `pal_M*` s'adaptent seules. Les points à confirmer
ensemble (pivot « ça dépend », gris du « ne sait pas », encre) sont en commentaires du fichier.

**Voie 2, kit complet (optionnelle)** : familles entières et thème ggplot.

```r
source("utils_rapports.R")          # inchangé
source("theme_nsp_couleurs.R")
source("theme_nsp.R")
appliquer_theme_nsp("utils_rapports.R")
```

Retour arrière : re-sourcer `utils_rapports.R`, rien d'autre.

## Contenu

- `palette-maelle-resserre.R` : **généré**. Le drop-in de la voie 1.
- `theme_nsp_couleurs.R` : **généré**. Familles 19 paliers, séquentielle `nsp_seq(n)` (remplace
  les rampes Brewer), constantes `nsp_*` alignées sur `utils_rapports.R`. L'en-tête embarque
  l'audit daltonisme des archétypes de palettes (deutan, protan, tritan) : zéro conflit.
- `theme_nsp.R` : écrit à la main. `theme_nsp()` (ggplot), échelles, et `appliquer_theme_nsp()`
  qui redéfinit les constantes et ré-évalue le bloc palettes de `utils_rapports.R` tel quel.
- `export_figures.R` : boucle d'export des figures (voir le manifeste côté `exports/print/`).

## Export SVG : texte éditable

Le device `svg()` de base vectorise le texte (vérifié sur pièce : zéro `<text>` dans les
exports). Utiliser **svglite** :

```r
ggsave("figure.svg", plot, device = svglite::svglite, width = 8, height = 5)
```

## Statut

Le likert vert-rouge d'origine était indiscernable en deutéranopie (dE 6.9-7.2 entre pôles) ;
les pôles NSP (canard/coquelicot) passent l'audit. Non testé sous R sur ce poste (R absent) :
la première exécution se fait avec Maëlle.
