// Générateur et outils d'audit du spectre de couleurs NSP.
// Tout est en OKLCH via culori ; les contrôles (contraste, daltonisme) sont calculés, jamais estimés.
import {
  converter,
  formatHex,
  clampChroma,
  wcagContrast,
  differenceCiede2000,
  parse,
} from "culori";

const toOklch = converter("oklch");
const toRgb = converter("rgb");
export const dE = differenceCiede2000();

export const PETROLE_NSP = "#06708e"; // logo NSP 2025, référence de continuité

// ---------------------------------------------------------------------------
// Paliers
// ---------------------------------------------------------------------------
export function paliers(n = 19) {
  if (n === 19) return Array.from({ length: 19 }, (_, i) => 50 + i * 50);
  if (n === 11) return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  throw new Error(`paliers(${n}) non supporté (19 ou 11)`);
}

// ---------------------------------------------------------------------------
// Profils de chroma : t dans [0,1] (position dans l'échelle), retourne un
// facteur [0,1] appliqué au chroma de base de la famille.
// ---------------------------------------------------------------------------
export const PROFILS = {
  cloche: (t) => Math.sin(Math.PI * Math.min(1, Math.max(0, t)) ** 0.85),
  plateau: (t) => Math.min(1, 1.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)) ** 0.85)),
  constant: () => 0.85,
};

// ---------------------------------------------------------------------------
// Génération
// ---------------------------------------------------------------------------
export function genScale({ H, k = 1 }, opts = {}) {
  const {
    n = 19,
    L0 = 0.97,
    L1 = 0.15,
    profil = "cloche",
    kGlobal = 1,
    cBase = 0.17,
  } = opts;
  const ps = paliers(n);
  const fp = typeof profil === "function" ? profil : PROFILS[profil];
  return ps.map((p, i) => {
    const t = (i + 1) / ps.length;
    const L = L0 + (L1 - L0) * (i / (ps.length - 1));
    const C = cBase * k * kGlobal * fp(t);
    return formatHex(toRgb(clampChroma({ mode: "oklch", l: L, c: C, h: H }, "rgb")));
  });
}

export function genSpectre(scenario, overrides = {}) {
  const opts = { ...scenario.options, ...overrides };
  return Object.fromEntries(
    Object.entries(scenario.familles).map(([name, f]) => [name, genScale(f, opts)])
  );
}

// ---------------------------------------------------------------------------
// Mesures
// ---------------------------------------------------------------------------
export function okOf(hex) {
  const o = toOklch(parse(hex));
  return { L: o.l ?? 0, C: o.c ?? 0, H: o.h ?? null };
}

export function aaOnWhite(scale, ps) {
  const i = scale.findIndex((h) => wcagContrast(h, "#ffffff") >= 4.5);
  return i < 0 ? null : ps[i];
}

// contraste minimal garanti pour un écart de crans donné, toutes familles confondues
export function garanties(spectre, ecarts = [6, 8, 10, 12, 14]) {
  const scales = Object.values(spectre);
  const n = scales[0].length;
  return ecarts
    .filter((d) => d < n)
    .map((d) => {
      let min = Infinity;
      for (const s of scales)
        for (let i = 0; i + d < n; i++) min = Math.min(min, wcagContrast(s[i], s[i + d]));
      return { ecartCrans: d, contrasteMin: +min.toFixed(2) };
    });
}

