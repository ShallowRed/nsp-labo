# Bascule du rapport « Hiérarchie et management » vers le spectre courant

Ce dossier se régénère avec `python3 scripts/bascule-rapport.py <rapport.idml> <dossier Links>` (et `--cmjn` pour la version CMJN du script InDesign).
Il sert une fois la passe manuelle sur les graphiques terminée, sur le dossier InDesign figé de cette passe.

## Ce que contient le kit

- `svg-recolore.txt` : les couleurs des SVG liés qui changent entre la règle d'origine du spectre (celle que portent les graphiques du rapport) et la règle courante, au format `ANCIENNE:NOUVELLE` attendu par `scripts/svg-recolore.py`.
  Depuis la restauration de la branche claire du 18 septembre 2026, il ne reste que deux paires : canard 550 `#007B7C` → `#007777` et pétrole 100 `#C6EDFF` → `#CAECFF`. Les six autres couleurs que le kit remplaçait auparavant sont revenues à leur valeur d'origine et ne sont plus à toucher — ambre 200 `#F6BB81` en particulier, la couleur du « plutôt mal ».
- `nuances-indesign-rvb.jsx` : script InDesign qui met à jour les nuances nommées du document avec les valeurs RVB du spectre courant.
- `nuances-indesign-cmjn.jsx` : le même script avec les séparations CMJN Coated FOGRA39 (`exports/spectre/epreuve-cmjn.csv`), refaites le 19 septembre 2026 sur les valeurs de la branche claire restaurée.
- `inventaire.md` : ce que les scripts vont toucher, et ce qu'ils laissent (couleurs hors spectre).

Le kit a été remis à jour le 19 septembre 2026 sur les valeurs de la branche claire restaurée, en reprenant l'inventaire figé des 100 SVG liés plutôt qu'en relisant le dossier Links. Il décrit donc le rapport tel qu'il était au moment de la passe manuelle : si les graphiques ont bougé depuis, relancer `bascule-rapport.py` sur le dossier InDesign à jour.

Les deux scripts InDesign réalignent aussi les nuances de recette (« bien », « plutôt mal », « ne sait pas »…) sur la palette actée le 24 juillet et les renomment.
Dans le document V5, ces nuances portaient encore une palette antérieure (« bien · canard 600 », « plutôt bien · canard 450 », « ne sait pas · ardoise 150 ») alors que les graphiques utilisent la palette actée : c'est l'origine des écarts entre les pastilles de la maquette et les graphiques.

## Procédure

1. Figer le dossier InDesign après la passe manuelle, en faire une copie, ne travailler que sur la copie.
2. Recolorer les SVG liés : `python3 scripts/svg-recolore.py <Links> $(cat exports/spectre/bascule-rapport/svg-recolore.txt) --sauvegarde <Links_sauvegarde>`.
   Les gris de thème (grille, axes) et les palettes ggplot par défaut des annexes ne bougent pas, ils ne suivent aucun palier.
3. Dans InDesign, Fenêtre > Utilitaires > Scripts, glisser `nuances-indesign-rvb.jsx` dans le panneau et l'exécuter : toutes les nuances nommées du spectre prennent leur nouvelle valeur, les nuances de recette sont réalignées et renommées. Le script indique les nuances introuvables.
4. Mettre à jour les liens (panneau Liens) pour que les SVG recolorés se rechargent.
5. Contrôler à l'écran les pages où pastilles et graphiques se côtoient : elles doivent avoir la même couleur.

## Pour l'impression

Le document reste en RVB jusqu'à l'export ; InDesign convertit à l'export PDF avec le profil de sortie choisi (Coated FOGRA39 pour un imprimeur européen sur papier couché).
Deux options, à trancher avec l'imprimeur :

- laisser la conversion à l'export (les séparations obtenues sont celles de `epreuve-cmjn.csv`, calculées avec le même profil et la même intention que l'export par défaut) ;
- passer les nuances en CMJN dans le document avec `nuances-indesign-cmjn.jsx`, pour figer les séparations et les voir dans le panneau Nuances. Les SVG liés restent en RVB et sont convertis à l'export.

L'épreuve écran (`exports/spectre/epreuve-cmjn.html`) situe les écarts de la presse. La lavande reste la famille la plus touchée, de 150 à 500, jusqu'à ΔE 9,3 sur la lavande 300. Depuis la restauration de la branche claire, les pâles les plus saturées ne tiennent plus non plus dans le gamut presse : canard 50 à 200 passent au-dessus de ΔE 5, et des pâles de prairie, framboise et coquelicot au-dessus de 2 — 35 couleurs sur 152 au-dessus de 2, contre 23 avant, aucune sortante.

Cet écart mesure la distance entre ce qu'on demande et ce que la presse rend, pas une perte par rapport au rapport imprimé jusqu'ici : le papier reçoit bien le gain, les pâles du canard s'impriment plus saturées qu'avant (canard 100 imprimé `#CFE9E9` devient `#BFE3E7`), et 22 couleurs sur 152 bougent à l'impression de plus de ΔE 2. Les garanties tiennent sur le papier comme à l'écran : l'écart de clarté imprimée à palier égal reste à 7,0 L* et les deux pôles s'impriment à l'identique (`#0F7876` et `#C34146`).
