// Génère les visuels SVG du deck de présentation depuis les libs nsp-labo.
import { writeFileSync, copyFileSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { converter, formatHex, clampChroma, wcagContrast } from "culori";
const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
globalThis.window = dom.window;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
const Plot = await import("@observablehq/plot");
const { genSpectre, paliers, simulate, bestCategorical } = await import("/Users/lucaspoulain/Projects/nsp-labo/notebooks/lib/spectre.js");
const { SCENARIOS, CATEGORIEL } = await import("/Users/lucaspoulain/Projects/nsp-labo/notebooks/lib/scenarios.js");
const { franceMetropolitaine } = await import("/Users/lucaspoulain/Projects/nsp-labo/notebooks/lib/carte.js");
const OUT = "/Users/lucaspoulain/Projects/nuxt-slides/public/images/nsp-refonte/";

const sc = "resserre" in SCENARIOS ? "resserre" : "median-v01";
const spectre = genSpectre(SCENARIOS[sc]);
const ps = paliers(19);
const t = (f, p) => spectre[f]?.[ps.indexOf(p)];
console.log("scénario:", sc, "familles:", Object.keys(spectre).join(", "));

// --- 1. nuancier ---
{
  const fams = Object.keys(spectre);
  const cell = 44, gap = 4, mLeft = 130, mTop = 40;
  const w = mLeft + 19 * (cell + gap), h = mTop + fams.length * (cell + gap) + 10;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="system-ui" font-size="18">`;
  [50, 300, 500, 700, 950].forEach((p) => {
    s += `<text x="${mLeft + ps.indexOf(p) * (cell + gap) + cell / 2}" y="${mTop - 12}" text-anchor="middle" fill="#666">${p}</text>`;
  });
  fams.forEach((f, i) => {
    const y = mTop + i * (cell + gap);
    s += `<text x="${mLeft - 10}" y="${y + cell / 2 + 6}" text-anchor="end" fill="#333">${f}</text>`;
    spectre[f].forEach((hex, j) => {
      s += `<rect x="${mLeft + j * (cell + gap)}" y="${y}" width="${cell}" height="${cell}" rx="5" fill="${hex}"/>`;
    });
  });
  writeFileSync(OUT + "nuancier.svg", s + "</svg>");
}

// --- 2. likert avant / après daltonisme ---
{
  const vals = [10, 45, 31, 14]; // bien, plutôt bien, plutôt mal, mal (au travail, démo)
  const actuelle = ["#079C31", "#63F88D", "#FAA18F", "#C82909"];
  const nsp = [t("canard", 600), t("canard", 450), t("coquelicot", 300), t("coquelicot", 600)];
  const rows = [
    ["Palette actuelle (chaîne R)", actuelle, "normal"],
    ["Palette actuelle, deutéranopie simulée", actuelle, "deutan"],
    ["Spectre NSP", nsp, "normal"],
    ["Spectre NSP, deutéranopie simulée", nsp, "deutan"],
  ];
  const W = 900, barW = 560, barH = 40, x0 = 320, pad = 26;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${rows.length * (barH + pad) + 40}" font-family="system-ui" font-size="17">`;
  rows.forEach(([label, pal, vision], i) => {
    const y = 20 + i * (barH + pad);
    s += `<text x="${x0 - 14}" y="${y + barH / 2 + 6}" text-anchor="end" fill="#333">${label}</text>`;
    let x = x0;
    vals.forEach((v, j) => {
      const wSeg = (v / 100) * barW;
      const c = vision === "normal" ? pal[j] : simulate(pal[j], "deutan");
      s += `<rect x="${x}" y="${y}" width="${wSeg}" height="${barH}" fill="${c}"/>`;
      if (v >= 8) s += `<text x="${x + wSeg / 2}" y="${y + barH / 2 + 6}" text-anchor="middle" fill="white" font-weight="600">${v}</text>`;
      x += wSeg;
    });
  });
  writeFileSync(OUT + "likert-daltonisme.svg", s + "</svg>");
}

// --- 3. carte choroplèthe ---
{
  const topo = JSON.parse(readFileSync("/Users/lucaspoulain/Projects/nsp-labo/notebooks/data/departements.json", "utf8"));
  const fm = franceMetropolitaine(topo);
  const fam = spectre.lavande ?? spectre.canard ?? spectre.petrole;
  const idx = [2, 5, 8, 11, 14];
  const ramp = fam.filter((_, i) => idx.includes(i));
  const valeurDep = (f) => { let h = 0; for (const ch of f.properties.INSEE_DEP) h = (h * 31 + ch.charCodeAt(0)) % 997; return 5 + (h % 26); };
  const carte = Plot.plot({
    document: dom.window.document,
    projection: { type: "conic-conformal", rotate: [-3, 0], parallels: [44, 49], domain: fm },
    width: 460, height: 440,
    style: { fontFamily: "system-ui" },
    color: { type: "quantile", n: 5, range: ramp },
    marks: [Plot.geo(fm, { fill: (d) => valeurDep(d), stroke: fam[14], strokeWidth: 0.5 })],
  });
  carte.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  writeFileSync(OUT + "carte.svg", carte.outerHTML);
}

// --- 4. couvertures thématiques ---
{
  const themes = ["Santé", "Éducation", "Transports", "Justice", "Logement", "Écologie"];
  const fams = Object.keys(spectre).filter((f) => f !== "ardoise");
  const cw = 150, ch = 212, gap = 18;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${themes.length * (cw + gap)} ${ch + 10}" font-family="system-ui">`;
  themes.forEach((theme, i) => {
    const f = fams[i % fams.length], x = i * (cw + gap);
    s += `<g transform="translate(${x},4)">
      <rect width="${cw}" height="${ch}" rx="4" fill="${t(f, 100)}"/>
      <rect width="${cw}" height="132" rx="4" fill="${t(f, 550)}"/>
      <path d="M 95 -30 A 85 85 0 0 1 40 105" fill="none" stroke="${t(f, 400)}" stroke-width="13" opacity="0.55"/>
      <text x="12" y="22" font-size="8.5" font-weight="700" fill="white">Nos services publics</text>
      <text x="12" y="186" font-size="15" font-weight="700" fill="${t(f, 550)}">${theme}</text>
    </g>`;
  });
  writeFileSync(OUT + "couvertures.svg", s + "</svg>");
}

// --- 5. figure gabarit (copie) + précédent RESP (copie) ---
copyFileSync("/Users/lucaspoulain/Projects/nsp-labo/exports/web/figures/enquete-hm_M1_D_x_E.svg", OUT + "figure-gabarit.svg");
copyFileSync("/Users/lucaspoulain/Projects/Dossier RESP-2025-livre-v8.2/Links/resp-2025-cartos-exports_effectifs-eleves.png", OUT + "resp-precedent.png");
console.log("assets écrits dans", OUT);

// --- 6. diagrammes de la présentation (remplacent Mermaid, rendu garanti) ---
{
  const boite = (x, y, w, h, fill, stroke, lignes, tCol = "#fff", fs = 15) => {
    let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    lignes.forEach((l, i) => {
      g += `<text x="${x + w / 2}" y="${y + h / 2 + (i - (lignes.length - 1) / 2) * 20 + 5}" text-anchor="middle" fill="${tCol}" font-size="${fs}" font-weight="${i === 0 ? 700 : 400}">${l}</text>`;
    });
    return g;
  };
  const fleche = (x1, y1, x2, y2, col, dash = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ""} marker-end="url(#fl)"/>`;
  const defs = (col) => `<defs><marker id="fl" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="${col}"/></marker></defs>`;
  const gris = t("ardoise", 500), encre = t("ardoise", 800);

  // archipel : 5 sites, aucune brique commune
  {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 330" font-family="system-ui">`;
    s += boite(330, 125, 240, 80, t("petrole", 600), t("petrole", 750), ["nosservicespublics.fr", "Umso, no-code"]);
    const sats = [
      [30, 20, t("coquelicot", 500), ["Printemps", "Kirby"]],
      [640, 20, t("lavande", 550), ["Municipales 2026", "Kirby"]],
      [30, 230, t("ambre", 550), ["Comparateur", "Next.js"]],
      [640, 230, t("prairie", 600), ["Cartes RESP", "Vue + D3"]],
    ];
    for (const [x, y, c, l] of sats) s += boite(x, y, 230, 80, "#fff", c, l, c);
    s += `<line x1="270" y1="90" x2="345" y2="135" stroke="${gris}" stroke-width="2" stroke-dasharray="5 5"/>`;
    s += `<line x1="630" y1="90" x2="555" y2="135" stroke="${gris}" stroke-width="2" stroke-dasharray="5 5"/>`;
    s += `<line x1="270" y1="245" x2="345" y2="195" stroke="${gris}" stroke-width="2" stroke-dasharray="5 5"/>`;
    s += `<line x1="630" y1="245" x2="555" y2="195" stroke="${gris}" stroke-width="2" stroke-dasharray="5 5"/>`;
    s += `<text x="450" y="322" text-anchor="middle" fill="${gris}" font-size="15" font-style="italic">liens croisés, aucune brique commune</text>`;
    writeFileSync(OUT + "diagramme-archipel.svg", s + "</svg>");
  }

  // moteur unique
  {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 300" font-family="system-ui">${defs(gris)}`;
    s += boite(20, 100, 280, 100, t("petrole", 600), t("petrole", 750), ["Un moteur unique", "base du site Printemps,", "consolidée"], "#fff", 14);
    const cibles = [
      [20, t("canard", 600), ["Vitrine et publications", "galerie des productions"]],
      [115, t("framboise", 550), ["Formations"]],
      [210, gris, ["À terme :", "espace membre"]],
    ];
    for (const [y, c, l] of cibles) {
      s += boite(560, y, 320, 80, "#fff", c, l, c, 14);
      s += fleche(300, 150, 552, y + 40, gris);
    }
    writeFileSync(OUT + "diagramme-moteur.svg", s + "</svg>");
  }

  // chaîne des rapports
  {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 300" font-family="system-ui">${defs(gris)}`;
    s += boite(10, 30, 250, 90, "#fff", t("petrole", 600), ["Google Docs", "rédaction, commentaires :", "inchangés"], t("petrole", 700), 14);
    s += boite(10, 180, 250, 90, "#fff", t("canard", 600), ["Chaîne d'analyse R", "les figures : inchangée"], t("canard", 700), 14);
    s += boite(360, 30, 250, 90, t("petrole", 100), t("petrole", 400), ["Export structuré", "finitions automatiques"], encre, 14);
    s += boite(360, 180, 250, 90, t("canard", 100), t("canard", 400), ["Figures nommées", "toujours à jour"], encre, 14);
    s += boite(710, 30, 240, 90, t("coquelicot", 550), t("coquelicot", 700), ["PDF InDesign"]);
    s += boite(710, 180, 240, 90, t("lavande", 550), t("lavande", 700), ["Version web", "chapitrée"]);
    s += fleche(260, 75, 352, 75, gris) + fleche(260, 225, 352, 225, gris);
    s += fleche(610, 75, 702, 75, gris) + fleche(610, 225, 702, 225, gris);
    s += fleche(610, 100, 702, 205, gris) + fleche(610, 205, 702, 100, gris);
    writeFileSync(OUT + "diagramme-chaine.svg", s + "</svg>");
  }
}
console.log("diagrammes écrits");

