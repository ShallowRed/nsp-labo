#!/usr/bin/env python3
"""Dit quelles couleurs portent réellement un dossier de SVG, et de quelle génération
du spectre elles relèvent. Sert quand une passe de recoloration ne trouve rien.

Usage : diagnostic-svg.py <dossier> [fichier de correspondance]
        (par défaut rapports/hm-2026/indesign/svg-recolore.txt)
"""
import csv
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
NEUTRES = {"#FFFFFF", "#000000", "#EBEBEB", "#DEDEDE", "#B3B3B3", "#7F7F7F", "#4D4D4D", "#111111"}

# toutes les écritures de couleur qu'un SVG peut porter
MOTIF = re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*[\d.%\s,/]+\)", re.I)


def normalise(jeton):
    j = jeton.strip()
    if j.startswith("#"):
        h = j[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return "#" + h.upper()
    nombres = re.findall(r"[\d.]+%?", j)[:3]
    if len(nombres) < 3:
        return None
    canaux = []
    for n in nombres:
        v = float(n[:-1]) * 255 / 100 if n.endswith("%") else float(n)
        canaux.append(max(0, min(255, round(v))))
    return "#%02X%02X%02X" % tuple(canaux)


def table(chemin):
    return {r["hex"].upper(): f"{r['famille']} {r['palier']}" for r in csv.DictReader(open(chemin))}


def main():
    dossier = Path(sys.argv[1])
    corresp = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "rapports/hm-2026/indesign/svg-recolore.txt"
    courant = table(ROOT / "exports/spectre/spectre-nsp.csv")
    origine = table(ROOT / "rapports/hm-2026/indesign/spectre-origine.csv")
    cherchees = {}
    if corresp.exists():
        for ligne in corresp.read_text(encoding="utf8").splitlines():
            if ":" in ligne:
                a, b = ligne.strip().split(":")
                cherchees[a.upper()] = b.upper()

    fichiers = sorted(dossier.glob("*.svg"))
    comptes, par_ecriture = Counter(), Counter()
    for f in fichiers:
        texte = f.read_text(encoding="utf8", errors="ignore")
        for jeton in MOTIF.findall(texte):
            h = normalise(jeton)
            if h:
                comptes[h] += 1
                par_ecriture["rgb()" if jeton.lower().startswith("rgb") else
                              ("#abc" if len(jeton) == 4 else "#aabbcc")] += 1
    if not fichiers:
        print(f"aucun .svg dans {dossier}")
        return
    print(f"{len(fichiers)} fichiers, {sum(comptes.values())} couleurs écrites, "
          f"{len(comptes)} distinctes")
    print("écritures rencontrées : " + (", ".join(f"{k} {v}" for k, v in par_ecriture.most_common()) or "aucune"))

    bilan = Counter()
    lignes = []
    for h, n in comptes.most_common():
        if h in cherchees:
            etat, detail = "À REMPLACER", f"-> {cherchees[h]}"
        elif h in courant:
            etat, detail = "déjà courant", courant[h]
        elif h in origine:
            etat, detail = "origine, inchangée", origine[h]
        elif h in NEUTRES:
            etat, detail = "neutre", ""
        else:
            etat, detail = "hors spectre", ""
        bilan[etat] += n
        lignes.append((n, h, etat, detail))

    print("\n%-6s %-9s %-19s %s" % ("occ.", "couleur", "état", "palier"))
    for n, h, etat, detail in lignes[:25]:
        print("%-6d %-9s %-19s %s" % (n, h, etat, detail))
    if len(lignes) > 25:
        print(f"... et {len(lignes) - 25} autres couleurs distinctes")
    print("\nbilan : " + ", ".join(f"{k} {v}" for k, v in bilan.most_common()))
    if not bilan["À REMPLACER"]:
        if bilan["déjà courant"]:
            print("\nCes SVG portent déjà les valeurs courantes du spectre : il n'y a rien à recolorer.")
        elif bilan["hors spectre"]:
            print("\nAucune couleur du spectre reconnue : ces graphiques ne sortent pas de la chaîne habituelle.")


if __name__ == "__main__":
    main()
