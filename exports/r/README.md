# Kit de thémisation R : enquête Hiérarchie et management

Habillage NSP pour la chaîne d'analyse `analyse_enquete_hm` (Maëlle Fontaine), en surcouche :
aucun fichier du repo d'analyse n'est modifié.

## Contenu

- `theme_nsp_couleurs.R` : **généré** par `node scripts/gen-theme-r.mjs [scenario]` depuis la
  source unique du spectre (`notebooks/lib/scenarios.js`). Familles 19 paliers, séquentielle
  `nsp_seq(n)`, correspondance vers les 19 constantes de `utils_rapports.R`. L'en-tête embarque
  l'audit daltonisme des archétypes de palettes (deutan, protan, tritan) : zéro conflit.
- `theme_nsp.R` : écrit à la main. `theme_nsp()` (ggplot), échelles pour nouveaux graphiques,
  et `appliquer_theme_nsp()` qui redéfinit les constantes, masque les rampes Brewer et
  ré-évalue le bloc palettes de `utils_rapports.R` tel quel (drop-in, ses ~90 `pal_M*` suivent).

## Intégration (3 lignes, à tester sur les fausses données)

```r
source("utils_rapports.R")          # inchangé
source("theme_nsp_couleurs.R")
source("theme_nsp.R")
appliquer_theme_nsp("utils_rapports.R")

# test sans microdonnées :
data <- readRDS("data/fausses_donnees.rds")
trace_graph_total(data, "M1_D_general")
```

Retour arrière : re-sourcer `utils_rapports.R`, rien d'autre.

## Statut

Le spectre est un **draft en cours d'arbitrage** (scénario par défaut : `median-v01`).
Après arbitrage : régénérer `theme_nsp_couleurs.R` avec le scénario retenu, c'est tout.
Point important corrigé au passage : le likert vert-rouge d'origine était indiscernable en
deutéranopie (dE 6.9-7.2 entre pôles) ; les pôles NSP (canard/coquelicot) passent l'audit.
Non testé sous R sur ce poste (R absent) : la première exécution se fait avec Maëlle.
