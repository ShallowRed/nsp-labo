#!/usr/bin/env python3
"""Met à jour les SVG liés d'une maquette InDesign avec un lot d'exports récent.

Pour chaque image liée, le format (colonne / large / pleine / encart) est choisi
d'après la largeur du cadre où elle est placée, puis le fichier correspondant du
lot est recopié sous le nom attendu : InDesign recharge les liens à l'ouverture,
sans qu'aucune image ait à être replacée.

Usage : python3 maj-liens-indesign.py <dossier maquette> <lot d'exports> [autre lot...]
"""
import zipfile, re, os, sys, glob, shutil, collections
import xml.etree.ElementTree as ET

PT = 25.4 / 72

def cadres_de(idml):
    """Nom de fichier lié -> (largeur, hauteur) du cadre, en mm."""
    z = zipfile.ZipFile(idml)
    out = {}
    for nom in (n for n in z.namelist() if n.startswith("Spreads/")):
        for rect in ET.fromstring(z.read(nom)).iter("Rectangle"):
            liens = [l.get("LinkResourceURI", "") for l in rect.iter("Link")]
            svg = [l for l in liens if l.lower().endswith(".svg")]
            points = [tuple(map(float, p.get("Anchor").split()))
                      for p in rect.iter("PathPointType") if p.get("Anchor")]
            if not svg or len(points) < 4:
                continue
            xs = [p[0] for p in points]
            ys = [p[1] for p in points]
            out[os.path.basename(svg[0])] = ((max(xs) - min(xs)) * PT,
                                             (max(ys) - min(ys)) * PT)
    return out

def lot_de(dossiers):
    """Racine du nom -> {format: (chemin, largeur mm)}."""
    out = collections.defaultdict(dict)
    for d in dossiers:
        for f in glob.glob(os.path.join(d, "*.svg")):
            base = os.path.basename(f)[:-4]
            sans_mode = base.replace("_barre", "")
            racine, _, fmt = sans_mode.rpartition("_")
            if not racine:  # fichier sans suffixe de format (multivarié)
                racine, fmt = sans_mode, ""
            texte = open(f, encoding="utf-8", errors="replace").read()
            m = re.search(r"width='([0-9.]+)pt'", texte)
            out[racine][fmt] = (f, float(m.group(1)) * PT if m else 0)
    return out

def main():
    maquette, lots = sys.argv[1], sys.argv[2:]
    idml = glob.glob(os.path.join(maquette, "*.idml"))[0]
    liens = os.path.join(maquette, "Links")
    cadres = cadres_de(idml)
    lot = lot_de(lots)
    remplaces, manquants = 0, []
    for nom, (largeur, _) in sorted(cadres.items()):
        racine = nom[:-4]
        if racine not in lot:
            manquants.append(nom)
            continue
        # le format dont la largeur colle le mieux à celle du cadre
        fmt, (source, l) = min(lot[racine].items(), key=lambda kv: abs(kv[1][1] - largeur))
        shutil.copy(source, os.path.join(liens, nom))
        remplaces += 1
        print(f"  {nom:44s} cadre {largeur:5.0f} mm -> {fmt or 'unique':8s} ({l:.0f} mm)")
    print(f"\n{remplaces} liens mis à jour" +
          (f", {len(manquants)} sans équivalent : {manquants}" if manquants else ""))

if __name__ == "__main__":
    main()
