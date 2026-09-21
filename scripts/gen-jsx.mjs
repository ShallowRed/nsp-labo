// Écrit le script InDesign qui importe tout le spectre dans le document ouvert :
//   rapports/hm-2026/indesign/importer-spectre.jsx
// Les 152 couleurs et les recettes des graphiques y sont inscrites en RVB, depuis spectre-nsp.csv.
// Usage : node scripts/gen-jsx.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lignes = readFileSync(join(racine, "exports/spectre/spectre-nsp.csv"), "utf8").trim().split("\n").slice(1).map((l) => l.split(","));
const rvb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const valeur = new Map(lignes.map(([famille, palier, hex]) => [`${famille} ${palier}`, rvb(hex)]));
const teinte = (nom) => { if (!valeur.has(nom)) throw new Error(`palier inconnu : ${nom}`); return valeur.get(nom); };

// Recettes des graphiques : [modalité, palier, anciens noms que la nuance a portés dans les documents du rapport]
const RECETTES = [
  ["bien", "canard 550", ["bien · canard 600"]], ["plutôt bien", "canard 300", ["plutôt bien · canard 450"]],
  ["plutôt mal", "ambre 200", ["plutôt mal · coquelicot 300"]], ["mal", "coquelicot 500", ["mal · coquelicot 600"]],
  ["ne sait pas", "ardoise 100", ["ne sait pas · ardoise 150"]], ["oui", "canard 550", ["oui · canard 450"]],
  ["non", "coquelicot 500", []], ["milieu (3 états)", "ambre 300", []], ["ça dépend (pivot)", "ardoise 100", []],
  ["très fréquemment", "petrole 700", []], ["souvent", "petrole 550", ["souvent · petrole 450"]],
  ["parfois", "petrole 400", ["parfois · petrole 250"]], ["jamais", "petrole 100", []],
  ["catégorie 1", "coquelicot 500", []], ["catégorie 2", "canard 450", []], ["catégorie 3", "ambre 400", []],
  ["catégorie 4", "lavande 300", []], ["catégorie 5", "framboise 600", []], ["catégorie 6", "prairie 300", []],
];

const familles = [...new Set(lignes.map(([f]) => f))];
const entrees = [
  ...lignes.map(([famille, palier]) => ({ nom: `${famille} ${palier}`, groupe: famille, anciens: [], v: teinte(`${famille} ${palier}`) })),
  ...RECETTES.map(([modalite, palier, anciens]) => ({ nom: `${modalite} · ${palier}`, groupe: "recettes des graphiques", anciens, v: teinte(palier) })),
  // les doublons « copie » que porte le document du rapport sont mis à jour s'ils existent, jamais créés
  ...RECETTES.map(([modalite, palier, anciens]) => ({ nom: `${modalite} · ${palier} copie`, groupe: "recettes des graphiques", anciens: anciens.map((a) => `${a} copie`), v: teinte(palier), facultative: true })),
];

const jsx = `// Importe tout le spectre dans le document ouvert : ${lignes.length} couleurs (${familles.length} familles) et ${RECETTES.length} recettes des graphiques, en RVB.
// Une nuance du même nom est mise à jour, une nuance portant un ancien nom de recette est renommée, les autres sont créées.
// Chaque famille est rangée dans un groupe de nuances. Un premier passage compte sans rien modifier et demande confirmation.
// Généré par scripts/gen-jsx.mjs depuis exports/spectre/spectre-nsp.csv. Ne pas modifier.
#target indesign
var ENTREES = ${JSON.stringify(entrees.map((e) => [e.nom, e.groupe, e.anciens, e.v, e.facultative ? 1 : 0]))};

function trouver(doc, nom, anciens) {
  var n = doc.colors.itemByName(nom);
  if (n.isValid) return n;
  for (var i = 0; i < anciens.length; i++) { n = doc.colors.itemByName(anciens[i]); if (n.isValid) return n; }
  return null;
}
function identique(n, nom, v) {
  if (n.name !== nom || n.space !== ColorSpace.RGB || n.model !== ColorModel.PROCESS) return false;
  for (var i = 0; i < 3; i++) if (Math.round(n.colorValue[i]) !== v[i]) return false;
  return true;
}
function compter(doc) {
  var bilan = {creer: 0, modifier: 0, inchangees: 0, absentes: 0};
  for (var i = 0; i < ENTREES.length; i++) {
    var n = trouver(doc, ENTREES[i][0], ENTREES[i][2]);
    if (!n) { if (!ENTREES[i][4]) bilan.creer++; else bilan.absentes++; } else if (identique(n, ENTREES[i][0], ENTREES[i][3])) bilan.inchangees++; else bilan.modifier++;
  }
  return bilan;
}
function importer() {
  var doc = app.activeDocument, groupes = {}, nonRangees = 0;
  for (var i = 0; i < ENTREES.length; i++) {
    var nom = ENTREES[i][0], groupe = ENTREES[i][1], v = ENTREES[i][3];
    var n = trouver(doc, nom, ENTREES[i][2]);
    if (!n && ENTREES[i][4]) continue;
    if (!n) n = doc.colors.add({name: nom, model: ColorModel.PROCESS, space: ColorSpace.RGB, colorValue: v});
    else if (!identique(n, nom, v)) { n.model = ColorModel.PROCESS; n.space = ColorSpace.RGB; n.colorValue = v; if (n.name !== nom) n.name = nom; }
    try {
      if (!groupes[groupe]) { var g = doc.colorGroups.itemByName(groupe); groupes[groupe] = g.isValid ? g : doc.colorGroups.add(groupe); }
      if (n.parentColorGroup.name !== groupe) groupes[groupe].colorGroupSwatches.add(n);
    } catch (e) { nonRangees++; }
  }
  return nonRangees;
}

if (app.documents.length === 0) alert("Ouvrir le document avant de lancer le script.");
else {
  var avant = compter(app.activeDocument);
  var total = ENTREES.length - avant.absentes;
  var message = "Spectre NSP : " + total + " nuances.\\n" + avant.creer + " à créer, " + avant.modifier + " à mettre à jour ou à renommer, " + avant.inchangees + " déjà à jour.";
  if (confirm(message + "\\n\\nAppliquer ? Une seule annulation (Cmd-Z) défait tout.")) {
    var nonRangees = 0;
    app.doScript(function () { nonRangees = importer(); }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Importer le spectre NSP");
    var apres = compter(app.activeDocument);
    alert("Terminé : " + apres.inchangees + " nuances à jour sur " + total + "." + (nonRangees ? "\\n" + nonRangees + " nuances n'ont pas pu être rangées dans un groupe." : ""));
  }
}
`;

writeFileSync(join(racine, "rapports/hm-2026/indesign/importer-spectre.jsx"), jsx);
console.log(`importer-spectre.jsx : ${entrees.filter((e) => !e.facultative).length} nuances`);
