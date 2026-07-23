// Génère mockups/tokens-couleur.css : la COUCHE COULEUR de la charte, depuis le spectre.
// Primitifs (familles x paliers) + rôles sémantiques + thématiques + dataviz.
// Les maquettes consomment les rôles (--c-*), jamais les primitifs : si le spectre
// évolue, régénérer ce fichier suffit, les maquettes suivent (concern couleur isolé).
// Usage : npm run gen:tokens
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { genSpectre, paliers, bestCategorical } from "../notebooks/lib/spectre.js";
import { SCENARIOS, CATEGORIEL } from "../notebooks/lib/scenarios.js";

const id = "resserre"; // spectre acté le 23 juillet 2026
const sp = genSpectre(SCENARIOS[id]);
const ps = paliers(19);
const fams = Object.keys(sp);
const has = (f) => fams.includes(f);
const pickFam = (...cands) => cands.find(has) ?? fams[0];
const prim = (f, p) => `var(--sp-${f}-${p})`;

let css = `:root{\n  /* Spectre « ${SCENARIOS[id].label} » — PRIMITIFS (régénérables : gen-tokens-css.mjs) */\n`;
for (const f of fams) ps.forEach((p) => { css += `  --sp-${f}-${p}: ${sp[f][ps.indexOf(p)]};\n`; });

css += `\n  /* RÔLES SÉMANTIQUES — la couche que les maquettes consomment */\n`;
const brand = pickFam("petrole", "canard", "myosotis");
const accent = pickFam("coquelicot", "framboise");
const roles = {
  ink: ["ardoise", 850], "ink-soft": ["ardoise", 600], paper: null, "paper-tint": ["ardoise", 50],
  brand: [brand, 600], "brand-deep": [brand, 800], "brand-tint": [brand, 50],
  accent: [accent, 500], "accent-deep": [accent, 700], rule: ["ardoise", 200],
};
for (const [k, v] of Object.entries(roles)) css += `  --c-${k}: ${v ? prim(v[0], v[1]) : "#ffffff"};\n`;

css += `\n  /* THÉMATIQUES — une famille par politique publique (replis si absente du scénario) */\n`;
const themes = {
  sante: pickFam("canard", "prairie"), education: pickFam("ambre", "olive"),
  transports: pickFam("petrole", "myosotis", "canard"), justice: pickFam("lavande", "amethyste"),
  logement: pickFam("coquelicot", "framboise"), ecologie: pickFam("prairie", "olive"),
};
for (const [th, f] of Object.entries(themes)) css += `  --c-th-${th}: ${prim(f, 550)};\n  --c-th-${th}-tint: ${prim(f, 50)};\n`;

const cat = bestCategorical(sp, CATEGORIEL[id], { mode: "light", ps });
css += `\n  /* DATAVIZ — catégoriel validé daltonisme */\n`;
cat.ordered.forEach((c, i) => { css += `  --c-cat-${i + 1}: ${c.hex};\n`; });
css += `}\n`;

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "mockups", "tokens-couleur.css");
writeFileSync(out, css);
console.log(`Écrit mockups/tokens-couleur.css (scénario ${id}, ${fams.length} familles, catégoriel ${cat.ordered.length})`);
