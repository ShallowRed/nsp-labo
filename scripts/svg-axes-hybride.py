"""Recolore les axes, labels et titres des SVG du rapport.

Deux ecritures coexistent dans le dossier Links : un bloc <style> avec des classes .stN
(export Illustrator) et des attributs style= sur chaque element (export R). Le script
resout les deux, puis attribue la couleur des titres aux textes en graisse Bold et la
couleur des labels a tout le reste, traits d'axe compris.
"""
import re
import sys
from pathlib import Path

SOURCE = "#096286"
TITRE = "#0B4862"   # petrole 700
LABEL = "#3B4348"   # ardoise 700


def declarations(bloc):
    out = {}
    for cle, valeur in re.findall(r"([\w-]+)\s*:\s*([^;}]+)", bloc):
        out[cle.strip()] = valeur.strip()
    return out


def classes_grasses(css):
    """Classes portant une graisse Bold, et classes dont la couleur est a remplacer."""
    grasses, concernees = set(), set()
    for selecteurs, bloc in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        noms = {s.strip().lstrip(".") for s in selecteurs.split(",") if s.strip().startswith(".")}
        decl = declarations(bloc)
        if "Bold" in decl.get("font-family", ""):
            grasses |= noms
        for prop in ("fill", "stroke"):
            if decl.get(prop, "").lower() == SOURCE.lower():
                concernees |= noms
    return grasses, concernees


def recolore_illustrator(texte):
    debut, fin = texte.index("<style>"), texte.index("</style>")
    css = texte[debut + 7:fin]
    grasses, concernees = classes_grasses(css)
    if not concernees:
        return texte, 0

    # Une meme regle porte souvent la couleur pour des classes grasses et maigres a la fois :
    # la couleur des labels est appliquee partout, puis une regle finale rend leur teinte aux titres.
    nouveau = re.sub(SOURCE, LABEL, css, flags=re.I)
    titres = sorted(grasses & concernees)
    if titres:
        selecteur = ", ".join("." + c for c in titres)
        nouveau += "\n      %s {\n        fill: %s;\n      }\n" % (selecteur, TITRE)
    return texte[:debut + 7] + nouveau + texte[fin:], len(concernees)


def recolore_en_ligne(texte):
    n = 0

    def remplace_element(m):
        nonlocal n
        balise = m.group(0)
        if SOURCE.lower() not in balise.lower():
            return balise
        n += 1
        gras = "Bold" in balise
        return re.sub(SOURCE, TITRE if gras else LABEL, balise, flags=re.I)

    return re.sub(r"<[^>]+>", remplace_element, texte), n


def traite(chemin):
    texte = chemin.read_text(encoding="utf8")
    if SOURCE.lower() not in texte.lower():
        return 0
    if "<style>" in texte:
        texte, n = recolore_illustrator(texte)
        # les attributs poses hors du bloc <style> restent a traiter
        texte, m = recolore_en_ligne(texte)
        n += m
    else:
        texte, n = recolore_en_ligne(texte)
    chemin.write_text(texte, encoding="utf8")
    return n


if __name__ == "__main__":
    dossier = Path(sys.argv[1])
    total = touches = 0
    for f in sorted(dossier.glob("*.svg")):
        n = traite(f)
        if n:
            touches += 1
            total += n
    print(f"{touches} fichiers recolores, {total} regles ou elements touches")
