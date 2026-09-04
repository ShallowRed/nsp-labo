#!/usr/bin/env python3
"""Soft proof of the spectrum through a CMYK press profile (Coated FOGRA39 by default).

For each of the 19 steps of every family: the CMYK separation InDesign would produce (relative colorimetric
with black point compensation, its default for RGB to CMYK), the sRGB appearance of that
separation, and the CIEDE2000 distance between the two, which flags the colours the press
cannot reproduce.

Usage: epreuve-cmjn.py [--profile path.icc] [--intent relative|perceptual]
Writes exports/spectre/epreuve-cmjn.csv and exports/spectre/epreuve-cmjn.html.
Requires Pillow (python3 -m venv .venv && .venv/bin/pip install pillow).
"""
import argparse
import csv
import math
from pathlib import Path

from PIL import Image, ImageCms

ROOT = Path(__file__).resolve().parent.parent
FOGRA39 = "/Library/Application Support/Adobe/Color/Profiles/Recommended/CoatedFOGRA39.icc"
INTENTS = {"relative": ImageCms.Intent.RELATIVE_COLORIMETRIC, "perceptual": ImageCms.Intent.PERCEPTUAL}


def srgb_to_lab(hex_):
    r, g, b = (int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = lin(r), lin(g), lin(b)
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def ciede2000(lab1, lab2):
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2)
    Cm = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
    a1p, a2p = a1 * (1 + G), a2 * (1 + G)
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h = lambda a, b: (math.degrees(math.atan2(b, a)) % 360) if (a or b) else 0
    h1p, h2p = h(a1p, b1), h(a2p, b2)
    dLp, dCp = L2 - L1, C2p - C1p
    if C1p * C2p == 0:
        dhp = 0
    elif abs(h2p - h1p) <= 180:
        dhp = h2p - h1p
    else:
        dhp = h2p - h1p - 360 if h2p > h1p else h2p - h1p + 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2))
    Lm, Cmp = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0:
        hm = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hm = (h1p + h2p) / 2
    else:
        hm = (h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hm - 30)) + 0.24 * math.cos(math.radians(2 * hm))
         + 0.32 * math.cos(math.radians(3 * hm + 6)) - 0.20 * math.cos(math.radians(4 * hm - 63)))
    SL = 1 + 0.015 * (Lm - 50) ** 2 / math.sqrt(20 + (Lm - 50) ** 2)
    SC = 1 + 0.045 * Cmp
    SH = 1 + 0.015 * Cmp * T
    RT = -2 * math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7)) * math.sin(math.radians(60 * math.exp(-(((hm - 275) / 25) ** 2))))
    return math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default=FOGRA39)
    ap.add_argument("--intent", choices=INTENTS, default="relative")
    args = ap.parse_args()

    rows = list(csv.DictReader(open(ROOT / "exports/spectre/spectre-nsp.csv")))
    srgb = ImageCms.createProfile("sRGB")
    cmyk = ImageCms.getOpenProfile(args.profile)
    intent = INTENTS[args.intent]
    flags = ImageCms.Flags.BLACKPOINTCOMPENSATION
    to_cmyk = ImageCms.buildTransform(srgb, cmyk, "RGB", "CMYK", renderingIntent=intent, flags=flags)
    to_rgb = ImageCms.buildTransform(cmyk, srgb, "CMYK", "RGB", renderingIntent=intent, flags=flags)

    img = Image.new("RGB", (len(rows), 1))
    img.putdata([tuple(int(r["hex"][i:i + 2], 16) for i in (1, 3, 5)) for r in rows])
    sep = ImageCms.applyTransform(img, to_cmyk)
    proof = ImageCms.applyTransform(sep, to_rgb)

    out = []
    for i, r in enumerate(rows):
        c, m, y, k = (round(v / 2.55) for v in sep.getpixel((i, 0)))
        p = "#%02X%02X%02X" % proof.getpixel((i, 0))
        de = ciede2000(srgb_to_lab(r["hex"]), srgb_to_lab(p))
        out.append({**r, "C": c, "M": m, "Y": y, "K": k, "hex epreuve": p, "dE2000": round(de, 1)})

    name = ImageCms.getProfileDescription(cmyk).strip()
    with open(ROOT / "exports/spectre/epreuve-cmjn.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["famille", "palier", "hex", "C", "M", "Y", "K", "hex epreuve", "dE2000"], extrasaction="ignore")
        w.writeheader()
        w.writerows(out)

    fams = list(dict.fromkeys(r["famille"] for r in out))
    cell = lambda r: (f'<td><div class="pair"><span style="background:{r["hex"]}"></span><span style="background:{r["hex epreuve"]}"></span></div>'
                      f'<small class="{"warn" if r["dE2000"] >= 5 else ""}">{r["palier"]} · ΔE {r["dE2000"]}<br>{r["C"]} {r["M"]} {r["Y"]} {r["K"]}</small></td>')
    table = "".join(f'<tr><th>{f}</th>{"".join(cell(r) for r in out if r["famille"] == f and r["palier nomme"] == "oui")}</tr>' for f in fams)
    html = f"""<!doctype html><meta charset="utf-8"><title>Épreuve CMJN du spectre</title>
<style>body{{margin:0;padding:24px 28px;background:#fff;font:13px/1.35 Poppins,system-ui,sans-serif;color:#141516;width:1010px}}
h1{{font-size:17px;margin:0 0 4px;color:#0F2E3D}}p{{margin:0 0 14px;color:#515C63;font-size:12px}}table{{border-collapse:separate;border-spacing:4px 6px}}
th{{text-align:left;font-weight:500;padding-right:6px;font-size:12px}}td{{width:80px;vertical-align:top}}.pair{{display:flex;height:34px;border-radius:4px;overflow:hidden}}
.pair span{{flex:1}}small{{display:block;font-size:9px;color:#515C63;margin-top:2px;font-family:ui-monospace,monospace}}small.warn{{color:#C24146;font-weight:600}}</style>
<h1>Épreuve écran du spectre en CMJN · {name}, {args.intent}</h1>
<p>Chaque case : à gauche la couleur sRGB, à droite son rendu après séparation CMJN. En dessous, l'écart ΔE2000 et la séparation C M J N en %. En rouge, les écarts perceptibles au-delà de 5.</p>
<table>{table}</table>"""
    (ROOT / "exports/spectre/epreuve-cmjn.html").write_text(html)
    worst = sorted(out, key=lambda r: -r["dE2000"])[:8]
    print(f"{name} · {args.intent} : {sum(r['dE2000'] >= 5 for r in out)} couleurs sur {len(out)} à ΔE ≥ 5")
    for r in worst:
        print(f"  {r['famille']:11s} {r['palier']:>4} {r['hex']} → {r['hex epreuve']}  ΔE {r['dE2000']}")


if __name__ == "__main__":
    main()
