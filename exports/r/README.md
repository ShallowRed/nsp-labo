# Kit R : enquête Hiérarchie et management

Habillage NSP pour la chaîne d'analyse R de l'enquête, en surcouche : aucun fichier du repo
d'analyse n'est modifié. Spectre acté le 23 juillet 2026 ; source unique
`notebooks/lib/scenarios.js`, fichiers régénérés par `node scripts/gen-r.mjs`.

## Deux voies d'intégration

**Voie 1, minimale (la passation retenue)** : `palette-maelle-resserre.R` reprend les noms de
variables du code d'analyse (`rouge1..gris4`, convention 1 = foncé), plus `neutre2` et `neutre3`
pour les catégories sans ordre ni connotation (FPE / FPT / FPH) — trio encore à confirmer,
les candidats sont comparés dans le notebook « Catégories sans ordre ». Coller le bloc à la place
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
- `figure-G40.R` : écrit à la main. La figure « outils de pilotage selon le statut »,
  refaite de zéro à la charte (deux modalités sans ordre : `neutre2`).

## Export SVG : texte éditable ET Poppins

Les deux sont compatibles, il n'y a pas d'arbitrage à faire. Ce qui vectorise le texte,
c'est le device, pas la police : le `svg()` de base convertit les glyphes en polygones
(vérifié sur pièce : zéro `<text>` dans les exports), et **showtext** fait de même en
dessinant lui-même les glyphes. **svglite** écrit des `<text>` stylés et découvre les
polices installées via *systemfonts* : le nom de la famille part dans le fichier, le texte
reste éditable.

```r
# Poppins installée sur le poste (Google Fonts) ; sinon : systemfonts::register_font()
p <- p + ggplot2::theme(text = ggplot2::element_text(family = "Poppins"))
ggsave("figure.svg", p, device = svglite::svglite, width = 180, height = 110, units = "mm")
```

Exporter avec la bonne police n'est pas cosmétique : les métriques de Poppins déterminent
la largeur des étiquettes, donc les retours à la ligne et la position de l'axe. Changer la
police après coup en PAO décale tout.

## Alignement du texte sur l'axe

Il varie d'une figure à l'autre parce que ggplot dimensionne le panneau *après* avoir
retranché la colonne des étiquettes : plus l'étiquette est longue, plus l'axe part à
droite. Le régler étiquette par étiquette est sans fin.

Fixer la géométrie du panneau à la place, en millimètres, pour chaque format de cadre de
la maquette (`ggh4x::force_panelsizes()` ou `egg::set_panel_size()`). L'axe démarre alors
au même x sur toutes les figures d'un même format, et la colonne d'étiquettes prend le
reste. Corollaire : arrêter d'abord la liste des formats de cadre avec la maquette.

Titre, champ et note de lecture restent dans la maquette InDesign, jamais dans le SVG :
autant de texte en moins à aligner, et le gabarit les pose déjà.

## Statut

Le likert vert-rouge d'origine était indiscernable en deutéranopie (dE 6.9-7.2 entre pôles) ;
les pôles NSP (canard/coquelicot) passent l'audit. Non testé sous R sur ce poste (R absent) :
la première exécution se fait avec Maëlle.
