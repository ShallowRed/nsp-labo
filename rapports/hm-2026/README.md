# Rapport « Travailler dans le service public » (enquête Hiérarchie et management, 2026)

Production d'un rapport InDesign de 124 pages à partir du système de couleurs du dépôt. Le texte du rapport et les données de l'enquête ne sont pas ici.

## Contenu

| Dossier | Rôle |
|---|---|
| `graphiques/` | Les 91 graphiques du rapport régénérés en D3, à la largeur exacte de leur bloc InDesign. Catalogue déclaratif, règles de disposition et chaîne complète dans son README. |
| `annexes/` | Les 12 graphiques des annexes (forest plots), gabarit 350 × 630 pt. `generer-tout.sh` les régénère. |
| `couverture/` | Couverture et intercalaires générés (`generer.mjs`, `intercalaires.mjs`), résultat retenu dans `sortie/`. Les pistes non retenues se régénèrent au lancement et sont ignorées par git. |
| `indesign/` | Scripts du panneau Scripts d'InDesign (dossier « Passe couleur NSP ») : nuances du spectre, liens, calage des blocs de texte et des modules de graphiques, inventaire des objets. Mode d'emploi dans `LISEZMOI.md`. |
| `indesign-archives/` | Scripts à usage unique déjà appliqués et scripts non retenus, gardés hors du panneau. |
| `outils/` | `bascule-rapport.py` (prépare le passage d'un document d'une génération du spectre à la suivante), `svg-recolore.py` (substitution de couleurs dans un dossier de SVG), `diagnostic-svg.py` (dit quelles couleurs porte un dossier de SVG). |

`indesign/spectre-origine.csv` est le spectre tel que le portaient les premiers graphiques du rapport. Les outils s'en servent pour reconnaître une couleur d'ancienne génération.

## Lier le dossier des scripts à InDesign

```bash
ln -sfn ~/Projects/nsp-labo/rapports/hm-2026/indesign "$HOME/Library/Preferences/Adobe InDesign/Version 21.0/fr_FR/Scripts/Scripts Panel/Passe couleur NSP"
```

## Ordre des opérations sur un document

1. Régénérer les graphiques (`graphiques/`), les recolorer avec `outils/svg-recolore.py` et `indesign/svg-recolore.txt`, les copier dans le dossier `Links` du document, vérifier avec `outils/diagnostic-svg.py`.
2. Dans InDesign : `relier-graphiques.jsx`, puis `nuances-indesign-rvb.jsx`.
3. Calage sur la grille : `caler-blocs-texte.jsx`, `empiler-modules-graphiques.jsx`, `caler-modules-precision-laterale.jsx`, chacun en simulation puis en application.
4. Export, puis contrôle du PDF avec `graphiques/mesurer-pdf.py`.
