// Passe de finition typographique sur l'export Markdown natif du Google Doc
// du rapport enquête (POC du workflow W2 : gdoc -> md -> ICML -> InDesign).
// Automatise la liste que la rédaction prévoyait de faire à la main
// (guillemets français, espaces insécables) + prépare le manifeste de figures.
// Usage : node scripts/finition-md.mjs <entree.md> <sortie.md>
import { readFileSync, writeFileSync } from "node:fs";

const [entree, sortie] = process.argv.slice(2);
if (!entree || !sortie) {
  console.error("Usage : node scripts/finition-md.mjs <entree.md> <sortie.md>");
  process.exit(1);
}
const NNBSP = " "; // espace fine insécable (typographie française)
let md = readFileSync(entree, "utf8");
const compte = {};
const passe = (nom, regex, remplacement) => {
  const avant = md;
  md = md.replace(regex, remplacement);
  compte[nom] = (avant.match(regex) ?? []).length;
};

// 1. Table des matières de l'export (liens ancres en tête) : retirée, la maquette a la sienne.
passe("toc retirée", /^\[[^\]]*\]\(#[^)]*\)\n+/gm, "");

// 2. Titres vides (paragraphes stylés vides de l'export) : retirés.
passe("titres vides", /^#{1,6} *\n/gm, "");

// 3. Figures : la référence embarquée devient un emplacement de manifeste,
//    les définitions base64 sont retirées (les fichiers viendront des exports R).
let nFig = 0;
md = md.replace(/!\[\]\[image(\d+)\]/g, () => `<!-- FIGURE ${String(++nFig).padStart(2, "0")} : id du manifeste à renseigner -->`);
compte["figures balisées"] = nFig;
passe("définitions base64 retirées", /^\[image\d+\]: <data:[^>]*>\n?/gm, "");

// 4. Guillemets courbes ou droits anglais -> guillemets français avec fines insécables.
passe("guillemets français", /[“"]([^”"\n]{1,400})[”"]/g, `«${NNBSP}$1${NNBSP}»`);

// 5. Espaces insécables fines avant % ; : ! ? » et après « (espace simple existante).
passe("insécables ponctuation", /(\S) ([%;:!?»])/g, `$1${NNBSP}$2`);
passe("insécables après «", /« (?=\S)/g, `«${NNBSP}`);

// 6. Signalements (non corrigés automatiquement : à trancher par la rédaction).
const signalements = [];
for (const [i, ligne] of md.split("\n").entries()) {
  if (/^#{1,6} .*\?\s*$/.test(ligne)) signalements.push(`ligne ${i + 1} : titre-question (probable titre de figure, pas de section) : ${ligne.slice(0, 80)}`);
  if (/^#{1,6} .*[a-zà-ü][A-ZÀ-Ü]/.test(ligne)) signalements.push(`ligne ${i + 1} : titre suspect (résidu de suggestion ?) : ${ligne.slice(0, 80)}`);
  if (/\]\(http:\/\/[^)]{1,30}\.es\)/.test(ligne)) signalements.push(`ligne ${i + 1} : faux lien auto (résidu de suggestion non tranchée) : purger les suggestions du doc avant export`);
  if (/^\| .{400,}\|$/.test(ligne)) signalements.push(`ligne ${i + 1} : encadré aplati en tableau 1 cellule : convenir d'un style d'encadré dans le doc`);
}

writeFileSync(sortie, md);
console.log(`Écrit ${sortie}`);
for (const [nom, n] of Object.entries(compte)) console.log(`  ${nom} : ${n}`);
console.log(`Signalements à arbitrer par la rédaction : ${signalements.length}`);
for (const s of signalements.slice(0, 12)) console.log(`  - ${s}`);
if (signalements.length > 12) console.log(`  ... et ${signalements.length - 12} autres`);