// continuité avec le bleu pétrole NSP : la couleur du spectre la plus proche du
// logo (dE2000), et la part des familles à moins de 45° de sa teinte.
export function continuite(spectre, ref = PETROLE_NSP) {
  let best = { dE: Infinity };
  for (const [fam, scale] of Object.entries(spectre))
    for (let i = 0; i < scale.length; i++) {
      const d = dE(scale[i], ref);
      if (d < best.dE) best = { dE: d, famille: fam, index: i, hex: scale[i] };
    }
  const hRef = okOf(ref).H;
  const fams = Object.entries(spectre).map(([fam, scale]) => {
    const h = okOf(scale[Math.floor(scale.length / 2)]).H;
    let dH = Math.abs(h - hRef);
    if (dH > 180) dH = 360 - dH;
    return { fam, dH };
  });
  const proches = fams.filter((f) => f.dH < 45).length;
  return {
    dEmin: +best.dE.toFixed(1),
    porteur: best.famille,
    hex: best.hex,
    famillesProches: proches,
    partProche: +(proches / fams.length).toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// Daltonisme : matrices de Viénot (protan, deutan) et Brettel approx (tritan)
// ---------------------------------------------------------------------------
const MAT = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const unlin = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function simulate(hex, mode) {
  if (mode === "normal") return hex;
  const { r, g, b } = toRgb(parse(hex));
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const M = MAT[mode];
  const o = [0, 1, 2].map((i) =>
    Math.min(1, Math.max(0, M[i][0] * R + M[i][1] * G + M[i][2] * B))
  );
  return formatHex({ mode: "rgb", r: unlin(o[0]), g: unlin(o[1]), b: unlin(o[2]) });
}

// ---------------------------------------------------------------------------
// Catégoriel sous contraintes (bande de clarté, plancher de chroma), avec
// recherche de l'ordre des séries maximisant la séparation des paires adjacentes.
// ---------------------------------------------------------------------------
export const BANDES = { light: [0.43, 0.77], dark: [0.48, 0.67] };
export const CHROMA_PLANCHER = 0.1;

// maxOptions borne le nombre de paliers candidats par famille (échantillonnage
// régulier) pour rester fluide dans un navigateur ; passer Infinity en CLI
// (scripts/check.mjs) pour la recherche exhaustive.
export function bestCategorical(spectre, hues, { mode = "light", ps, maxOptions = 4 } = {}) {
  const [lo, hi] = BANDES[mode];
  const lists = hues.map((h) => {
    const scale = spectre[h];
    if (!scale) throw new Error(`famille inconnue : ${h}`);
    let l = scale
      .map((hex, i) => ({ hex, i }))
      .filter(({ hex }) => {
        const o = okOf(hex);
        return o.L >= lo && o.L <= hi && o.C >= CHROMA_PLANCHER;
      });
    if (l.length > maxOptions) {
      const step = (l.length - 1) / (maxOptions - 1);
      l = Array.from({ length: maxOptions }, (_, j) => l[Math.round(j * step)]);
    }
    return l;
  });
  if (lists.some((l) => l.length === 0))
    return { infaisable: hues.filter((_, i) => lists[i].length === 0) };

  const modes = ["normal", "protan", "deutan", "tritan"];
  // précalcul : simulations et objets couleur parsés, une fois par option
  for (const l of lists)
    for (const o of l) {
      o.simHex = {};
      o.simObj = {};
      for (const m of modes) {
        const s = simulate(o.hex, m);
        o.simHex[m] = s;
        o.simObj[m] = parse(s);
      }
    }

  let best = { score: -Infinity, combo: null };
  const combo = [];
  const rec = (idx) => {
    if (idx === hues.length) {
      let worst = Infinity;
      for (const m of modes)
        for (let i = 0; i < combo.length && worst > best.score; i++)
          for (let j = i + 1; j < combo.length; j++) {
            const d = dE(combo[i].simObj[m], combo[j].simObj[m]);
            if (d < worst) worst = d;
          }
      if (worst > best.score) best = { score: worst, combo: [...combo] };
      return;
    }
    for (const o of lists[idx]) {
      combo[idx] = o;
      rec(idx + 1);
    }
    combo.length = idx;
  };
  rec(0);

  // ordre optimal (paires adjacentes)
  const perms = [];
  const permute = (arr, cur = []) => {
    if (!arr.length) return void perms.push(cur);
    arr.forEach((v, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...cur, v]));
  };
  permute(hues.map((_, i) => i));
  let bestOrder = { score: -Infinity, p: null };
  for (const p of perms) {
    let worst = Infinity;
    for (const m of modes)
      for (let k = 0; k + 1 < p.length; k++)
        worst = Math.min(
          worst,
          dE(best.combo[p[k]].simObj[m], best.combo[p[k + 1]].simObj[m])
        );
    if (worst > bestOrder.score) bestOrder = { score: worst, p };
  }
  return {
    allPairsMinDE: +best.score.toFixed(1),
    adjacentMinDE: +bestOrder.score.toFixed(1),
    ordered: bestOrder.p.map((i) => ({
      famille: hues[i],
      palier: ps ? ps[best.combo[i].i] : best.combo[i].i,
      hex: best.combo[i].hex,
      sims: best.combo[i].simHex,
    })),
  };
}
