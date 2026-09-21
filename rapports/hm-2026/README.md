# Rapport « Travailler dans le service public » (enquête Hiérarchie et management, 2026)

Production d'un rapport InDesign de 124 pages à partir du système de couleurs du dépôt. Le texte du rapport et les données de l'enquête ne sont pas ici.

- `graphiques/` : les 91 graphiques régénérés en D3, à la largeur exacte de leur bloc InDesign. Catalogue, règles de disposition et chaîne complète dans son README.
- `annexes/` : les 12 graphiques des annexes, régénérés par `generer-tout.sh`.
- `couverture/` : la couverture et les intercalaires générés, résultat retenu dans `sortie/`.
- `indesign/` : les scripts du panneau Scripts d'InDesign (nuances du spectre, liens, calage des blocs de texte et des modules de graphiques, inventaire des objets). Mode d'emploi dans `LISEZMOI.md`.
- `outils/` : recoloration et diagnostic des couleurs d'un dossier de SVG, préparation du passage d'un document d'une génération du spectre à la suivante.

`indesign/spectre-origine.csv` est le spectre que portaient les premiers graphiques du rapport. Les outils s'en servent pour reconnaître une couleur d'ancienne génération.

Le panneau Scripts d'InDesign lit ce dossier par un lien symbolique nommé « Passe couleur NSP », placé dans le dossier `Scripts Panel` des préférences d'InDesign et pointant vers `rapports/hm-2026/indesign`.

Un graphique régénéré est recoloré avec `outils/svg-recolore.py` et `indesign/svg-recolore.txt` avant d'être copié dans le dossier `Links` du document ; `outils/diagnostic-svg.py` confirme le résultat. Dans InDesign, chaque script de calage se lance en simulation, puis en application.
