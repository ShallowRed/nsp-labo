// Construit le nuancier Adobe (.ase) et le CSV du spectre NSP, depuis la source
// unique du spectre. Pur, sans dépendance à Node (Uint8Array) : le même code sert
// scripts/gen-ase.mjs (écriture disque) et le notebook (téléchargement navigateur),
// donc le fichier téléchargé est exactement celui qui est audité.
// Le .ase s'importe dans le nuancier InDesign/Illustrator ; les couleurs sont
// "globales" (type 0) : modifier une couleur du nuancier met à jour tout le document.
import { paliers, oklchCss } from "./spectre.js";

const ps19 = paliers(19);
const ps11 = paliers(11); // les 11 paliers nommés : vocabulaire de référence

// Groupes d'usage pour les graphiques (recettes de la charte, noms par modalité :
// mêmes valeurs que le kit R de la chaîne d'analyse).
// Recettes des graphiques : la même table que CORRESPONDANCE dans scripts/gen-r.mjs
// (palette « canard et coquelicot » retenue le 24 juillet 2026). Les deux doivent bouger ensemble.
export const USAGES = [
  ["graphiques · opinion 4 réponses", [
    ["mal", "coquelicot", 500], ["plutôt mal", "ambre", 200],
    ["plutôt bien", "canard", 300], ["bien", "canard", 550],
  ]],
  ["graphiques · opinion 5 réponses", [
    ["mal", "coquelicot", 500], ["plutôt mal", "ambre", 200],
    ["ça dépend (pivot)", "ardoise", 100],
    ["plutôt bien", "canard", 300], ["bien", "canard", 550],
  ]],
  ["graphiques · oui, non", [
    ["oui", "canard", 550], ["non", "coquelicot", 500],
  ]],
  ["graphiques · milieu d'une échelle à 3 états", [
    ["milieu (3 états)", "ambre", 300],
  ]],
  ["graphiques · fréquence (progression)", [
    ["jamais", "petrole", 100], ["rarement", "petrole", 250], ["parfois", "petrole", 400],
    ["souvent", "petrole", 550], ["toujours", "petrole", 700],
  ]],
  ["graphiques · catégories sans ordre (dans cet ordre)", [
    ["catégorie 1", "coquelicot", 500], ["catégorie 2", "canard", 450],
    ["catégorie 3", "ambre", 400], ["catégorie 4", "lavande", 300],
    ["catégorie 5", "framboise", 600], ["catégorie 6", "prairie", 300],
  ]],
  ["graphiques · ne sait pas, non renseigné", [
    ["ne sait pas", "ardoise", 100],
  ]],
];

// --- octets big-endian, en tableaux de nombres ---
const u16 = (n) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const f32 = (n) => { const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, n, false); return [...b]; };
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));
const nomAse = (s) => {
  const chars = [];
  for (let i = 0; i < s.length; i++) chars.push(...u16(s.charCodeAt(i)));
  chars.push(0, 0); // terminateur nul (compté dans la longueur)
  return [...u16(s.length + 1), ...chars];
};
const bloc = (type, data) => [...u16(type), ...u32(data.length), ...data];
const couleur = (nom, hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return bloc(0x0001, [...nomAse(nom), ...ascii("RGB "), ...f32(r), ...f32(g), ...f32(b), ...u16(0)]);
};
const groupeBlocs = (nom, couleurs) => [bloc(0xc001, nomAse(nom)), ...couleurs, bloc(0xc002, [])];

const resolveur = (spectre) => (fam, palier) => {
  const v = spectre[fam]?.[ps19.indexOf(palier)];
  if (!v) throw new Error(`référence introuvable : ${fam} ${palier}`);
  return v.toUpperCase();
};

// Nuancier .ase → Uint8Array
export function buildAse(spectre) {
  const hexDe = resolveur(spectre);
  const blocs = [];
  for (const fam of Object.keys(spectre))
    blocs.push(...groupeBlocs(`spectre · ${fam}`, ps11.map((p) => couleur(`${fam} ${p}`, hexDe(fam, p)))));
  for (const [nom, entrees] of USAGES)
    blocs.push(...groupeBlocs(nom, entrees.map(([n, fam, p]) => couleur(`${n} · ${fam} ${p}`, hexDe(fam, p)))));
  return Uint8Array.from([...ascii("ASEF"), ...u16(1), ...u16(0), ...u32(blocs.length), ...blocs.flat()]);
}

// CSV de référence (les 19 crans, avec le vocabulaire nommé signalé) → string.
// `detail` (genSpectreDetail) ajoute la notation oklch exacte, sans l'arrondi du hex.
export function buildCsv(spectre, detail = null) {
  const hexDe = resolveur(spectre);
  let csv = "famille,palier,hex,palier nomme" + (detail ? ",oklch" : "") + "\n";
  for (const fam of Object.keys(spectre))
    for (const p of ps19) {
      const ok = detail ? `,${oklchCss(detail[fam][ps19.indexOf(p)])}` : "";
      csv += `${fam},${p},${hexDe(fam, p)},${ps11.includes(p) ? "oui" : "non"}${ok}\n`;
    }
  return csv;
}

// Nombre de couleurs attendu (pour l'auto-contrôle).
export const nbCouleurs = () => 8 * ps11.length + USAGES.reduce((a, [, e]) => a + e.length, 0);
