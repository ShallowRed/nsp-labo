// Dépendances des notebooks, résolues localement depuis node_modules par vite.
// Ne pas importer via "npm:..." dans les cellules : Notebook Kit compile ces
// spécificateurs en imports CDN (jsDelivr) à l'exécution, ce qui casse hors
// ligne et derrière les navigateurs qui filtrent les origines.
export * as Plot from "@observablehq/plot";
export { html } from "htl";
export { formatHex, clampChroma, converter } from "culori";
