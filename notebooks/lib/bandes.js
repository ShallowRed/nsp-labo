// Rendus Plot partagés par les notebooks : bandes de couleurs discrètes.
import { Plot } from "./deps.js";

// Bande de couleurs sans axes (une gamme, une recette).
export const bande = (hexes, { h = 24, cellW = 34, rx = 3 } = {}) =>
  Plot.plot({
    width: cellW * hexes.length + 8,
    height: h + 8,
    margin: 4,
    x: { axis: null },
    color: { type: "identity" },
    marks: [Plot.cellX(hexes, { rx, inset: 1 })],
  });

// Bande nommée : chaque couleur a son étiquette en abscisse.
export const bandeNommee = (items, { h = 44, cellW = 84, fond, encre } = {}) =>
  Plot.plot({
    width: cellW * items.length + 20,
    height: h + 34,
    marginBottom: 26,
    ...(fond ? { style: { background: fond, color: encre ?? "#aab" } } : {}),
    x: { label: null, domain: items.map((d) => d.nom) },
    color: { type: "identity" },
    marks: [Plot.cell(items, { x: "nom", fill: "hex", rx: 4, inset: 2 })],
  });
