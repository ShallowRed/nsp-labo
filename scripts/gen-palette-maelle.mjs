// Génère le bloc de couleurs de Maëlle (rouge1..gris4, mêmes noms de variables)
// avec les valeurs du spectre NSP : drop-in pour son code R d'analyse de l'enquête.
// Elle a écrit : "si tu me donnes les nouveaux codes couleurs, les palettes
// s'adapteront toutes seules" — ce script produit exactement ces codes.
// Usage : node scripts/gen-palette-maelle.mjs [scenario]   (défaut : resserre)
import { differenceCiede2000 } from "culori";
import { genSpectre, paliers, simulate } from "../notebooks/lib/spectre.js";
import { SCENARIOS } from "../notebooks/lib/scenarios.js";

const scenario = process.argv[2] ?? "resserre";
if (!SCENARIOS[scenario]) {
  console.error(`Scénario inconnu : ${scenario}. Choix : ${Object.keys(SCENARIOS).join(", ")}`);
  process.exit(1);
}
const sp = genSpectre(SCENARIOS[scenario]);
const ps = paliers(19);
const fams = Object.keys(sp);
const t = (fam, palier) => sp[fam]?.[ps.indexOf(palier)]?.toUpperCase();

// Résolution sémantique -> famille du scénario, avec repli si absente.
const pick = (...cands) => cands.find((f) => sp[f]) ?? fams[0];
const F = {
  rouge: pick("coquelicot"),      // pôle négatif (mal, plutôt mal)
  vert: pick("canard"),            // pôle positif (bien, plutôt bien) — aligné identité NSP
  jaune: pick("ambre"),            // état intermédiaire
  bleu: pick("petrole", "myosotis", "lavande"), // séquentiel / bleu NSP
  orange: pick("ambre"),           // accent
  gris: pick("ardoise"),           // non-réponse, manquant
};

// Chaque variable -> [famille, palier]. Rampes 4 niveaux du foncé (1) au très clair (4),
// calquées sur les rôles d'origine de Maëlle.
const MAP = {
  rouge1: [F.rouge, 600], rouge2: [F.rouge, 500], rouge3: [F.rouge, 300], rouge4: [F.rouge, 100],
  vert1: [F.vert, 600], vert2: [F.vert, 450], vert3: [F.vert, 250], vert4: [F.vert, 100],
  jaune1: [F.jaune, 300], jaune2: [F.jaune, 200],
  bleu1: [F.bleu, 700], bleu2: [F.bleu, 450], bleu3: [F.bleu, 250], bleu4: [F.bleu, 100],
  orange: [F.orange, 500],
  gris1: [F.gris, 500], gris2: [F.gris, 250], gris3: [F.gris, 150], gris4: [F.gris, 100],
};

// --- Audit daltonisme sur les archétypes réels de son code ---
const val = Object.fromEntries(Object.entries(MAP).map(([k, [f, p]]) => [k, t(f, p)]));
const dE = differenceCiede2000();
const SEUIL = 10;
const archetypes = {
  "likert (vert1, vert2, rouge3, rouge1, gris2)": ["vert1", "vert2", "rouge3", "rouge1", "gris2"],
  "oui / non (vert2, rouge2, gris2)": ["vert2", "rouge2", "gris2"],
  "3 etats (vert2, jaune1, rouge2)": ["vert2", "jaune1", "rouge2"],
  "categoriel (bleu1, vert1, jaune2, rouge2)": ["bleu1", "vert1", "jaune2", "rouge2"],
};
let conflits = 0;
const lignesAudit = [];
for (const [nom, cles] of Object.entries(archetypes)) {
  for (const vision of ["deutan", "protan", "tritan"]) {
    const sims = cles.map((c) => simulate(val[c], vision));
    for (let i = 0; i < cles.length; i++)
      for (let j = i + 1; j < cles.length; j++) {
        const d = dE(sims[i], sims[j]);
        if (d < SEUIL) { lignesAudit.push(`  CONFLIT ${nom} [${vision}] : ${cles[i]}/${cles[j]} dE ${d.toFixed(1)}`); conflits++; }
      }
  }
}

// --- Sortie : le bloc exact de Maëlle ---
const groupes = [["rouge", 4], ["vert", 4], ["jaune", 2], ["bleu", 4], ["orange", 1], ["gris", 4]];
let bloc = `# Palette NSP — spectre unifié, scénario « ${SCENARIOS[scenario].label} » (ACTÉ le 23 juillet 2026).\n`;
bloc += `# Drop-in : remplace ton bloc de couleurs, les palettes pal_M* s'adaptent seules.\n`;
bloc += `# Convention conservée : 1 = le plus foncé, 4 = le plus clair (y compris les gris).\n\n`;
for (const [base, n] of groupes) {
  for (let i = 1; i <= (base === "orange" ? 1 : n); i++) {
    const k = base === "orange" ? "orange" : `${base}${i}`;
    bloc += `${k.padEnd(7)}<- "${val[k]}"\n`;
  }
  bloc += "\n";
}

console.log(bloc);
console.log(`# Correspondance : rouge=${F.rouge}, vert=${F.vert}, jaune/orange=${F.jaune}, bleu=${F.bleu}, gris=${F.gris}`);
console.log(`# Points de passation (a confirmer ensemble) :`);
console.log(`# - pivot "ca depend" : l'ex-#ccbd2f servait a la fois de rouge4/vert4/jaune1/orange ;`);
console.log(`#   ici chaque variable a sa propre valeur -> utiliser jaune1 comme modalite mediane.`);
console.log(`# - "ne sait pas / non renseigne" : prendre gris3 ou gris4 (clairs), pas gris1 (fonce).`);
console.log(`# - encre (ex-noir -> bleu fonce) : bleu1 convient (texte et axes).`);
console.log(conflits
  ? `# Audit daltonisme : ${conflits} conflit(s) sous dE ${SEUIL} :\n${lignesAudit.join("\n")}`
  : `# Audit daltonisme : OK (aucun conflit sous dE ${SEUIL} en deutan/protan/tritan sur les archétypes likert, oui-non, 3 états, catégoriel).`);
