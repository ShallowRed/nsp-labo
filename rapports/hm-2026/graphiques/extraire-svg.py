"""Reconstitue les données d'un graphique à barres empilées à partir de son SVG (export Illustrator ou svglite de R).

Les largeurs des rectangles donnent les pourcentages ; les libellés de ligne, d'intitulé de groupe et de légende
sont lus dans les textes voisins. Écrit un CSV par groupe au format des exports R (v1 réponse, v2 modalité, pct).

La colonne v1 reçoit la couleur du segment ; le catalogue la traduit en réponse via le jeu de couleurs du graphique.
Usage : python3 extraire-svg.py <svg> <id> <dossier de sortie> [--tailles 2,2,2]  (découpage en groupes quand aucun intitulé gras ne les sépare)
"""

import csv
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

svg_path, ident, sortie = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
tailles = [int(n) for n in sys.argv[sys.argv.index("--tailles") + 1].split(",")] if "--tailles" in sys.argv else None
sortie.mkdir(parents=True, exist_ok=True)
racine = ET.parse(svg_path).getroot()
NS = "{http://www.w3.org/2000/svg}"

# feuille de style interne (Illustrator)
css = {}
for style in racine.iter(NS + "style"):
    for bloc in re.finditer(r"([^{}]+)\{([^}]*)\}", style.text or ""):
        props = dict(p.split(":", 1) for p in bloc.group(2).replace("\n", "").split(";") if ":" in p)
        for cl in bloc.group(1).split(","):
            css.setdefault(cl.strip().lstrip("."), {}).update({k.strip(): v.strip() for k, v in props.items()})


def proprietes(el):
    """propriétés de style d'un élément : classes CSS, attribut style, attributs directs"""
    p = {}
    for cl in el.get("class", "").split():
        p.update(css.get(cl, {}))
    p.update({k.strip(): v.strip() for k, v in (s.split(":", 1) for s in el.get("style", "").split(";") if ":" in s)})
    for k in ("fill", "font-weight", "font-family", "font-size"):
        if el.get(k):
            p[k] = el.get(k)
    return p


def nombre(v):
    return float(str(v).replace("px", "")) if v not in (None, "") else 0.0


def transforme(t, x, y, sx=1, sy=1):
    """applique une chaîne transform (translate, matrix, scale) à un point et à des facteurs d'échelle"""
    for m in re.finditer(r"(translate|matrix|scale)\(([^)]*)\)", t or ""):
        v = [float(n) for n in re.split(r"[ ,]+", m.group(2).strip())]
        if m.group(1) == "translate":
            x, y = x + v[0], y + (v[1] if len(v) > 1 else 0)
        elif m.group(1) == "matrix":
            x, y = v[0] * x + v[2] * y + v[4], v[1] * x + v[3] * y + v[5]
            sx, sy = sx * v[0], sy * v[3]
        elif m.group(1) == "scale":
            f = v[0], (v[1] if len(v) > 1 else v[0])
            x, y, sx, sy = x * f[0], y * f[1], sx * f[0], sy * f[1]
    return x, y, sx, sy


textes, rects = [], []


def parcourir(el, transforms):
    tr = transforms + [el.get("transform", "")]
    tag = el.tag.replace(NS, "")
    if tag == "text":
        # sans x/y sur le text, la position est portée par le premier tspan
        premier = next(iter(el.iter(NS + "tspan")), None)
        x, y, sx, sy = nombre(el.get("x") or (premier.get("x") if premier is not None else 0)), nombre(el.get("y") or (premier.get("y") if premier is not None else 0)), 1, 1
        for t in reversed(tr):
            x, y, sx, sy = transforme(t, x, y, sx, sy)
        contenu = re.sub(r"\s+", " ", "".join(el.itertext())).strip()
        p = proprietes(el)
        gras = "700" in p.get("font-weight", "") or "Bold" in p.get("font-family", "")
        if not gras:
            for ts in el.iter(NS + "tspan"):
                q = proprietes(ts)
                gras = gras or "700" in q.get("font-weight", "") or "Bold" in q.get("font-family", "")
        if contenu:
            textes.append({"x": x, "y": y, "t": contenu, "gras": gras, "taille": nombre(p.get("font-size", 0)) * sy})
        return
    if tag == "rect":
        x, y, sx, sy = nombre(el.get("x")), nombre(el.get("y")), 1, 1
        for t in reversed(tr):
            x, y, sx, sy = transforme(t, x, y, sx, sy)
        f = proprietes(el).get("fill", "").upper()
        if f.startswith("#") and f not in ("#FFF", "#FFFFFF"):
            f = "#" + "".join(c * 2 for c in f[1:]) if len(f) == 4 else f
            rects.append({"fill": f, "x": x, "y": y, "w": nombre(el.get("width")) * sx, "h": nombre(el.get("height")) * sy})
    for enfant in el:
        parcourir(enfant, tr)


