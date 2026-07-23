// Génère le kit R de l'enquête Hiérarchie et management depuis le spectre NSP :
//   exports/r/theme_nsp_couleurs.R      familles complètes + séquentielle + constantes nsp_*
//   exports/r/palette-maelle-resserre.R drop-in aux noms de variables de Maëlle (rouge1..gris4)
// Une seule table de correspondance sert les deux fichiers ; un audit daltonisme
// (CIEDE2000 sur simulations de Viénot) vérifie les archétypes réels de son code.
// Usage : node scripts/gen-r.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { differenceCiede2000 } from "culori";
import { genSpectre, paliers, simulate } from "../notebooks/lib/spectre.js";
import { SCENARIOS } from "../notebooks/lib/scenarios.js";

const scenario = "resserre"; // spectre acté le 23 juillet 2026
const spectre = genSpectre(SCENARIOS[scenario]);
const ps = paliers(19);
const hex = (fam, palier) => {
  const v = spectre[fam]?.[ps.indexOf(palier)];
  if (!v) throw new Error(`Palier introuvable : ${fam} ${palier}`);
  return v.toUpperCase();
};

// Correspondance sémantique constantes enquête -> spectre NSP (source unique).
// Pôle positif = canard (identité NSP), négatif = coquelicot, bleu et séquentiel
// = petrole, jaune et orange = ambre, gris = ardoise. Convention 1 = foncé.
const CORRESPONDANCE = {
  rouge1: ["coquelicot", 600], rouge2: ["coquelicot", 500],
  rouge3: ["coquelicot", 300], rouge4: ["coquelicot", 100],
  vert1: ["canard", 600], vert2: ["canard", 450],
  vert3: ["canard", 250], vert4: ["canard", 100],
  jaune1: ["ambre", 300], jaune2: ["ambre", 200],
  bleu1: ["petrole", 700], bleu2: ["petrole", 450],
  bleu3: ["petrole", 250], bleu4: ["petrole", 100],
  orange: ["ambre", 400], // pas 500 : à 500 l'audit détecte un conflit orange/rouge2 en deutan et tritan
  gris1: ["ardoise", 500], gris2: ["ardoise", 250],
  gris3: ["ardoise", 150], gris4: ["ardoise", 100],
};
const val = Object.fromEntries(Object.entries(CORRESPONDANCE).map(([k, [f, p]]) => [k, hex(f, p)]));

// Séquentielle qui remplace brewer.pal(n, "Blues") : petrole, du clair au foncé.
const SEQ_FAMILLE = "petrole";

// --- Audit daltonisme des archétypes réels des palettes de l'enquête ---
const dE = differenceCiede2000();
const SEUIL = 10; // en dessous : risque de confusion entre aplats adjacents
const archetypes = {
  "likert 4 pôles + gris": ["vert1", "vert2", "rouge3", "rouge1", "gris2"],
  "oui / non": ["vert2", "rouge2", "gris2"],
  "3 états (bien / moyen / mal)": ["vert2", "jaune1", "rouge2"],
  "catégoriel bleu / vert / rouge": ["bleu1", "vert1", "rouge2"],
  "catégoriel large (M5)": ["vert1", "bleu1", "jaune2", "rouge2", "orange"],
};
let audit = "";
let conflits = 0;
for (const [nom, cles] of Object.entries(archetypes)) {
  for (const vision of ["normal", "deutan", "protan", "tritan"]) {
    const sims = cles.map((c) => (vision === "normal" ? val[c] : simulate(val[c], vision)));
    for (let i = 0; i < cles.length; i++) {
      for (let j = i + 1; j < cles.length; j++) {
        const d = dE(sims[i], sims[j]);
        if (d < SEUIL) {
          audit += `#   CONFLIT ${nom} [${vision}] : ${cles[i]} / ${cles[j]} dE ${d.toFixed(1)}\n`;
          conflits++;
        }
      }
    }
  }
}
if (!conflits) audit = "#   aucun conflit sous le seuil (dE 10) en vision normale, deutan, protan, tritan\n";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "exports", "r");
mkdirSync(outDir, { recursive: true });

