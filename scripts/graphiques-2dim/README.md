# Graphiques du rapport « Travailler dans le service public » en D3

Régénération des 91 graphiques du rapport InDesign à partir des CSV de R ou des données reconstituées depuis les anciens SVG. Chaque SVG a exactement la largeur de son bloc InDesign, en points, et se pose à 100 % sans redimensionnement. Les titres et les précisions (« Champ », « Note de lecture ») restent dans InDesign.

## Fichiers

| Fichier | Rôle |
|---|---|
| `catalogue.mjs` | Barres empilées : par graphique, le fichier de `Links` à remplacer, la largeur du bloc, le jeu de réponses et de couleurs (`JEUX`), les groupes de modalités avec leur intitulé et, si l'ancien graphique en avait un, leur libellé d'axe (`axe`). Options : `colonne` (largeur de la colonne de libellés), `barre` (hauteur de barre), `aligner: false`. |
| `catalogue-formes.mjs` | Barres groupées (G9, G17, G30, G45, G46, G66), colonnes empilées (G78) et aires empilées (G40), avec `legende` pour le titre de légende. |
| `disposition.mjs` | Règles communes : chasse réelle des glyphes Poppins, retour à la ligne, colonne de libellés partagée par page, bornes du tracé. |
| `generer.mjs`, `generer-formes.mjs` | Générateurs. `node generer.mjs [G1 G2 …]` écrit `sortie/<id>.svg` ; sans argument, tout le catalogue. |
| `poppins-largeurs.json` | Chasse des glyphes Poppins Regular et Bold, extraite des fontes incorporées au PDF du rapport. |
| `blocs.json` | Page et dimensions du bloc de chaque graphique, relevées dans l'IDML de la V9. À refaire si les blocs changent de page. |
| `extraire-svg.py`, `extraire-groupes.py` | Reconstitution des données depuis un ancien SVG (largeur des rectangles, étiquettes, légende) quand le CSV manque. Résultats dans `donnees-extraites/`. |
| `comparer.py`, `fonts.conf` | Planche PDF ancien / remplaçant à la même largeur. |
| `mesurer-pdf.py` | Mesure dans un PDF exporté, pour chaque graphique, l'axe, la fin du tracé et les marges gauche et droite dans son fond bleu. Sert à vérifier un export. |

Données de R : `~/Downloads/Donnees_graphiques`, un CSV par groupe (`G12_1.csv`…), séparateur `;`, `v1` réponse, `v2` modalité, `pct` à virgule décimale, valeurs entre guillemets pouvant contenir des `;` et des retours à la ligne. Les données reconstituées (`donnees-extraites/`) ont la couleur du segment en `v1`, traduite par le jeu de couleurs du graphique. Les données de G40 viennent de `Donnees_graphiques/donnees_G40.xlsx`, converties dans `donnees-extraites/G40_aires.csv`.

## Règles de disposition