// --- 7. échelles (séquentielle, catégorielle, divergente) ---
{
  const barre = (stops, w = 640, h = 90) => {
    const seg = w / stops.length;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">`;
    stops.forEach((c, i) => { s += `<rect x="${i * seg}" y="0" width="${seg + 0.5}" height="${h}" fill="${c}"/>`; });
    return s + "</svg>";
  };

  // séquentielle : une famille, du clair au foncé (mesure une intensité : durée, densité...)
  {
    const fam = t("petrole", 550) ? spectre.petrole : Object.values(spectre)[0];
    const idx = [1, 4, 7, 10, 13, 16]; // paliers 100 -> 850, six pas
    writeFileSync(OUT + "echelle-sequentielle.svg", barre(idx.map((i) => fam[i])));
  }

  // catégorielle : le jeu validé daltonisme du scénario retenu (bestCategorical)
  {
    const catKey = CATEGORIEL[sc] ? sc : Object.keys(CATEGORIEL)[0];
    const cat = bestCategorical(spectre, CATEGORIEL[catKey], { mode: "light", ps });
    writeFileSync(OUT + "echelle-categorielle.svg", barre(cat.ordered.map((c) => c.hex), 640, 90));
  }

  // divergente : deux pôles (coquelicot / canard) autour d'un pivot neutre (ardoise)
  {
    const neg = spectre.coquelicot, pos = spectre.canard ?? spectre.prairie, neutre = spectre.ardoise;
    const stops = [neg[11], neg[8], neg[4], neutre[1], pos[4], pos[8], pos[11]];
    writeFileSync(OUT + "echelle-divergente.svg", barre(stops));
  }
}

