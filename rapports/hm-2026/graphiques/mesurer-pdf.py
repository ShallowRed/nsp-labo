"""Mesure, dans un PDF exporté du rapport, chaque graphique dans son fond bleu : axe, fin du tracé, marges gauche et droite.
Usage : python3 mesurer-pdf.py <pdf> <première page> <dernière page> <json de sortie>
"""
import sys, json, re, collections
import pymupdf
FOND = (0.949, 0.979, 0.997)
GRIS = {(0.88, 0.907, 0.923)}  # E0E7EB ardoise 100 = NSP
CHART_FONTS = {("Poppins-Regular", 7.0), ("Poppins-Regular", 6.5), ("Poppins-Bold", 7.0), ("Poppins-Regular", 6.0), ("Poppins-Bold", 6.5)}
doc = pymupdf.open(sys.argv[1])
pages = range(int(sys.argv[2]), int(sys.argv[3]) + 1)
out = []
for pn in pages:
    page = doc[pn - 1]
    fonds, bars = [], []
    for d in page.get_drawings():
        f = d.get("fill"); r = d["rect"]
        if not f: continue
        f = tuple(round(c, 3) for c in f)
        if f == FOND and r.width > 150: fonds.append(r)
        elif f not in ((1.0, 1.0, 1.0),) and r.width < 500 and 2 < r.height < 120 and r.width > 0.5:
            # barres (dont segments gris NSP) et carrés de légende (exclus : carrés 8x8)
            if abs(r.width - r.height) < 0.6 and r.width < 12: continue
            bars.append(r)
    texts = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                if (s["font"], round(s["size"], 1)) in CHART_FONTS and s["text"].strip():
                    texts.append((pymupdf.Rect(s["bbox"]), s["text"], s["font"]))
    for fi, fond in enumerate(fonds):
        el = [("b", r, "") for r in bars if fond.contains(r)] + [("t", r, t) for r, t, f in texts if fond.contains(r)]
        if not el: continue
        el.sort(key=lambda e: e[1].y0)
        # clusters par trou vertical
        clusters, cur = [], [el[0]]
        for e in el[1:]:
            if e[1].y0 - max(x[1].y1 for x in cur) > 34: clusters.append(cur); cur = [e]
            else: cur.append(e)
        clusters.append(cur)
        for c in clusters:
            bb = [e[1] for e in c if e[0] == "b"]; tt = [e for e in c if e[0] == "t"]
            if not bb: continue
            axe = min(r.x0 for r in bb); fin = max(r.x1 for r in bb)
            tx0 = min(e[1].x0 for e in tt) if tt else axe; tx1 = max(e[1].x1 for e in tt) if tt else fin
            gauche_txt = [e[2] for e in tt if e[1].x0 < axe - 2 and e[1].x1 <= axe + 1]
            droite_txt = [e[2] for e in tt if e[1].x1 > fin + 2]
            out.append(dict(page=pn, fond=[round(fond.x0,1), round(fond.x1,1), round(fond.y0,1), round(fond.y1,1)], fond_l=round(fond.width,1),
                y=[round(min(e[1].y0 for e in c),1), round(max(e[1].y1 for e in c),1)],
                axe=round(axe,1), fin=round(fin,1), trace=round(fin-axe,1), tx0=round(tx0,1), tx1=round(tx1,1),
                marge_g=round(min(tx0, axe) - fond.x0, 1), marge_d=round(fond.x1 - max(tx1, fin), 1),
                axe_rel=round(axe - fond.x0, 1), fin_rel=round(fond.x1 - fin, 1),
                col=round(axe - tx0, 1), n_barres=len(bb), droite=sorted(set(droite_txt), key=len)[-3:]))
json.dump(out, open(sys.argv[4], "w"), ensure_ascii=False, indent=0)
for o in out:
    print(f"p{o['page']:>3} fond {o['fond_l']:>5} y {o['y'][0]:>5}-{o['y'][1]:>5}  axe@{o['axe_rel']:>6} fin@-{o['fin_rel']:>5} tracé {o['trace']:>5}  col {o['col']:>5}  margeG {o['marge_g']:>5} margeD {o['marge_d']:>5}  n={o['n_barres']:>3} droite={o['droite']}")
