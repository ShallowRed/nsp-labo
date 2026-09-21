// Couleurs des graphiques : un catalogue nomme un palier du spectre (« canard 550 »), et la valeur est lue dans
// exports/spectre/spectre-nsp.csv au moment de la génération.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SPECTRE = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../exports/spectre/spectre-nsp.csv");
const paliers = new Map(fs.readFileSync(SPECTRE, "utf8").trim().split("\n").slice(1).map((l) => l.split(",")).map(([famille, palier, hex]) => [`${famille} ${palier}`, hex]));

export const teinte = (nom) => {
  if (!paliers.has(nom)) throw new Error(`palier inconnu du spectre : ${nom}`);
  return paliers.get(nom);
};

// Les données extraites des anciens SVG (donnees-extraites/) désignent une réponse par la couleur qu'elle avait
// dans le spectre du 4 septembre 2026. Cette table donne cette couleur pour les paliers qui ont changé depuis.
const CLES_DU_4_SEPTEMBRE = {
  "canard 300": "#32C2C2", "ambre 200": "#EBBF95", "ambre 300": "#DE9B58", "coquelicot 400": "#DF6263",
  "framboise 300": "#E08DBC", "prairie 300": "#83BE76", "petrole 100": "#D1EBF9",
};
export const cleExtraite = (nom) => CLES_DU_4_SEPTEMBRE[nom] ?? teinte(nom);
