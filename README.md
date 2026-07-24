# La gamme de couleurs NSP

Article interactif (Observable Notebook Kit) présentant la gamme de couleurs du collectif
Nos Services Publics : nuancier, sous-ensembles par identité, échelles de graphiques avec
leurs garanties mesurées (contraste, daltonisme), cartographies, exemples tirés de l'enquête
Hiérarchie et management.

Cette branche (`gamme-couleurs`) ne contient que ce sujet ; le reste du labo vit sur `main`.

## Lancer en local

```bash
npm install
npm run preview   # vite, port 5173
npm run build     # site statique dans notebooks/.observable/dist
```

## Publication

Chaque push sur la branche `gamme-couleurs` déclenche le workflow GitHub Pages
(`.github/workflows/pages.yml`) : build du notebook puis déploiement. Pré-requis côté
repo GitHub : Settings > Pages > Source = « GitHub Actions ».

## Structure

```
notebooks/
├── index.html          # l'article (une seule page, servie à la racine)
├── lib/                # générateur du spectre, scénario acté, rendus partagés, données de correspondance
└── data/               # TopoJSON départements, captures d'illustration
```

Tout est calculé (culori : OKLCH, contrastes WCAG, CIEDE2000 ; daltonisme par matrices de
Viénot), rien n'est estimé à l'œil. Le spectre lui-même se règle dans `notebooks/lib/scenarios.js`.
