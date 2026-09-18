"""Extrait les données des graphiques en forêt des annexes à partir des SVG svglite.

Pour chaque modalité : groupe de variable et sa référence, libellé, cote relative lue
sur la position du point, bornes de l'intervalle de confiance lues sur le segment
horizontal, significativité lue sur le remplissage du point (blanc = non significatif),
et valeur écrite, qui sert de contrôle.
"""
import csv
import html
import re
import sys
from pathlib import Path


def lire(chemin):
    t = Path(chemin).read_text(encoding="utf8")
    textes = []
    for m in re.finditer(r"<text([^>]*)>(.*?)</text>", t, re.S):
        a = m.group(1)
        x = re.search(r"\bx='([\d.]+)'", a)
        y = re.search(r"\by='([\d.]+)'", a)
        if not (x and y):
            continue
        textes.append({
            "x": float(x.group(1)), "y": float(y.group(1)),
            "gras": "bold" in a.lower() or "700" in a,
            "fin": "end" in a, "milieu": "middle" in a,
            "taille": float(re.search(r"font-size:\s*([\d.]+)", a).group(1)),
            "texte": html.unescape(re.sub(r"<[^>]+>", "", m.group(2))).strip(),
        })
    cercles = [(float(cx), float(cy), "fill: #FFFFFF" not in s)
               for cx, cy, s in re.findall(r"<circle cx='([\d.]+)' cy='([\d.]+)' r='[\d.]+' style='([^']*)'", t)]
    segments = []
    for pts, st in re.findall(r"<polyline points='([^']*)' style='([^']*)'", t):
        p = [tuple(map(float, q.split(","))) for q in pts.split()]
        if len(p) == 2 and abs(p[0][1] - p[1][1]) < 0.01 and "stroke:" not in st:
            segments.append((min(p[0][0], p[1][0]), max(p[0][0], p[1][0]), p[0][1]))

    graduations = sorted((tx["x"], float(tx["texte"])) for tx in textes
                         if tx["gras"] and tx["milieu"] and re.fullmatch(r"-?\d+(\.\d+)?", tx["texte"]))
    (x0, v0), (x1, v1) = graduations[0], graduations[-1]
    valeur = lambda x: v0 + (x - x0) * (v1 - v0) / (x1 - x0)

    titre = max((tx for tx in textes if not tx["gras"] and not tx["fin"] and tx["y"] < 25), key=lambda tx: tx["taille"])["texte"]
    sous_titre = next(tx["texte"] for tx in textes if "Cotes relatives" in tx["texte"])
    axe = next(tx["texte"] for tx in textes if tx["gras"] and tx["milieu"] and not re.fullmatch(r"-?\d+(\.\d+)?", tx["texte"]))

    # en-têtes de groupe : textes gras alignés à gauche, lignes consécutives fusionnées
    lignes = sorted((tx for tx in textes if tx["gras"] and not tx["milieu"] and not tx["fin"]), key=lambda tx: tx["y"])
    groupes = []
    for tx in lignes:
        if groupes and tx["y"] - groupes[-1]["y_fin"] < 11.5 and not groupes[-1]["texte"].endswith(")"):
            groupes[-1]["texte"] += " " + tx["texte"]
            groupes[-1]["y_fin"] = tx["y"]
        else:
            groupes.append({"y": tx["y"], "y_fin": tx["y"], "texte": tx["texte"]})

    modalites = [tx for tx in textes if tx["fin"] and not tx["gras"]]
    valeurs = [tx for tx in textes if not tx["gras"] and not tx["fin"] and not tx["milieu"] and re.fullmatch(r"\d+\.\d", tx["texte"])]

    lignes_sortie, alertes = [], []
    for cx, cy, significatif in sorted(cercles, key=lambda c: c[1]):
        mod = min(modalites, key=lambda tx: abs(tx["y"] - (cy + 3.58)))
        ecrite = min(valeurs, key=lambda tx: abs(tx["y"] - (cy + 3.59)))
        seg = min(segments, key=lambda s: abs(s[2] - cy))
        grp = [g for g in groupes if g["y"] <= mod["y"] + 2][-1]
        m = re.match(r"(.*?)\s*\(ref\.\s*(.*)\)\s*$", grp["texte"])
        variable, reference = (m.group(1), m.group(2)) if m else (grp["texte"], "")
        cote = valeur(cx)
        if abs(round(cote, 1) - float(ecrite["texte"])) > 0.051:
            alertes.append(f"{variable} / {mod['texte']} : écrit {ecrite['texte']}, position {cote:.3f}")
        lignes_sortie.append({
            "variable": variable, "reference": reference, "modalite": mod["texte"],
            "cote": round(cote, 3), "ic_bas": round(valeur(seg[0]), 3), "ic_haut": round(valeur(seg[1]), 3),
            "significatif": int(significatif), "cote_ecrite": ecrite["texte"],
        })
    for l in lignes_sortie:
        if l["significatif"] != int(not (l["ic_bas"] <= 1 <= l["ic_haut"])):
            alertes.append(f"{l['variable']} / {l['modalite']} : remplissage et intervalle en désaccord ({l['ic_bas']}–{l['ic_haut']})")
    return {"titre": titre, "sous_titre": sous_titre, "axe": axe, "lignes": lignes_sortie, "alertes": alertes}


if __name__ == "__main__":
    source, sortie = sys.argv[1], Path(sys.argv[2])
    d = lire(source)
    with sortie.open("w", newline="", encoding="utf8") as f:
        w = csv.DictWriter(f, fieldnames=list(d["lignes"][0].keys()))
        w.writeheader()
        w.writerows(d["lignes"])
    print(f"{Path(source).name} : « {d['titre']} », {len(d['lignes'])} modalités, {len(set(l['variable'] for l in d['lignes']))} variables")
    print("axe :", d["axe"])
    print("alertes :", d["alertes"] or "aucune")
