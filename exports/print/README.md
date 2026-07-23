# POC chaîne print : Google Doc vers Markdown vers ICML

POC du workflow W2 de la note Pawn `workflow-enquete-mise-en-forme.md` : le doc de rédaction
exporté en Markdown natif, passé en finition scriptée, converti en ICML importable dans la
maquette InDesign. Réalisé le 2026-07-18 sur le doc réel du rapport enquête.

## Chaîne (reproductible)

```bash
curl -sL "https://docs.google.com/document/d/<id>/export?format=markdown" -o rapport.md
node scripts/finition-md.mjs rapport.md exports/print/rapport-lineaire-finition.md
awk '/^# Module 1 /{flag=1} /^# Module 2 /{flag=0} flag' \
  exports/print/rapport-lineaire-finition.md > exports/print/module-1-finition.md
pandoc -s -f markdown -t icml exports/print/module-1-finition.md -o exports/print/module-1.icml
```

## Contenu

- `rapport-lineaire-finition.md` : le doc complet après finition (735 insécables posées,
  guillemets normalisés, TdM et titres vides purgés, 81 figures balisées en emplacements
  de manifeste, définitions base64 retirées).
- `module-1-finition.md` / `module-1.icml` : le chapitre POC, à glisser dans InDesign
  (Fichier, Importer) pour tester le mapping de styles sur la maquette.
- `rapport-complet.icml` : conversion du doc entier (contrôle de robustesse, XML valide).

## Verdicts du POC

- L'export Markdown natif marche et **la structure du doc encode déjà la sémantique** :
  H1 module, H2 section, H3 message, H4 titre de figure. L'ICML sort des styles nommés
  (Header1-4, Paragraph) : le mapping vers la maquette se règle une fois.
- Les 2 notes de fin deviennent de vraies notes InDesign ; XML valide sur 122 Ko de texte.
- **Piège majeur trouvé** : les suggestions non tranchées du doc sont fusionnées dans
  l'export (« nous assumonsil est assumé », faux liens auto sur mots coupés). Le gel du
  texte doit inclure « accepter ou refuser toutes les suggestions », le script les signale.
- Deux conventions à poser avec la rédaction : les encadrés sont aujourd'hui des tableaux
  1 cellule (structure aplatie : adopter un style d'encadré), les figures côte à côte des
  tableaux 2 colonnes (les déclarer séquentielles, la maquette gère la mise côte à côte).

## Pendant web (POC W4, même pivot)

`node scripts/build-web.mjs` génère `exports/web/` depuis le même Markdown finalisé :
sommaire + 9 pages chapitrées, notes de fin rattachées à leur chapitre, habillage aux
couleurs du spectre (scénario médian, draft), figure 01 branchée en vrai SVG Plot via
le manifeste, les autres en emplacements stylés. Prévisualisation : serveur statique
sur `exports/web/` (config `enquete-web-poc` du launch.json de garden, port 18796).

Confidentialité : le texte du rapport n'est pas publié ; `exports/print/*` (sauf ce
README) et `exports/web/` sont gitignorés, tout se régénère depuis le gdoc.

## Reste hors POC

L'import InDesign lui-même (poste InDesign requis) : ouvrir la maquette, importer
`module-1.icml`, mapper les styles Header1-4 sur les styles maison, vérifier les notes.
