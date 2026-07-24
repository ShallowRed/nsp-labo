# Spectre NSP : nuancier à importer

Deux fichiers, générés depuis la source unique du spectre (`node scripts/gen-ase.mjs`) :

- **`spectre-nsp.ase`** : le nuancier pour InDesign ou Illustrator.
  Import : panneau **Nuancier > menu du panneau > Charger un nuancier...** et choisir le
  fichier. Les couleurs arrivent groupées et nommées, en couleurs globales (modifier une
  couleur du nuancier met à jour tout ce qui l'utilise).
- **`spectre-nsp.csv`** : la référence complète (152 valeurs hex), pour tout autre outil.

## Ce que contient le nuancier

- **8 groupes « spectre · famille »** : les 11 paliers nommés de chaque famille, du plus
  clair (50) au plus foncé (950). C'est le vocabulaire de référence : « coquelicot 500 »,
  « petrole 700 »... Le CSV contient en plus les crans intermédiaires (150, 250...),
  utiles ponctuellement, signalés par la colonne « palier nomme ».
- **7 groupes « graphiques · ... »** : les recettes prêtes à l'emploi pour les figures,
  nommées par modalité (mal, plutôt mal... ; jamais, parfois... ; catégorie 1 à 6 ;
  ne sait pas). Ce sont exactement les mêmes valeurs que le kit R de la chaîne
  d'analyse : un graphique R et une figure InDesign qui suivent ces groupes sont
  identiques au pixel de couleur près.

Deux points d'attention issus des mesures d'accessibilité :

- jamais un rouge contre un vert dans une même figure (illisible en daltonisme) :
  le pôle négatif est le coquelicot, le positif le canard ;
- le pivot d'une échelle à 5 réponses est le gris clair (« ça dépend »), pas un
  jaune-orangé, qui se confond avec le pôle chaud en daltonisme.

L'article de référence (nuancier interactif, échelles, simulation du daltonisme) :
https://shallowred.github.io/nsp-labo/
