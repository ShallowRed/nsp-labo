# Passe couleur du rapport « Hiérarchie et management », dossier V6.1

Relevé du 2026-09-12 sur `Dossier A4-H&M V6.1 (avecSynthèse/Links`, 103 SVG liés.

## 1. État des lieux mesuré

| Constat | Fichiers concernés |
|---|---|
| Axes et labels en `#096286`, pétrole 600 | 88 |
| Axes et labels en `#323786`, teinte absente du spectre sous les deux règles | 18 |
| Au moins une couleur du spectre à basculer vers la règle courante | 90 |
| Palette ggplot par défaut, 16 teintes | 12 annexes A1 à C4 |
| Texte en Arial | 12 annexes, plus `G79_bien_etre_travail_3dim_vision_desaccord.svg` |

Deux chaînes d'export coexistent : 41 fichiers sortent d'Illustrator avec un bloc `<style>` et des classes `.stN`, 62 sortent directement de R avec des styles en ligne. Un remplacement de couleur doit couvrir les deux écritures, y compris les valeurs entre apostrophes.

`G45_outils_pilotage_statut_large_barre.svg` porte ses axes en `#323786` et non en `#096286` : c'est le seul fichier dans ce cas.

## 2. Les décisions

Elles conditionnent le reste et se prennent avant toute modification, pour que les 103 fichiers ne soient recolorés qu'une fois. A et D sont tranchées, B et C restent ouvertes.

### Décision A — couleur des axes et des labels : tranchée le 2026-09-12

Les titres et les intitulés d'axe gardent le pétrole, les graduations, les valeurs et les traits d'axe passent en ardoise 700.

| Élément | Couleur | Valeur |
|---|---|---|
| Titre de graphique, intitulé d'axe, titre de légende | pétrole 700 | `#0B4862` |
| Graduations, valeurs, traits d'axe, entrées de légende | ardoise 700 | `#3B4348` |

Le pétrole 700 est retenu plutôt que le 600 d'origine parce que les styles InDesign des graphiques l'utilisent déjà.

Le script `scripts/svg-axes-hybride.py` applique la règle sur les deux chaînes d'export. Il distingue les titres des labels par la graisse : Poppins-Bold reçoit le pétrole, le reste l'ardoise. Dans les fichiers Illustrator, une même règle CSS porte souvent la couleur pour des classes grasses et maigres, le script applique donc l'ardoise partout puis rend leur teinte aux titres par une règle finale.

### Décision D — couleur du texte courant dans InDesign

Le texte courant n'est pas en noir pur : il utilise la nuance `Gris texte`, un noir riche en CMJN (68,6 / 61,2 / 58 / 70), dans un document par ailleurs en RVB. Cinq styles la portent.

| Style | Rôle |
|---|---|
| `Contenu chapitre:Texte:Corps SM` | texte courant |
| `Contenu chapitre:Texte:Note de bas de page` | notes |
| `Contenu chapitre:Encadré:Texte courant` | encadrés |
| `Contenu chapitre:Graphiques:Champ/Note de lecture` | champ et note de lecture |
| `Meta - Document:Gabarit:Numéro de page` | folios |

La nuance `ardoise 700` existe déjà dans le document. Deux façons de procéder : réaffecter ces cinq styles à `ardoise 700`, ou redéfinir la valeur de `Gris texte`. La réaffectation est préférable, elle laisse le nom des nuances cohérent avec leur valeur.

À vérifier à l'impression : `#3B4348` est plus clair qu'un noir riche, le texte lira gris sur papier couché.

### Décision B — palette des graphiques G : sans objet

Vérification faite, les teintes framboise, lavande et prairie de ces graphiques viennent bien du spectre : `#EA85C0` est la framboise 300 de la règle d'origine, `#7FBF71` la prairie 300, `#554C9F` la lavande 600, inchangée entre les deux règles. La bascule standard les traite, il n'y a pas de décision à prendre.

Deux teintes de la règle d'origine manquent au fichier de correspondance parce qu'elles n'étaient pas présentes dans le dossier V5 : à vérifier avant la passe.

### Décision C — les annexes A1 à C4, seuls graphiques multivariés

Ce sont des graphiques en forêt : une cote relative et son intervalle de confiance à 95 % par modalité. La couleur y varie par bloc de variable sans porter d'information, et le texte est en Arial.

Une seule teinte suffit. Le remplissage du point, plein ou creux selon que l'intervalle franchit 1, porte la significativité : cette distinction doit être conservée, et elle se lit mieux une fois les cinquante teintes retirées.

Proposition : points en pétrole 500 `#1C7EA9`, axes et labels en ardoise 700 comme partout ailleurs, bandes de fond inchangées, police Poppins.

Réserve : Poppins est plus large qu'Arial, les intitulés longs de la colonne de gauche débordent sur la colonne des modalités. Soit les annexes sont régénérées depuis R avec la police et la couleur voulues, soit les débordements se reprennent à la main fichier par fichier.

## 2 bis. Le texte des graphiques vit à deux endroits

Une partie des textes de graphiques est composée dans InDesign et non dans les SVG : les styles `Contenu chapitre:Graphiques:Titre du graphique`, `Etiquette graduations`, `Etiquette mineur`, `Etiquette majeur` et `Légende couleur` existent et portent tous le pétrole 700.

La décision A s'applique donc aussi à ces styles : `Titre du graphique` garde le pétrole 700, les quatre autres passent en ardoise 700.

## 3. Séquence

| Étape | Contenu | Durée | Dépend de |
|---|---|---|---|
| 0 | Copier le dossier V6.1, ne travailler que sur la copie | 2 min | — |
| 1 | Produire trois échantillons pour la décision A, sur un graphique à barres chaudes, un à barres froides et un multivarié | 30 min | — |
| 2 | Prendre les décisions A, B et C | — | étape 1 |
| 3 | Passe unique de recolorage des SVG : couleurs du spectre, couleur d'axe, palette multivariée | 15 min | étape 2 |
| 4 | Exécuter `nuances-indesign-rvb.jsx`, qui réaligne aussi les nuances de recette périmées | 10 min | étape 3 |
| 5 | Corriger la police de `G79`, et des annexes si la décision C le demande | 15 min | étape 2 |
| 6 | Mettre à jour les liens dans InDesign et relire le PDF, pages où pastilles et graphiques se côtoient en priorité | 1 h | étapes 3 à 5 |
| 7 | Séparations CMJN avec `nuances-indesign-cmjn.jsx`, si l'imprimeur les veut figées | 20 min | étape 6 |

L'étape 3 est une passe unique et non trois passes successives : le fichier de correspondance se construit à partir des trois décisions, puis `scripts/svg-recolore.py` s'exécute une fois avec sauvegarde.

## 4. Ce que le kit existant couvre déjà

`svg-recolore.txt` porte les 8 couleurs du spectre qui changent entre la règle d'origine et la règle courante. Il ne couvre ni la couleur d'axe, ni la palette indigo et violet, ni les annexes : ces trois blocs sont à ajouter au fichier de correspondance après les décisions.
