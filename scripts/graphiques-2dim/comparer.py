"""Planche de comparaison ancien / remplaçant pour les graphiques du rapport : un graphique par ligne,
ancien à gauche, remplaçant à droite, tous deux mis à la même largeur.

Usage : python3 comparer.py <dossier des anciens SVG> [dossier des nouveaux, défaut sortie/] [PDF de sortie]
Requiert PyMuPDF (pip install pymupdf) et rsvg-convert (brew install librsvg) ; les fontes Poppins sont lues via fonts.conf.
La correspondance id → nom de fichier vient de catalogue.mjs et catalogue-formes.mjs.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import pymupdf

ICI = Path(__file__).parent
ancien = Path(sys.argv[1])
nouveau = Path(sys.argv[2]) if len(sys.argv) > 2 else ICI / "sortie"
sortie = Path(sys.argv[3]) if len(sys.argv) > 3 else ICI / "comparaison-graphiques.pdf"
blocs = json.loads((ICI / "blocs.json").read_text(encoding="utf-8"))

mapping = []
for nom in ("catalogue.mjs", "catalogue-formes.mjs"):
    for m in re.finditer(r'\{id: "(G\d+)"[^}]*?fichier: "([^"]+)"', (ICI / nom).read_text(encoding="utf-8")):
        mapping.append(m.groups())
mapping.sort(key=lambda m: int(m[0][1:]))

env = dict(os.environ, FONTCONFIG_FILE=str(ICI / "fonts.conf"))
tmp = Path(tempfile.mkdtemp(prefix="comparaison-"))


def rendre(svg, png):
    subprocess.run(["rsvg-convert", "-z", "2", "-b", "white", str(svg), "-o", str(png)], check=True, env=env)
    return png, pymupdf.Pixmap(str(png))


W, H, M, G = 842, 595, 24, 16
COL = (W - 2 * M - G) / 2
doc = pymupdf.open()


def page_neuve():
    p = doc.new_page(width=W, height=H)
    p.insert_text((M, 16), "Comparaison ancien (gauche) / remplaçant (droite), mis à la même largeur", fontsize=8, color=(0.4, 0.4, 0.4))
    return p, M


page, y = page_neuve()
for id_, f in mapping:
    if not (ancien / f).exists() or not (nouveau / f"{id_}.svg").exists():
        print(f"{id_} ignoré : fichier absent", file=sys.stderr)
        continue
    fa, a = rendre(ancien / f, tmp / f"a-{id_}.png")
    fn, n = rendre(nouveau / f"{id_}.svg", tmp / f"n-{id_}.png")
    ha, hn = COL * a.height / a.width, COL * n.height / n.width
    if y + max(ha, hn) + 14 > H - M:
        page, y = page_neuve()
    b = blocs.get(f, {})
    page.insert_text((M, y + 8), f"{id_}  p{b.get('page', '?')}  {f}   ancien {a.width // 2} × {a.height // 2} pt   remplaçant {n.width // 2} × {n.height // 2} pt", fontsize=7)
    y += 12
    page.insert_image(pymupdf.Rect(M, y, M + COL, y + ha), filename=str(fa))
    page.insert_image(pymupdf.Rect(M + COL + G, y, M + 2 * COL + G, y + hn), filename=str(fn))
    page.draw_line((M + COL + G / 2, y), (M + COL + G / 2, y + max(ha, hn)), color=(0.85, 0.85, 0.85), width=0.4)
    y += max(ha, hn) + 10
    page.draw_line((M, y - 4), (W - M, y - 4), color=(0.9, 0.9, 0.9), width=0.4)

doc.set_metadata({"title": "Comparaison des graphiques du rapport"})
doc.save(str(sortie), deflate=True, garbage=4)
print(sortie, doc.page_count, "pages")