parcourir(racine, [])

# légende : petits carrés, texte le plus proche à droite sur la même ligne
carres = [r for r in rects if abs(r["w"] - r["h"]) < 0.6 and r["w"] < 40]
legende = {}
for c in carres:
    cand = [t for t in textes if t["x"] > c["x"] and c["y"] - c["h"] * 0.3 <= t["y"] <= c["y"] + c["h"] * 1.4]
    if cand:
        legende[c["fill"]] = min(cand, key=lambda t: t["x"])["t"]
barres = [r for r in rects if r not in carres]

# lignes de barres : rectangles de même y
lignes = {}
for r in barres:
    cle = next((k for k in lignes if abs(k - r["y"]) < 0.6), None)
    lignes.setdefault(cle if cle is not None else r["y"], []).append(r)
bas_barres = max(r["y"] + r["h"] for r in barres)
gauche = min(r["x"] for r in barres)

# intitulés de groupe : textes gras au-dessus des lignes, fusionnés quand ils se suivent verticalement
gras_txt = sorted([t for t in textes if t["gras"] and t["y"] < bas_barres and t["x"] < gauche + 5], key=lambda t: t["y"])
intitules = []
for t in gras_txt:
    if intitules and t["y"] - intitules[-1]["y2"] < t["taille"] * 1.6:
        intitules[-1]["t"] += " " + t["t"]
        intitules[-1]["y2"] = t["y"]
    else:
        intitules.append({"t": t["t"], "y": t["y"], "y2": t["y"]})

# libellés de ligne : chaque texte à gauche des barres rejoint la ligne dont le centre est le plus proche
ys = sorted(lignes)
centres = {y: y + lignes[y][0]["h"] * 0.55 for y in ys}
labels = {y: [] for y in ys}
for t in textes:
    if t["x"] < gauche and not t["gras"] and ys[0] - 20 < t["y"] < bas_barres + 6:
        y = min(ys, key=lambda y: abs(t["y"] - centres[y]))
        if abs(t["y"] - centres[y]) < lignes[y][0]["h"] * 1.2:
            labels[y].append(t)
resultat = []
for y in ys:
    segs = sorted(lignes[y], key=lambda r: r["x"])
    h = segs[0]["h"]
    total = sum(r["w"] for r in segs)
    label = " ".join(t["t"] for t in sorted(labels[y], key=lambda t: t["y"]))
    groupe = next((it["t"] for it in reversed(intitules) if it["y"] < y + h / 2), "")
    resultat.append({"groupe": groupe, "modalite": label, "segments": [(r["fill"], r["w"] / total * 100) for r in segs]})
if tailles:
    i = 0
    for n, taille in enumerate(tailles, 1):
        for l in resultat[i:i + taille]:
            l["groupe"] = f"groupe {n}"
        i += taille

groupes = list(dict.fromkeys(l["groupe"] for l in resultat))
for n, g in enumerate(groupes, 1):
    suffixe = f"_{n}" if len(groupes) > 1 else ""
    with open(sortie / f"{ident}_extrait{suffixe}.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";", quoting=csv.QUOTE_NONNUMERIC)
        w.writerow(["", "v1", "v2", "eff", "total_v2", "pct", "couleur_texte"])
        i = 1
        for l in [l for l in resultat if l["groupe"] == g]:
            for reponse, pct in l["segments"]:
                w.writerow([str(i), reponse, l["modalite"], "", "", f"{pct:.3f}".replace(".", ","), ""])
                i += 1
    print(f"{ident} groupe {n} « {g} » : {sum(1 for l in resultat if l['groupe'] == g)} lignes")
print("légende :", legende)
for l in resultat:
    print(f"  [{l['groupe'][:26]}] {l['modalite'][:34]:34} " + " | ".join(f"{legende.get(r, r)[:14]} {p:.0f}" for r, p in l["segments"]))
