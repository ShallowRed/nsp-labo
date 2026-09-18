"""Taille effective du texte des SVG une fois placés dans la maquette.

La taille lue sur un élément ne suffit pas : les exports R emboîtent les textes dans des
groupes portant une matrice d'échelle. Le script cumule les transformations de chaque
ancêtre, puis applique l'échelle de placement InDesign.
"""
import collections
import glob
import math
import re
import statistics
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

NS = "{http://www.w3.org/2000/svg}"


def echelle_transform(valeur):
    if not valeur:
        return 1.0
    facteur = 1.0
    for nom, args in re.findall(r"(matrix|scale)\s*\(([^)]*)\)", valeur):
        n = [float(x) for x in re.split(r"[,\s]+", args.strip()) if x]
        if nom == "matrix" and len(n) >= 4:
            facteur *= math.sqrt(abs(n[0] * n[3] - n[1] * n[2])) or 1.0
        elif nom == "scale":
            facteur *= abs(n[0]) if len(n) == 1 else math.sqrt(abs(n[0] * n[1]))
    return facteur


def taille_locale(el):
    for attribut in ("style", "font-size"):
        v = el.get(attribut)
        if not v:
            continue
        m = re.search(r"font-size:\s*([\d.]+)px", v) if attribut == "style" else re.match(r"([\d.]+)", v)
        if m:
            return float(m.group(1))
    return None


def tailles(chemin):
    racine = ET.parse(chemin).getroot()
    classes = {}
    for style in racine.iter(NS + "style"):
        for selecteurs, bloc in re.findall(r"([^{}]+)\{([^{}]*)\}", style.text or ""):
            m = re.search(r"font-size:\s*([\d.]+)px", bloc)
            if m:
                for s in selecteurs.split(","):
                    s = s.strip()
                    if s.startswith("."):
                        classes[s[1:]] = float(m.group(1))

    trouvees = []

    def parcours(el, facteur, heritee):
        facteur = facteur * echelle_transform(el.get("transform"))
        taille = taille_locale(el)
        if taille is None:
            for c in (el.get("class") or "").split():
                if c in classes:
                    taille = classes[c]
                    break
        taille = taille if taille is not None else heritee
        if el.tag == NS + "text" and taille:
            trouvees.append(taille * facteur)
        for enfant in el:
            parcours(enfant, facteur, taille)

    parcours(racine, 1.0, None)
    return trouvees


def placements(dossier_idml):
    out = []
    for f in glob.glob(str(Path(dossier_idml) / "Spreads" / "*.xml")):
        s = open(f, encoding="utf8").read()
        for m in re.finditer(r"<SVG\b[^>]*ItemTransform=\"([^\"]+)\"[^>]*>(.*?)</SVG>", s, re.S):
            lien = re.search(r'LinkResourceURI="([^"]*)"', m.group(2))
            if lien:
                nom = urllib.parse.unquote(lien.group(1)).split("/")[-1]
                out.append((nom, float(m.group(1).split()[0])))
    return out


if __name__ == "__main__":
    idml, links = sys.argv[1], Path(sys.argv[2])
    lignes = []
    for nom, echelle in placements(idml):
        p = links / nom
        if not p.exists():
            continue
        t = tailles(p)
        if not t:
            continue
        courante = collections.Counter(round(x, 2) for x in t).most_common(1)[0][0]
        lignes.append((courante * echelle, min(t) * echelle, max(t) * echelle, nom, echelle))
    lignes.sort()
    print(f"{'pt':>7}{'min':>7}{'max':>7}{'echelle':>9}  fichier")
    for c, mn, mx, nom, e in lignes:
        print(f"{c:>7.2f}{mn:>7.2f}{mx:>7.2f}{e:>9.3f}  {nom[:52]}")
    vals = [l[0] for l in lignes]
    print(f"\n{len(lignes)} graphiques | min {min(vals):.2f} | mediane {statistics.median(vals):.2f} | max {max(vals):.2f} pt")
