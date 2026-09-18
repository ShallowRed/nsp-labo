"""Passe couleur complète du rapport « Hiérarchie et management ».

Trois règles sont appliquées au dossier Links, dans cet ordre.

1. Axes et labels : les deux teintes qui servent d'axe et de label dans le document
   (pétrole 600 et une teinte hors spectre) prennent le pétrole 700 sur les textes en
   graisse Bold, l'ardoise 700 partout ailleurs, traits d'axe compris.
2. Spectre : les couleurs de la règle d'origine passent à la règle courante, d'après
   le fichier de correspondance du kit de bascule.
3. Annexes A1 à C4 : la palette par défaut de ggplot laisse place à une teinte unique,
   le remplissage plein ou creux des points portant seul la significativité ; le texte
   passe en Poppins.

Deux écritures de SVG coexistent dans le dossier : un bloc <style> avec des classes .stN
et des attributs style= sur chaque élément. Les deux sont traitées.
"""
import csv
import re
import shutil
import sys
from pathlib import Path

AXES = ("#096286", "#323786")
TITRE = "#0B4862"    # petrole 700
LABEL = "#3B4348"    # ardoise 700
POINT = "#1C7EA9"    # petrole 500, points des graphiques en foret
NEUTRES = {"#FFFFFF", "#EBEBEB", "#DEDEDE", "#B3B3B3", "#7F7F7F", "#D0D9DE"}
TEXTE_ANNEXE = {"#4D4D4D", "#111111", "#000000"}
ANNEXE = re.compile(r"^[ABC][1-4]\.svg$")


def declarations(bloc):
    return {c.strip(): v.strip() for c, v in re.findall(r"([\w-]+)\s*:\s*([^;}]+)", bloc)}


def axes_illustrator(texte):
    debut, fin = texte.index("<style>"), texte.index("</style>")
    css = texte[debut + 7:fin]
    grasses, concernees = set(), set()
    for selecteurs, bloc in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        noms = {s.strip().lstrip(".") for s in selecteurs.split(",") if s.strip().startswith(".")}
        decl = declarations(bloc)
        if "Bold" in decl.get("font-family", ""):
            grasses |= noms
        for prop in ("fill", "stroke"):
            if decl.get(prop, "").upper() in AXES:
                concernees |= noms
    if not concernees:
        return texte, 0
    # Une même règle porte souvent la couleur pour des classes grasses et maigres à la
    # fois : l'ardoise est posée partout, puis une règle finale rend leur teinte aux titres.
    for source in AXES:
        css = re.sub(source, LABEL, css, flags=re.I)
    titres = sorted(grasses & concernees)
    if titres:
        selecteur = ", ".join("." + c for c in titres)
        css += "\n      %s {\n        fill: %s;\n      }\n" % (selecteur, TITRE)
    return texte[:debut + 7] + css + texte[fin:], len(concernees)


def axes_en_ligne(texte):
    compte = 0

    def remplace(m):
        nonlocal compte
        balise = m.group(0)
        if not any(s.lower() in balise.lower() for s in AXES):
            return balise
        compte += 1
        couleur = TITRE if "Bold" in balise else LABEL
        for source in AXES:
            balise = re.sub(source, couleur, balise, flags=re.I)
        return balise

    return re.sub(r"<[^>]+>", remplace, texte), compte


def regle_axes(texte):
    total = 0
    if "<style>" in texte:
        texte, n = axes_illustrator(texte)
        total += n
    texte, n = axes_en_ligne(texte)
    return texte, total + n


def regle_spectre(texte, correspondance):
    compte = 0
    for ancienne, nouvelle in correspondance.items():
        texte, n = re.subn(ancienne, nouvelle, texte, flags=re.I)
        compte += n
    return texte, compte


def regle_annexe(texte):
    teintes = {h.upper() for h in re.findall(r"#[0-9a-fA-F]{6}", texte)}
    compte = 0
    for teinte in teintes:
        if teinte in NEUTRES:
            continue
        cible = LABEL if teinte in TEXTE_ANNEXE else POINT
        texte, n = re.subn(teinte, cible, texte, flags=re.I)
        compte += n
    for motif in ('"Arial"', "'Arial'", "ArialMT, Arial", "Arial"):
        texte = texte.replace(motif, motif.replace("ArialMT, Arial", "Poppins").replace("Arial", "Poppins"))
    return texte, compte


def main(links, fichier_correspondance, sauvegarde=None):
    links = Path(links)
    correspondance = {}
    for ligne in Path(fichier_correspondance).read_text(encoding="utf8").splitlines():
        if ":" in ligne:
            a, b = ligne.strip().split(":")
            correspondance[a.upper()] = b.upper()
    if sauvegarde:
        sauvegarde = Path(sauvegarde)
        if sauvegarde.exists():
            shutil.rmtree(sauvegarde)
        shutil.copytree(links, sauvegarde)

    bilan = {"axes": 0, "spectre": 0, "annexes": 0}
    for fichier in sorted(links.glob("*.svg")):
        texte = fichier.read_text(encoding="utf8")
        if ANNEXE.match(fichier.name):
            texte, n = regle_annexe(texte)
            bilan["annexes"] += n
        else:
            texte, n = regle_axes(texte)
            bilan["axes"] += n
            texte, n = regle_spectre(texte, correspondance)
            bilan["spectre"] += n
        fichier.write_text(texte, encoding="utf8")
    print(f"axes et labels : {bilan['axes']} règles ou éléments")
    print(f"spectre        : {bilan['spectre']} occurrences")
    print(f"annexes        : {bilan['annexes']} occurrences")


if __name__ == "__main__":
    main(*sys.argv[1:])
