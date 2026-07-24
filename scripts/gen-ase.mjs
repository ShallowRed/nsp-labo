// Génère exports/spectre/ : le spectre NSP au format Adobe Swatch Exchange (.ase),
// importable tel quel dans le nuancier InDesign ou Illustrator, plus un CSV de
// référence. Contenu : les 11 paliers nommés de chaque famille (le vocabulaire
// officiel), et des groupes d'usage prêts à l'emploi pour les graphiques
// (mêmes recettes que lib/charte-tramanh.js et que le kit R).
// Usage : node scripts/gen-ase.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { genSpectre, paliers } from "../notebooks/lib/spectre.js";
import { SCENARIOS } from "../notebooks/lib/scenarios.js";

const spectre = genSpectre(SCENARIOS.resserre);
const ps19 = paliers(19);
const ps11 = paliers(11); // les paliers nommés : 50, 100, 200, ..., 900, 950
const hexDe = (fam, palier) => {
  const v = spectre[fam]?.[ps19.indexOf(palier)];
  if (!v) throw new Error(`référence introuvable : ${fam} ${palier}`);
  return v.toUpperCase();
};

// Groupes d'usage pour les graphiques (recettes de la charte, noms par modalité).
const USAGES = [
  ["graphiques · opinion 4 réponses", [
    ["mal", "coquelicot", 600], ["plutôt mal", "coquelicot", 300],
    ["plutôt bien", "canard", 450], ["bien", "canard", 600],
  ]],
  ["graphiques · opinion 5 réponses", [
    ["mal", "coquelicot", 600], ["plutôt mal", "coquelicot", 300],
    ["ça dépend (pivot)", "ardoise", 100],
    ["plutôt bien", "canard", 450], ["bien", "canard", 600],
  ]],
  ["graphiques · oui, non", [
    ["oui", "canard", 450], ["non", "coquelicot", 500],
  ]],
  ["graphiques · milieu d'une échelle à 3 états", [
    ["milieu (3 états)", "ambre", 300],
  ]],
  ["graphiques · fréquence (progression)", [
    ["jamais", "petrole", 100], ["parfois", "petrole", 250],
    ["souvent", "petrole", 450], ["très fréquemment", "petrole", 700],
  ]],
  ["graphiques · catégories sans ordre (dans cet ordre)", [
    ["catégorie 1", "coquelicot", 500], ["catégorie 2", "canard", 450],
    ["catégorie 3", "ambre", 400], ["catégorie 4", "lavande", 300],
    ["catégorie 5", "framboise", 600], ["catégorie 6", "prairie", 300],
  ]],
  ["graphiques · ne sait pas, non renseigné", [
    ["ne sait pas", "ardoise", 150],
  ]],
];

// --- Écriture ASE (format Adobe Swatch Exchange, big-endian) ---
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16BE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const f32 = (n) => { const b = Buffer.alloc(4); b.writeFloatBE(n); return b; };
const nomAse = (s) => {
  const b = Buffer.alloc((s.length + 1) * 2);
  for (let i = 0; i < s.length; i++) b.writeUInt16BE(s.charCodeAt(i), i * 2);
  return Buffer.concat([u16(s.length + 1), b]);
};
const bloc = (type, data) => Buffer.concat([u16(type), u32(data.length), data]);
const couleur = (nom, hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  // type 0 = couleur globale : modifiable en un point dans le nuancier InDesign
  return bloc(0x0001, Buffer.concat([nomAse(nom), Buffer.from("RGB "), f32(r), f32(g), f32(b), u16(0)]));
};
const groupe = (nom, entrees) => [
  bloc(0xc001, nomAse(nom)),
  ...entrees,
  bloc(0xc002, Buffer.alloc(0)),
];

const blocs = [];
for (const fam of Object.keys(spectre)) {
  blocs.push(...groupe(`spectre · ${fam}`,
    ps11.map((p) => couleur(`${fam} ${p}`, hexDe(fam, p)))));
}
for (const [nomGroupe, entrees] of USAGES) {
  blocs.push(...groupe(nomGroupe,
    entrees.map(([nom, fam, p]) => couleur(`${nom} · ${fam} ${p}`, hexDe(fam, p)))));
}
const ase = Buffer.concat([Buffer.from("ASEF"), u16(1), u16(0), u32(blocs.length), ...blocs]);

// --- CSV de référence : les 19 crans, avec le vocabulaire nommé signalé ---
let csv = "famille,palier,hex,palier nomme\n";
for (const fam of Object.keys(spectre))
  for (const p of ps19) csv += `${fam},${p},${hexDe(fam, p)},${ps11.includes(p) ? "oui" : "non"}\n`;

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "exports", "spectre");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "spectre-nsp.ase"), ase);
writeFileSync(join(outDir, "spectre-nsp.csv"), csv);

// --- Auto-contrôle : relire l'ASE et compter les entrées ---
let off = 12, groupes = 0, entrees = 0;
while (off < ase.length) {
  const type = ase.readUInt16BE(off);
  const len = ase.readUInt32BE(off + 2);
  if (type === 0xc001) groupes++;
  if (type === 0x0001) entrees++;
  off += 6 + len;
}
const attendu = 8 * ps11.length + USAGES.reduce((a, [, e]) => a + e.length, 0);
if (entrees !== attendu || off !== ase.length) {
  console.error(`ASE incohérent : ${entrees} entrées (attendu ${attendu}), fin ${off}/${ase.length}`);
  process.exit(1);
}
console.log(`Écrit exports/spectre/ : spectre-nsp.ase (${groupes} groupes, ${entrees} couleurs) + spectre-nsp.csv (${8 * ps19.length} lignes)`);
