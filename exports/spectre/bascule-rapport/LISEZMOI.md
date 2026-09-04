# Bascule du rapport « Hiérarchie et management » vers le spectre courant

Ce dossier se régénère avec `python3 scripts/bascule-rapport.py <rapport.idml> <dossier Links>` (et `--cmjn` pour la version CMJN du script InDesign).
Il sert une fois la passe manuelle sur les graphiques terminée, sur le dossier InDesign figé de cette passe.

## Ce que contient le kit

- `svg-recolore.txt` : les couleurs des SVG liés qui changent entre la règle d'origine du spectre et la règle courante, au format `ANCIENNE:NOUVELLE` attendu par `scripts/svg-recolore.py`.
- `nuances-indesign-rvb.jsx` : script InDesign qui met à jour les nuances nommées du document avec les valeurs RVB du spectre courant.
- `nuances-indesign-cmjn.jsx` : le même script avec les séparations CMJN Coated FOGRA39 (`exports/spectre/epreuve-cmjn.csv`).
- `inventaire.md` : ce que les scripts vont toucher, et ce qu'ils laissent (couleurs hors spectre).

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

L'épreuve écran (`exports/spectre/epreuve-cmjn.html`) montre que seule la lavande de 200 à 500 sort du gamut presse ; le reste du spectre passe avec des écarts imperceptibles.
