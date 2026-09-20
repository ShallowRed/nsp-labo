# Bascule du rapport « Hiérarchie et management » vers le spectre courant

Ce dossier se régénère avec `python3 rapports/hm-2026/outils/bascule-rapport.py <rapport.idml> <dossier Links>` (et `--cmjn` pour la version CMJN du script InDesign).
Il sert une fois la passe manuelle sur les graphiques terminée, sur le dossier InDesign figé de cette passe.

## Ce que contient le kit

- `svg-recolore.txt` : les couleurs des SVG liés qui changent entre la règle d'origine du spectre (celle que portent les graphiques du rapport) et la règle courante, au format `ANCIENNE:NOUVELLE` attendu par `../outils/svg-recolore.py`.
  Les SVG du rapport peuvent porter deux générations de couleurs, et le fichier couvre les deux. Depuis la restauration de la branche claire du 18 septembre 2026, un SVG resté à la règle d'origine n'a que deux couleurs à changer, canard 550 `#007B7C` → `#007777` et pétrole 100 `#C6EDFF` → `#CAECFF` : les six autres que le kit remplaçait auparavant sont revenues à leur valeur d'origine et ne sont plus à toucher, ambre 200 `#F6BB81` en particulier, la couleur du « plutôt mal ». Un SVG déjà recoloré avec le kit d'avant la décision porte en revanche les valeurs du 4 septembre, et ce sont les sept paires suivantes qui le ramènent : `#EBBF95` → `#F6BB81`, `#32C2C2` → `#2DC2C2`, `#DF6263` → `#E45C5F`, `#E08DBC` → `#EA85C0`, `#DE9B58` → `#E29A4E`, `#83BE76` → `#7FBF71`, `#D1EBF9` → `#CAECFF`.
  Les neuf paires s'appliquent ensemble sans risque : aucune valeur source n'est la cible d'une autre paire, et aucune n'est portée par un autre palier du spectre. **`bascule-rapport.py` ne produit que les deux premières**, puisqu'il compare à la règle d'origine ; les sept autres sont à remettre après une régénération du kit.
- `nuances-indesign-rvb.jsx` : script InDesign qui met à jour les nuances nommées du document avec les valeurs RVB du spectre courant.
- `nuances-indesign-cmjn.jsx` : le même script avec les séparations CMJN Coated FOGRA39 (`exports/spectre/epreuve-cmjn.csv`), refaites le 19 septembre 2026 sur les valeurs de la branche claire restaurée.
- `inventaire.md` : ce que les scripts vont toucher, et ce qu'ils laissent (couleurs hors spectre).
- `../indesign-archives/calques-fonds-graphiques-textes.jsx` (appliqué le 19 septembre 2026) : range les objets des pages et des gabarits sur trois calques, « Textes » devant, « Graphiques » au milieu, « Fonds » derrière, en conservant l'ordre d'empilement à l'intérieur de chaque calque. Simulation puis application, rapport écrit à côté du document. Un groupe va tout entier sur un calque ; les objets verrouillés et les objets ancrés dans un texte restent en place.
- `inventaire-objets.jsx` : inventaire en lecture seule des objets des pages (bornes, calque, style d'objet, fond, débordement, fichier lié et échelle), écrit dans `inventaire-objets.tsv` à côté du document. Sert à mesurer le document avant d'écrire ou de régler un script de mise en page.
- `empiler-modules-graphiques.jsx` : met au carré les modules de graphiques (titre, graphique à 100 %, précision, fond) sur la grille de lignes de base : hauteur des blocs de texte selon leur contenu, empilement sans jour, fond à la forme des trois blocs. Ne traite que les modules complets dont la nouvelle hauteur tient avant l'objet suivant ; liste les autres avec la place qui manque. La simulation applique, mesure, puis annule.
- `caler-modules-precision-laterale.jsx` : même principe que le précédent pour les seuls modules dont la précision est posée à côté du graphique (modèle des pages 51 et 55) : titre sur toute la largeur, bloc du graphique jusqu'au bord de colonne qui précède la précision, graphique et précision sur la même étendue verticale, image centrée à 100 %, fond à la forme de l'ensemble. Ne touche à aucun module dont la précision est sous le graphique. Simulation (applique, mesure, annule) puis application, rapport `rapport-modules-lateraux-*.txt` à côté du document.
- `caler-blocs-texte.jsx` : cale les bords des blocs de texte sur les marges, les colonnes et les repères de la page et de son gabarit, dans une tolérance demandée au lancement. Les bords gauche et droit ne bougent que si les deux sont sur la grille ou dans la tolérance ; un bloc que le calage ferait déborder est laissé en place. Simulation puis application, rapport écrit à côté du document avec les repères lus et la liste des blocs concernés.
- `../indesign-archives/correctifs-v11-1.jsx` (appliqué le 19 septembre 2026) : correctifs de texte de la relecture de la V11 (typographie, traits d'union des titres de graphiques, formes inclusives, points finaux des lignes « Champ », métadonnées du PDF). Il propose une simulation puis une application, écrit un rapport à côté du document et saute toute règle dont le nombre d'occurrences diffère de celui compté sur l'IDML du 15 septembre 2026.

Le kit a été remis à jour le 19 septembre 2026 sur les valeurs de la branche claire restaurée, en reprenant l'inventaire figé des 100 SVG liés plutôt qu'en relisant le dossier Links. Il décrit donc le rapport tel qu'il était au moment de la passe manuelle : si les graphiques ont bougé depuis, relancer `bascule-rapport.py` sur le dossier InDesign à jour.

Les deux scripts InDesign réalignent aussi les nuances de recette (« bien », « plutôt mal », « ne sait pas »…) sur la palette actée le 24 juillet et les renomment.
Dans le document V5, ces nuances portaient encore une palette antérieure (« bien · canard 600 », « plutôt bien · canard 450 », « ne sait pas · ardoise 150 ») alors que les graphiques utilisent la palette actée : c'est l'origine des écarts entre les pastilles de la maquette et les graphiques.

## Procédure

1. Figer le dossier InDesign après la passe manuelle, en faire une copie, ne travailler que sur la copie.
2. Recolorer les SVG liés : `python3 rapports/hm-2026/outils/svg-recolore.py <Links> $(cat rapports/hm-2026/indesign/svg-recolore.txt) --sauvegarde <Links_sauvegarde>`.
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

Les scripts à usage unique déjà appliqués et ceux qui n'ont pas été retenus sont dans `../indesign-archives/`, hors du panneau Scripts d'InDesign.