// --- 8. uniformément perceptible : OKLCH (clarté stable) contre HSL (clarté qui ment) ---
{
  const toRgbHex = (color) => formatHex(clampChroma(color, "rgb"));
  const hues = [25, 90, 145, 200, 260, 320]; // rouge, jaune, vert, cyan, bleu, violet
  const W = 640, cell = W / hues.length, rowH = 90;

  // Ligne OKLCH : même clarté perçue (l fixe), chroma tenu au maximum du gamut sRGB.
  const oklchRow = hues.map((h) => toRgbHex({ mode: "oklch", l: 0.72, c: 0.14, h }));
  // Ligne HSL : même "clarté" nominale (50%) mais la clarté PERÇUE varie fortement selon la teinte.
  const hslRow = hues.map((h) => toRgbHex({ mode: "hsl", h, s: 0.75, l: 0.5 }));

  const yTitle1 = 18, yRow1 = 28, yTitle2 = yRow1 + rowH + 26, yRow2 = yTitle2 + 10;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${yRow2 + rowH + 10}" font-family="system-ui">`;
  s += `<text x="0" y="${yTitle1}" font-size="15" font-weight="700" fill="#333">OKLCH — même clarté réglée, même clarté perçue</text>`;
  oklchRow.forEach((c, i) => { s += `<rect x="${i * cell}" y="${yRow1}" width="${cell - 3}" height="${rowH}" rx="4" fill="${c}"/>`; });
  s += `<text x="0" y="${yTitle2}" font-size="15" font-weight="700" fill="#333">HSL — même clarté réglée (50 %), clarté perçue très inégale</text>`;
  hslRow.forEach((c, i) => { s += `<rect x="${i * cell}" y="${yRow2}" width="${cell - 3}" height="${rowH}" rx="4" fill="${c}"/>`; });
  s += "</svg>";
  writeFileSync(OUT + "uniformite-oklch-hsl.svg", s);
}
console.log("échelles et démo perceptuelle écrites");
