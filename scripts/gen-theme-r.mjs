// Génère exports/r/theme_nsp_couleurs.R : les couleurs du spectre NSP au format R,
// avec la table de correspondance vers les constantes de l'enquête Hiérarchie et
// management (utils_rapports.R) et un audit daltonisme des archétypes de palettes.
// Usage : node scripts/gen-theme-r.mjs [scenario]   (défaut : resserre, décidé le 2026-07-21)
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { differenceCiede2000 } from "culori";
import { genSpectre, paliers, simulate } from "../notebooks/lib/spectre.js";
import { SCENARIOS } from "../notebooks/lib/scenarios.js";

const scenario = process.argv[2] ?? "resserre";
if (!SCENARIOS[scenario]) {
  console.error(`Scénario inconnu : ${scenario}. Choix : ${Object.keys(SCENARIOS).join(", ")}`);
  process.exit(1);
}
const spectre = genSpectre(SCENARIOS[scenario]);
const ps = paliers(19); // [50, 100, ..., 950]
const idx = (palier) => ps.indexOf(palier);
const hex = (fam, palier) => {
  const v = spectre[fam]?.[idx(palier)];
  if (!v) throw new Error(`Palier introuvable : ${fam} ${palier}`);
  return v.toUpperCase();
};

// Correspondance sémantique constantes enquête -> spectre NSP.
// Pôle positif = canard (proche identité NSP), pôle négatif = coquelicot,
// "bleu catégoriel" et séquentiel (ex-Brewer Blues) = petrole (même famille,
// deux usages : petrole n'existe que dans resserre, pas myosotis),
// jaunes et orange = ambre, gris = ardoise.
const CORRESPONDANCE = {
  rouge1: ["coquelicot", 600], rouge2: ["coquelicot", 500],
  rouge3: ["coquelicot", 300], rouge4: ["coquelicot", 100],
  vert1: ["canard", 600], vert2: ["canard", 450],
  vert3: ["canard", 250], vert4: ["canard", 100],
  jaune1: ["ambre", 300], jaune2: ["ambre", 200],
  bleu1: ["petrole", 700], bleu2: ["petrole", 450],
  bleu3: ["petrole", 250], bleu4: ["petrole", 100],
  orange: ["ambre", 400],
  gris1: ["ardoise", 500], gris2: ["ardoise", 250],
  gris3: ["ardoise", 150], gris4: ["ardoise", 100],
};

// Séquentielle qui remplace brewer.pal(n, "Blues") : famille petrole,
// échantillonnée du clair au foncé entre 150 et 750 (comme Brewer, clair -> foncé).
const SEQ_FAMILLE = "petrole";
const seqPaliers = (n) => {
  const lo = idx(150), hi = idx(750);
  return Array.from({ length: n }, (_, i) => ps[Math.round(lo + (i * (hi - lo)) / (n - 1))]);
};

// --- Audit daltonisme des archétypes (mêmes seuils que le validateur du labo) ---
const dE = differenceCiede2000();
const SEUIL = 10; // en dessous : risque de confusion entre aplats adjacents
const archetypes = {
  "likert 4 pôles + gris": ["vert1", "vert2", "rouge3", "rouge1", "gris2"],
  "oui / non": ["vert2", "rouge2", "gris2"],
  "3 états (bien / moyen / mal)": ["vert2", "jaune1", "rouge2"],
  "catégoriel bleu / vert / rouge": ["bleu1", "vert1", "rouge2"],
  "catégoriel large (M5)": ["vert1", "bleu1", "jaune2", "rouge2", "orange"],
};
const rHex = Object.fromEntries(Object.entries(CORRESPONDANCE).map(([k, [f, p]]) => [k, hex(f, p)]));
let audit = "";
let conflits = 0;
for (const [nom, cles] of Object.entries(archetypes)) {
  for (const vision of ["normal", "deutan", "protan", "tritan"]) {
    const sims = cles.map((c) => (vision === "normal" ? rHex[c] : simulate(rHex[c], vision)));
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

// --- Émission du fichier R ---
const stamp = process.env.GEN_DATE ?? "";
let r = `# theme_nsp_couleurs.R : GÉNÉRÉ, ne pas éditer à la main.
# Source : nsp-labo, node scripts/gen-theme-r.mjs ${scenario}${stamp ? ` (${stamp})` : ""}
# Scénario de spectre : ${scenario} (ACTÉ le 23 juillet 2026 : l'enquête part sur ce
# spectre ; si une teinte évolue, régénérer ce fichier suffit, rien d'autre ne change).
#
# Audit daltonisme des archétypes de palettes de l'enquête :
${audit}
# Familles du spectre (19 paliers, du plus clair 50 au plus foncé 950) ----
`;
for (const fam of Object.keys(spectre)) {
  const vals = spectre[fam].map((v, i) => `"${v.toUpperCase()}"`).join(", ");
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

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "exports", "r");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "theme_nsp_couleurs.R"), r);
console.log(`Écrit exports/r/theme_nsp_couleurs.R (scénario ${scenario})`);
console.log(conflits ? `AUDIT : ${conflits} conflit(s) daltonisme, voir le fichier` : "AUDIT : aucun conflit daltonisme sous le seuil");
