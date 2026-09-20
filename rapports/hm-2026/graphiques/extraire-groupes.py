"""Reconstitue les données d'un graphique à barres groupées (une série par couleur, un item par ligne) depuis son SVG.

La valeur de chaque barre est lue dans l'étiquette « 92 % » posée à son extrémité ; la série vient de la légende
(carré de couleur et texte voisin) ; l'item vient des textes à gauche des barres, regroupés par ligne.
Écrit <id>_groupes.csv : item;serie;valeur, dans l'ordre d'apparition.

Usage : python3 extraire-groupes.py <svg> <id> <dossier de sortie>
"""

import csv
import re
import sys
from pathlib import Path

sys.argv, argv = [sys.argv[0], sys.argv[1], "X", "/tmp/claude-501/x"], list(sys.argv)
exec(open(Path(__file__).with_name("extraire-svg.py"), encoding="utf-8").read().split("# légende")[0])
ident, sortie = argv[2], Path(argv[3])
sortie.mkdir(parents=True, exist_ok=True)

carres = [r for r in rects if abs(r["w"] - r["h"]) < 0.6]
barres = [r for r in rects if r not in carres]
haut_barre = min(r["h"] for r in barres)

# légende : texte à droite du carré sur la même ligne, sinon texte juste en dessous
legende = {}
for c in sorted(carres, key=lambda c: (c["y"], c["x"])):
    droite = [t for t in textes if t["x"] > c["x"] + c["w"] and c["y"] - c["h"] * 0.3 <= t["y"] <= c["y"] + c["h"] * 1.4 and t["x"] - c["x"] < c["w"] * 6]
    dessous = [t for t in textes if abs(t["x"] - c["x"]) < c["w"] * 4 and c["y"] + c["h"] < t["y"] < c["y"] + c["h"] * 4]
    cand = droite or dessous
    if cand:
        legende.setdefault(c["fill"], min(cand, key=lambda t: abs(t["x"] - c["x"]) + abs(t["y"] - c["y"]))["t"])
ordre_series = list(legende.values())

# lignes d'items : autant de barres consécutives que de séries
barres.sort(key=lambda r: r["y"])
n = len(legende) or 1
items = [barres[i:i + n] for i in range(0, len(barres), n)]
gauche = min(r["x"] for r in barres)


def valeur(r):
    """étiquette numérique la plus proche à droite de l'extrémité de la barre"""
    fin = r["x"] + r["w"]
    cand = [t for t in textes if re.fullmatch(r"\d+ ?%?", t["t"]) and t["x"] >= fin - 2 and abs(t["y"] - (r["y"] + r["h"] * 0.9)) < r["h"] * 1.2 and t["x"] - fin < 30]
    if not cand:
        return None
    return int(re.sub(r"\D", "", min(cand, key=lambda t: t["x"] - fin)["t"]))


# libellés d'item : textes à gauche des barres, affectés à l'item le plus proche
centres = [(sum(r["y"] for r in it) / len(it) + haut_barre / 2) for it in items]
labels = [[] for _ in items]
haut_items = min(r["y"] for r in barres) - haut_barre
for t in textes:
    if t["x"] < gauche - 2 and t["y"] > haut_items and not re.fullmatch(r"\d+ ?%?", t["t"]):
        i = min(range(len(items)), key=lambda i: abs(t["y"] - centres[i]))
        if abs(t["y"] - centres[i]) < haut_barre * len(items[i]) * 2.2:
            labels[i].append(t)

lignes = []
for it, lab in zip(items, labels):
    nom = " ".join(t["t"] for t in sorted(lab, key=lambda t: (t["y"], t["x"])))
    for r in sorted(it, key=lambda r: r["y"]):
        lignes.append((nom, legende.get(r["fill"], r["fill"]), valeur(r), r["fill"]))

with open(sortie / f"{ident}_groupes.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["item", "serie", "valeur", "couleur"])
    w.writerows(lignes)
print(f"{ident} : {len(items)} items × {len(ordre_series)} séries {ordre_series}")
for l in lignes:
    print(f"  {l[0][:40]:40} {l[1]:14} {l[2]}")
