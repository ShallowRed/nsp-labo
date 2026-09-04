#!/usr/bin/env python3
"""Reprend les forest plots de l'annexe multivariée sans régénération R :

- les cotes passent du bord gauche du panneau, où elles touchent les étiquettes
  de modalité, à une colonne alignée à droite ;
- les libellés de variables sont recomposés à un corps unique : ggplot alloue à
  chaque libellé la hauteur de ses modalités, et toute ligne débordant de cette
  bande était coupée par le clip du groupe. Le texte est redécoupé à la largeur
  disponible puis recentré verticalement dans sa bande.

Usage : python3 svg-or-valeurs.py <dossier> [dossier_sortie]
"""
import re, sys, os, glob

MARGE = 5  # pt entre la cote et le bord droit du panneau
CHASSE = 0.53  # largeur moyenne d'un caractère Poppins, en fraction du corps
CORPS = 7.5  # corps unique des libellés : le plus grand qui laisse les deux
             # lignes des libellés longs tenir dans leur bande
INTERLIGNE = 1.15  # de l'interligne rapporté au corps
COLONNE_LIBELLES = 100  # les clips à gauche de cette abscisse portent les libellés

TEXTE = re.compile(r"<text x='(-?[0-9.]+)' y='(-?[0-9.]+)'([^>]*)>([^<]+)</text>")
GROUPE = re.compile(r"<g clip-path='url\(#([^']+)\)'>\s*((?:<text[^>]*>[^<]*</text>\s*)+)")
CLIP = re.compile(r"<clipPath id='([^']+)'>\s*<rect x='([0-9.]+)' y='([0-9.]+)'"
                  r" width='([0-9.]+)' height='([0-9.]+)'")

def bord_panneau(s):
    verticales = [float(a) for a, y, b in
                  re.findall(r"<polyline points='([0-9.]+),([0-9.]+) ([0-9.]+),", s)
                  if abs(float(a) - float(b)) < 0.01]
    return max(verticales) if verticales else None

def deplace_cotes(s, cible):
    n = 0
    def remplace(m):
        nonlocal n
        x, attrs, texte = float(m.group(1)), m.group(3), m.group(4)
        if "text-anchor" in attrs or not (410 < x < 420):
            return m.group(0)
        if not re.fullmatch(r"\d+\.\d+", texte.strip()):
            return m.group(0)
        n += 1
        return (f"<text x='{cible:.2f}' y='{m.group(2)}' text-anchor='end'"
                f"{attrs}>{texte}</text>")
    return TEXTE.sub(remplace, s), n

def decoupe(texte, largeur_max):
    """Redécoupe en lignes tenant dans largeur_max, sans couper de mot."""
    lignes, courante = [], ""
    for mot in texte.split():
        essai = f"{courante} {mot}".strip()
        if len(essai) * CORPS * CHASSE > largeur_max and courante:
            lignes.append(courante)
            courante = mot
        else:
            courante = essai
    if courante:
        lignes.append(courante)
    return lignes

def uniformise_libelles(s):
    """Recompose chaque libellé au corps unique, recentré dans sa bande."""
    clips = {m.group(1): tuple(map(float, m.groups()[1:])) for m in CLIP.finditer(s)}
    n, deborde = 0, []
    for m in GROUPE.finditer(s):
        cid, bloc = m.group(1), m.group(2)
        if cid not in clips:
            continue
        cx, cy, cw, ch = clips[cid]
        if cx > COLONNE_LIBELLES:
            continue
        lignes = TEXTE.findall(bloc)
        if not lignes:
            continue
        entier = " ".join(l[3].strip() for l in lignes)
        nouvelles = decoupe(entier, cw)
        interligne = CORPS * INTERLIGNE
        hauteur = (len(nouvelles) - 1) * interligne
        if hauteur + CORPS > ch:
            deborde.append(entier[:40])
        depart = cy + (ch - hauteur) / 2 + CORPS * 0.35
        modele = TEXTE.search(bloc).group(0)
        rendu = "\n".join(
            re.sub(r"font-size: [0-9.]+px", f"font-size: {CORPS}px",
                   re.sub(r"y='[0-9.-]+'", f"y='{depart + i * interligne:.2f}'",
                          modele.replace(f">{lignes[0][3]}<", f">{ligne}<")))
            for i, ligne in enumerate(nouvelles))
        s = s.replace(bloc, rendu + "\n", 1)
        n += 1
    return s, n, deborde

def traite(chemin, sortie):
    s = open(chemin, encoding="utf-8").read()
    droite = bord_panneau(s)
    n = 0
    if droite is not None:
        s, n = deplace_cotes(s, droite - MARGE)
    s, r, deborde = uniformise_libelles(s)
    open(sortie, "w", encoding="utf-8").write(s)
    return n, r, deborde

def main():
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(src, "valeurs_a_droite")
    os.makedirs(dst, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src, "*.svg"))):
        n, r, deborde = traite(f, os.path.join(dst, os.path.basename(f)))
        alerte = f"  ATTENTION {len(deborde)} libellé(s) trop hauts" if deborde else ""
        print(f"{os.path.basename(f):10s} {n:3d} cotes déplacées, {r:2d} libellés à {CORPS} pt{alerte}")

if __name__ == "__main__":
    main()