- Réserve de 24 pt de chaque côté du SVG, parce que le bloc InDesign sert aussi de fond de page.
- Colonne de libellés la plus étroite qui laisse chaque libellé sur deux lignes au plus (trois pour les barres groupées, davantage pour les barres hautes), avec un plafond de 72 pt (96 pt pour les barres groupées). L'espace à droite des barres reproduit l'espace pris à gauche par les libellés, pour que le tracé soit centré dans le bloc ; les graphiques à colonne explicite et les barres groupées gardent toute la largeur.
- Les graphiques d'une même page, de même forme (barres empilées entre elles, barres groupées entre elles) et de même largeur de bloc (à 8 pt près) partagent la colonne la plus large, pour que leurs axes coïncident. Un graphique avec `colonne` explicite ou `aligner: false` reste indépendant.
- L'intitulé d'un groupe (facette) ne dépasse pas la largeur des barres : il se replie sur la zone de tracé. Les lignes de grille s'interrompent derrière les intitulés et les libellés d'axe qu'elles traverseraient, avec 2,5 pt de blanc autour du texte ; un tronçon de moins de 6 pt entre deux intitulés n'est pas tracé. Le SVG reste transparent, donc le résultat ne dépend pas de la couleur du fond InDesign.
- Les lignes de grille vont de la première barre jusqu'à l'axe, dont elles prolongent les graduations.
- Marges visibles du haut et du bas égales, à hauteur de SVG constante : le contenu est décalé de la moitié de l'écart entre l'espace au-dessus du premier élément dessiné et l'espace sous le dernier (`equilibrer` dans `disposition.mjs`, un groupe `translate` autour du contenu). Les aires (G40) ne sont pas mesurées et restent telles quelles.
- Hauteur de barre uniforme de 13 pt (`barre` pour les exceptions : G64, G67, G80 à 22 ou 40 pt pour des libellés longs).
- Valeurs écrites dans les segments à partir de 4,5 %, en blanc sur les teintes foncées (`blanc` dans le jeu).
- Les couleurs d'un jeu suivent l'ordre de ses réponses. Pour changer l'ordre des segments, choisir un jeu dont les couleurs gardent le sens des réponses : `nonOui2` quand « Non » est la réponse favorable (G32, G36), `ouiNon2` sinon (G67).
- La légende commence sur l'axe vertical. Pour les colonnes empilées, chaque colonne a sa légende en dessous, de haut en bas dans l'ordre de l'empilement.
- Le SVG porte `data-axe-x` et `data-fin-x` (position de l'axe et fin du tracé), lus par les scripts InDesign.

## Chaîne complète

1. `node generer.mjs && node generer-formes.mjs` dans ce dossier.
2. Copier `sortie/<id>.svg` vers `Links/<fichier>` du dossier InDesign (correspondance dans les catalogues), après sauvegarde du dossier `Links`.
   Les catalogues écrivent les couleurs du spectre du 4 septembre 2026, et ces valeurs servent aussi de clé pour lire les données extraites des anciens SVG (`donnees-extraites/`) : les remplacer dans un catalogue fait disparaître des segments. Un SVG régénéré passe donc par `scripts/svg-recolore.py` avec `exports/spectre/bascule-rapport/svg-recolore.txt` avant d'aller dans `Links` ; `scripts/diagnostic-svg.py <dossier>` confirme le résultat.
3. Dans InDesign, panneau Scripts, dossier « Passe couleur NSP » (`exports/spectre/bascule-rapport/`) :
   - `relier-graphiques.jsx` : relie chaque SVG au fichier de même nom dans le `Links` à côté du document, quel que soit le dossier d'origine du lien, puis le recharge. Nécessaire quand des liens pointent encore vers un ancien dossier (V6.2, V8), auquel cas InDesign les déclare à jour.
   - `injecter-graphiques.jsx` : image à 100 %, centrée, bloc ajusté au contenu. Titres et précisions intacts. Le bloc est recentré sur l'ancien centre : un graphique dont la largeur a changé est à recaler à la main. À lancer une fois ; avec une sélection, seuls les blocs sélectionnés sont traités.
   - `../bascule-rapport-archives/composer-graphiques.jsx` (archivé) : variante qui cale aussi le titre (bord gauche sur l'axe) et les précisions (toute la largeur du fond). Non retenue pour la V9, gardée pour référence.
   - `../bascule-rapport-archives/numeroter-graphiques.jsx` (archivé) : pose sur chaque graphique G1 à G91 un numéro automatique (liste « Graphiques », style « Numéro graphique », Poppins SemiBold 7 pt pétrole) dans un petit bloc en haut à droite de la zone du graphique, au-dessus du titre, calé à 24 pt du bord droit du fond. Ordre de lecture : page, puis haut vers bas. Relançable.
   - `../bascule-rapport-archives/corriger-synthese.jsx` (archivé) : remplacements de texte de la synthèse issus du Word du 15 septembre 2026, à usage unique.
   Chaque script écrit un rapport sur le bureau.
4. Exporter le PDF et le vérifier : `python3 mesurer-pdf.py <pdf> 20 95 mesures.json` (marges attendues 24 pt de chaque côté du fond, axes identiques pour les graphiques d'une même page).
5. Planche de comparaison : `python3 comparer.py <dossier des anciens SVG>`.

Les scripts Python utilisent PyMuPDF (`pip install pymupdf`) ; `comparer.py` utilise aussi `rsvg-convert` (`brew install librsvg`) et les fontes Poppins de `../../fonts`.

## Planche de comparaison

`exports/print/graphiques-2dim/comparaison-graphiques.pdf` (15 septembre 2026) : les 90 graphiques, ancien à gauche, remplaçant à droite, à la même largeur.

## Écarts relevés dans les anciens graphiques

Relevés pendant la régénération, en comparant les anciens SVG, les CSV et le PDF de la V9.

- G3 : intitulé « Comment vous-sentez vous au travail ? » ; corrigé en « Comment vous sentez-vous au travail ? ».
- G91 : intitulé « …qu'il seraitde votre devoir… » ; corrigé.
- G85 : le troisième bloc portait le même intitulé que le deuxième (« Transmettre après avoir manifesté votre désaccord ») ; renommé « Transmettre sans manifester de désaccord », à confirmer avec les auteurs.
- G26 : CSV incomplet (ligne « Personnel médical hospitalier » absente) ; données reprises du SVG.
- G29 : un seul CSV pour trois groupes ; données reprises du SVG.
- G12, G13, G14, G15, G16, G18, G47, G79, G80 : sans CSV exploitable ; données reprises des SVG. G9, G17, G30, G45, G46, G66, G78 : idem pour les barres groupées et les colonnes.
- G17 : libellés vectorisés dans l'export, repris de la page 34 du rapport.
- G59 : export d'origine de 108 × 28 pt, posé très agrandi dans le document.
- G12 et G18 : exports de 518 pt de large, débordant du bloc de 471 pt une fois à 100 %.
- G22 : sans intitulé de facette dans l'ancien, conservé tel quel.
- Corps des textes entre 4,1 et 5,4 pt dans les exports R une fois réduits au bloc ; les valeurs sur la deuxième teinte rouge étaient en blanc, règle reprise.
- Apostrophes droites dans 52 SVG Illustrator et libellés « Oui majo » / « Oui mino » dans les 12 annexes ; corrigés sur les fichiers de la V8 (`annexes-foret/generer.mjs`, entrée `CORRECTIONS`).
- Document InDesign : des liens pointaient encore vers `Dossier A4-H&M V6.2 (passe couleur)/Links`, `V8/Links` et `v7/Links`, d'où six graphiques non mis à jour dans les premiers exports du fork ; `relier-graphiques.jsx` corrige.
- Blocs : G4 posé sur 595 pt pour un fond de 471 ; G74 et G75 sur 352 pt pour un fond de 340 ; G90 sur 265 pt dans une colonne de 328. Largeurs harmonisées dans le catalogue (G5 → 328, G43 → 362, G90 → 328, G70 à G77 → 340).

## Points ouverts

- G5 (page 23) mesure 344 pt de haut pour un emplacement de 310 : le bloc « Champ » est à descendre à la main, ou passer `barre: 11`.
- Intitulé du troisième bloc de G85 à confirmer.