// --- theme_nsp_couleurs.R : familles complètes + helpers + constantes ---
const stamp = process.env.GEN_DATE ?? "";
let r = `# theme_nsp_couleurs.R : GÉNÉRÉ, ne pas éditer à la main.
# Source : nsp-labo, node scripts/gen-r.mjs${stamp ? ` (${stamp})` : ""}
# Spectre NSP « resserré » (ACTÉ le 23 juillet 2026 : l'enquête part sur ce
# spectre ; si une teinte évolue, régénérer ce fichier suffit, rien d'autre ne change).
#
# Audit daltonisme des archétypes de palettes de l'enquête :
${audit}
# Familles du spectre (19 paliers, du plus clair 50 au plus foncé 950) ----
`;
for (const fam of Object.keys(spectre)) {
  const vals = spectre[fam].map((v) => `"${v.toUpperCase()}"`).join(", ");
  r += `nsp_${fam} <- c(${vals})\n`;
}
r += `nsp_paliers <- c(${ps.join(", ")})
nsp_palier <- function(famille, palier) famille[[match(palier, nsp_paliers)]]

# Séquentielle NSP (remplace les rampes Brewer "Blues") ----
nsp_seq <- function(n, famille = nsp_${SEQ_FAMILLE}) {
  stopifnot(n >= 2)
  lo <- match(150, nsp_paliers); hi <- match(750, nsp_paliers)
  famille[round(seq(lo, hi, length.out = n))]
}

# Correspondance avec les constantes de utils_rapports.R ----
# (pôle positif = canard, négatif = coquelicot, bleu et séquentiel = petrole,
#  jaune et orange = ambre, gris = ardoise)
`;
for (const [cst, [fam, palier]] of Object.entries(CORRESPONDANCE)) {
  r += `nsp_${cst} <- "${hex(fam, palier)}"  # ${fam} ${palier}\n`;
}
writeFileSync(join(outDir, "theme_nsp_couleurs.R"), r);

// --- palette-maelle-resserre.R : le bloc exact de Maëlle, prêt à coller ---
const groupes = [["rouge", 4], ["vert", 4], ["jaune", 2], ["bleu", 4], ["orange", 1], ["gris", 4]];
let bloc = `# Palette NSP — spectre unifié « resserré » (ACTÉ le 23 juillet 2026).
# Drop-in : remplace ton bloc de couleurs, les palettes pal_M* s'adaptent seules.
# Convention conservée : 1 = le plus foncé, 4 = le plus clair (y compris les gris).

`;
for (const [base, n] of groupes) {
  for (let i = 1; i <= n; i++) {
    const k = base === "orange" ? "orange" : `${base}${i}`;
    bloc += `${k.padEnd(7)}<- "${val[k]}"\n`;
    if (base === "orange") break;
  }
  bloc += "\n";
}
bloc += `
# Correspondance : rouge=coquelicot, vert=canard, jaune/orange=ambre, bleu=petrole, gris=ardoise
# Points de passation (a confirmer ensemble) :
# - pivot "ca depend" : l'ex-#ccbd2f servait a la fois de rouge4/vert4/jaune1/orange ;
#   ici chaque variable a sa propre valeur. Milieu d'une echelle a 3 etats : jaune1 (audite).
#   Pivot d'un likert a 5 modalites : gris clair (gris4), un pivot jaune-orange se
#   confond avec le pole chaud en daltonisme (mesure : dE 7 contre 15 en pivot neutre).
# - "ne sait pas / non renseigne" : prendre gris3 ou gris4 (clairs), pas gris1 (fonce).
# - encre (ex-noir -> bleu fonce) : bleu1 convient (texte et axes).
`;
bloc += conflits
  ? `# Audit daltonisme : ${conflits} conflit(s) sous dE ${SEUIL}, voir theme_nsp_couleurs.R\n`
  : `# Audit daltonisme : OK (aucun conflit sous dE ${SEUIL} en deutan/protan/tritan sur les archétypes likert, oui-non, 3 états, catégoriel).\n`;
writeFileSync(join(outDir, "palette-maelle-resserre.R"), bloc);

console.log(`Écrit exports/r/theme_nsp_couleurs.R et exports/r/palette-maelle-resserre.R`);
console.log(conflits ? `AUDIT : ${conflits} conflit(s) daltonisme, voir theme_nsp_couleurs.R` : "AUDIT : aucun conflit daltonisme sous le seuil");
