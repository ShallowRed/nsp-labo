#!/usr/bin/env python3
"""Corrige les colonnes de gauche des SVG svglite du rapport :
titres de facettes Y rognés au bord de la toile et chevauchements
titre/étiquettes issus du partage fixe 55/45 de la colonne.

Par sous-figure : l'ancre du titre est déplacée au plus près des
étiquettes (gouttière 1 mm), le titre est refusionné puis redécoupé
à la largeur réellement disponible et recentré dans sa bande ; les
étiquettes qui envahissent la colonne des titres sont redécoupées
sur deux lignes. Les questions d'en-tête qui sortent de la toile
sont ré-ancrées au bord gauche et redécoupées à la largeur de la toile.

Usage : svg-facettes.py <src> <dst> [fichier.svg ...]
"""
import re, sys, os, glob
from fontTools.ttLib import TTFont

ICI = os.path.dirname(os.path.abspath(__file__))
GOUTTIERE = 2.83   # 1 mm
MARGE_G = 1.0
INTERLIGNE = 1.08

EXCLUS = {         # étiquettes multilignes entrelacées : arbitrage éditorial, pas un fix texte
    'G64_managers_bien_etre_travail_cause_pleine_barre.svg',
    'G67_managers_benefice_accompagnement_court_colonne_barre.svg',
    'G18_changements_pro_impact.svg',   # ancien export 8x6, structure sans format
}
VOYELLES = set('aeiouyàâéèêëîïôùûüœAEIOUY')

_fonts = {}
def _charge(gras):
    cle = 'bold' if gras else 'regular'
    if cle not in _fonts:
        for base in (os.path.join(ICI, '..', 'fonts'), os.environ.get('POPPINS_DIR', '')):
            p = os.path.join(base, f"Poppins-{'Bold' if gras else 'Regular'}.ttf")
            if base and os.path.exists(p):
                f = TTFont(p)
                _fonts[cle] = (f.getBestCmap(), f['hmtx'], f['head'].unitsPerEm)
                break
        else:
            raise SystemExit(f"Poppins-{'Bold' if gras else 'Regular'}.ttf introuvable (POPPINS_DIR ?)")
    return _fonts[cle]

def largeur(texte, corps, gras=False):
    cmap, hmtx, upem = _charge(gras)
    espace = cmap.get(ord(' '))
    return sum(hmtx[cmap.get(ord(c), espace)][0] for c in texte) / upem * corps

DIGRAMMES = {'ch', 'ph', 'th', 'gn', 'qu', 'gu'}

def points_cesure(mot):
    pts = []
    for i in range(3, len(mot) - 2):
        a, b, c = mot[i - 1], mot[i], mot[i + 1]
        if "'" in (a, b) or '·' in (a, b, c):
            continue
        if a in VOYELLES and b not in VOYELLES and c in VOYELLES:
            pts.append(i)                                  # V|CV
        elif (a not in VOYELLES and b not in VOYELLES and c in VOYELLES
              and i >= 4 and mot[i - 2] in VOYELLES
              and (a + b).lower() not in DIGRAMMES and b not in 'rl'):
            pts.append(i)                                  # VC|CV
    return pts

def besoin_min(texte, corps, gras):
    # largeur sous laquelle aucune découpe (césures comprises) ne peut faire tenir le texte
    besoin = 0.0
    for mot in texte.split():
        w = largeur(mot, corps, gras)
        coupes = [largeur(mot[:i] + '-', corps, gras) for i in points_cesure(mot)]
        besoin = max(besoin, min([w] + [c for c in coupes if c < w] or [w]))
    return besoin

def cesure(mot, maxi, corps, gras):
    coupes = [i for i in points_cesure(mot) if largeur(mot[:i] + '-', corps, gras) <= maxi]
    if not coupes:
        return None
    i = coupes[-1]
    return mot[:i] + '-', mot[i:]

def decoupe(texte, maxi, corps, gras):
    mots, lignes, ligne = texte.split(), [], ''
    while mots:
        m = mots.pop(0)
        essai = (ligne + ' ' + m).strip()
        if largeur(essai, corps, gras) <= maxi:
            ligne = essai
            continue
        if not ligne:
            c = cesure(m, maxi, corps, gras)
            if c:
                lignes.append(c[0]); mots.insert(0, c[1])
            else:
                lignes.append(m)
            continue
        lignes.append(ligne); ligne = ''; mots.insert(0, m)
    if ligne: lignes.append(ligne)
    return lignes

def decoupe_equilibree(texte, n, corps, gras):
    total = largeur(texte, corps, gras)
    cible = total / n * 1.05
    for _ in range(20):
        lignes = decoupe(texte, cible, corps, gras)
        if len(lignes) <= n:
            return lignes
        cible *= 1.08
    return lignes

RE_TOKEN = re.compile(
    r"<g clip-path='url\(#([^)]+)\)'>"
    r"|</g>"
    r"|<text( transform='[^']*rotate\([^)]*\)[^']*')? x='([\d.-]+)' y='([\d.-]+)'([^>]*)>([^<]*)</text>")

def parse(s):
    vb = re.search(r"viewBox='([\d. ]+)'", s).group(1).split()
    W, H = float(vb[2]), float(vb[3])
    clips = {}
    for m in re.finditer(r"<clipPath id='([^']+)'>\s*<rect x='([\d.-]+)' y='([\d.-]+)' width='([\d.-]+)' height='([\d.-]+)'", s):
        clips[m.group(1)] = tuple(map(float, m.groups()[1:]))
    pile, textes = [], []
    for m in RE_TOKEN.finditer(s):
        if m.group(0).startswith('<g'):
            pile.append(m.group(1))
        elif m.group(0) == '</g>':
            if pile: pile.pop()
        else:
            rot, x, y, attrs, txt = m.group(2), float(m.group(3)), float(m.group(4)), m.group(5), m.group(6)
            fs = float(re.search(r'font-size: ([\d.]+)px', attrs).group(1))
            gras = 'bold' in attrs
            anchor = 'middle' if 'middle' in attrs else ('end' if "anchor='end'" in attrs else 'start')
            w = largeur(txt, fs, gras)
            x0 = x - w * (0.5 if anchor == 'middle' else 1.0 if anchor == 'end' else 0)
            clip = clips.get(pile[-1], (0, 0, W, H)) if pile else (0, 0, W, H)
            textes.append(dict(txt=txt, x=x, y=y, fs=fs, gras=gras, anchor=anchor, attrs=attrs,
                               w=w, x0=x0, x1=x0 + w, rot=bool(rot), clip=clip, span=m.span(),
                               brut=m.group(0)))
    return W, H, clips, textes

def groupes_par_y(items, pas_max=9.5):
    blocs, courant = [], []
    for t in sorted(items, key=lambda t: t['y']):
        if courant and t['y'] - courant[-1]['y'] > pas_max:
            blocs.append(courant); courant = []
        courant.append(t)
    if courant: blocs.append(courant)
    return blocs

def groupes_titres(items, pas_max=9.5):
    # un bloc titre a un interligne régulier : couper aussi sur rupture de pas
    # (deux titres qui se suivent de près restent deux blocs)
    tris = sorted(items, key=lambda t: t['y'])
    ecarts = [b['y'] - a['y'] for a, b in zip(tris, tris[1:]) if b['y'] - a['y'] <= pas_max]
    if not ecarts:
        return groupes_par_y(items, pas_max)
    pas_ref = sorted(ecarts)[len(ecarts) // 2]
    blocs, courant = [], []
    for t in tris:
        if courant:
            e = t['y'] - courant[-1]['y']
            if e > pas_max or abs(e - pas_ref) > 1.2:
                blocs.append(courant); courant = []
        courant.append(t)
    if courant: blocs.append(courant)
    return blocs

def texte_svg(txt, x, y, modele, anchor='end'):
    attrs = re.sub(r" ?text-anchor='[^']*'", '', modele['attrs'])
    anc = f" text-anchor='{anchor}'" if anchor != 'start' else ''
    return f"<text x='{x:.2f}' y='{y:.2f}'{anc}{attrs}>{txt}</text>"

def corrige(path):
    s = open(path, encoding='utf-8').read()
    if 'svglite' not in s[:300]:
        return None, 'non svglite, ignoré'
    W, H, clips, textes = parse(s)
    panneaux = sorted([c for c in clips.values() if c[0] > 10 and c[3] > 1], key=lambda c: c[1])
    if not panneaux:
        return None, 'pas de panneau'
    bord = min(c[0] for c in panneaux)
    gauche = [t for t in textes if not t['rot'] and t['anchor'] == 'end' and t['x'] <= bord]
    etiquettes = [t for t in gauche if t['x'] > bord - 15]
    titres = [t for t in gauche if t['x'] <= bord - 15]
    remplacements = {}

    restes = []
    for bloc in groupes_titres(titres):
        avant_bloc = set(remplacements)
        cy_bloc = sum(t['y'] for t in bloc) / len(bloc)
        bande = min(panneaux, key=lambda c: abs((c[1] + c[3] / 2) - cy_bloc))
        et_bande = [e for e in etiquettes if bande[1] - 2 <= e['y'] <= bande[1] + bande[3] + 2]
        fs, gras = bloc[0]['fs'], bloc[0]['gras']
        pas = fs * INTERLIGNE
        if len(bloc) > 1:
            pas = min(b['y'] - a['y'] for a, b in zip(bloc, bloc[1:]))
        complet = ' '.join(t['txt'].strip() for t in bloc)

        # bloc sain (rien de rogné, aucun chevauchement d'étiquette) : ne pas y toucher
        def chevauche(a, b):
            ox = min(a['x1'], b['x1']) - max(a['x0'], b['x0'])
            oy = (min(a['y'] + a['fs'] * 0.27, b['y'] + b['fs'] * 0.27)
                  - max(a['y'] - a['fs'] * 0.73, b['y'] - b['fs'] * 0.73))
            return ox > 0.5 and oy > min(a['fs'], b['fs']) * 0.5
        if (all(t['x0'] >= -0.5 for t in bloc)
                and not any(chevauche(t, e) for t in bloc for e in et_bande)):
            continue

        # placement fenêtré : seules les étiquettes croisant verticalement le bloc
        # titre bornent sa largeur (et sont redécoupées au besoin) ; les autres
        # rangées gardent leur ligne unique
        et_groupes = groupes_par_y(et_bande, pas_max=fs * 1.15) if et_bande else []
        centre = bande[1] + bande[3] / 2

        def x0_potentiel(g):
            if len(g) == 1 and len(g[0]['txt'].split()) >= 2:
                deux = decoupe_equilibree(g[0]['txt'].strip(), 2, fs, g[0]['gras'])
                return g[0]['x'] - max(largeur(l, fs, g[0]['gras']) for l in deux)
            return min(e['x0'] for e in g)

        # choisir la plage de rangées en face de laquelle poser le titre :
        # éviter d'abord les césures et les redécoupes d'étiquettes, puis rester central
        centres_g = [sum(e['y'] for e in g) / len(g) for g in et_groupes]
        candidats = []
        plages = ([(i, j) for i in range(len(et_groupes)) for j in range(i, len(et_groupes))]
                  or [(0, -1)])
        for (i, j) in plages:
            if j >= 0:
                couverts = et_groupes[i:j + 1]
                dispo = min(x0_potentiel(g) for g in couverts) - GOUTTIERE - MARGE_G
                y_centre = (centres_g[i] + centres_g[j]) / 2
                h_fen = centres_g[j] - centres_g[i] + (centres_g[1] - centres_g[0]
                                                       if len(centres_g) > 1 else bande[3])
            else:
                couverts = []
                dispo = bord - GOUTTIERE - MARGE_G
                y_centre, h_fen = centre, bande[3]
            lignes = decoupe(complet, dispo, fs, gras)
            h_bloc = (len(lignes) - 1) * pas + fs
            if h_bloc > min(h_fen, bande[3]) + pas:
                continue
            # couverture réelle du bloc posé : ce sont ces groupes qui bornent la largeur
            y0_reel = y_centre - (len(lignes) - 1) * pas / 2
            fen_reel = (y0_reel - fs * 0.75, y0_reel + (len(lignes) - 1) * pas + fs * 0.3)
            couverts = [g for g in et_groupes
                        if g[0]['y'] - fs * 0.73 < fen_reel[1]
                        and g[-1]['y'] + fs * 0.27 > fen_reel[0]]
            dispo_reel = (min((x0_potentiel(g) for g in couverts), default=bord - GOUTTIERE)
                          - GOUTTIERE - MARGE_G)
            if max(largeur(l, fs, gras) for l in lignes) > dispo_reel + 1:
                continue
            dispo = dispo_reel
            redec = sum(1 for g in couverts if x0_potentiel(g) > min(e['x0'] for e in g) + 0.1
                        and min(e['x0'] for e in g) < dispo + MARGE_G + GOUTTIERE - 0.5)
            cesures = sum(1 for l in lignes if l.endswith('-'))
            score = 10 * redec + 5 * cesures + abs(y_centre - centre) / 10 + len(lignes) * 0.5
            candidats.append((score, dispo, y_centre, lignes, couverts))
        if not candidats:
            restes.append(complet)
            continue
        _, dispo, y_centre, lignes, couverts = min(candidats, key=lambda c: c[0])
        ancre = dispo + MARGE_G
        centres_tous = [sum(e['y'] for e in g) / len(g) for g in et_groupes]
        ecarts_rangee = sorted(b - a for a, b in zip(centres_tous, centres_tous[1:]))
        rangee = ecarts_rangee[len(ecarts_rangee) // 2] if ecarts_rangee else fs * 2
        for g in couverts:
            e = g[0]
            if len(g) != 1 or e['x0'] >= ancre + GOUTTIERE - 0.5 or len(e['txt'].split()) < 2:
                continue
            deux = decoupe_equilibree(e['txt'].strip(), 2, fs, e['gras'])
            if len(deux) != 2:
                continue
            pe = min(e['fs'] * INTERLIGNE, max(e['fs'] * 0.92, rangee / 2))
            remplacements[e['span']] = [texte_svg(l, e['x'], e['y'] + (i2 - 0.5) * pe, e)
                                        for i2, l in enumerate(deux)]
        centre = y_centre

        lignes = decoupe(complet, dispo, fs, gras)
        if ((len(lignes) - 1) * pas + fs > bande[3] + pas
                or max(largeur(l, fs, gras) for l in lignes) > dispo + 1):
            # le titre ne tiendra pas proprement : ne pas dégrader, laisser au réglage manuel
            for k in set(remplacements) - avant_bloc:
                del remplacements[k]
            restes.append(complet)
            continue
        y0 = centre - (len(lignes) - 1) * pas / 2 + fs * 0.35
        y0 = min(max(y0, fs * 0.75), H - 1 - (len(lignes) - 1) * pas)
        for t in bloc:
            remplacements[t['span']] = []
        remplacements[bloc[0]['span']] = [texte_svg(l, ancre, y0 + i * pas, bloc[0])
                                          for i, l in enumerate(lignes)]

    # étiquettes qui sortent de la toile à gauche (bandes sans titre ou libellés très longs)
    for bloc in groupes_par_y([e for e in etiquettes if e['span'] not in remplacements],
                              pas_max=etiquettes[0]['fs'] * 1.15 if etiquettes else 8):
        if min(e['x0'] for e in bloc) >= -0.2:
            continue
        fs, gras = bloc[0]['fs'], bloc[0]['gras']
        pas = fs * INTERLIGNE
        if len(bloc) > 1:
            pas = min(b['y'] - a['y'] for a, b in zip(bloc, bloc[1:]))
        complet = ' '.join(t['txt'].strip() for t in bloc)
        x_ancre = bloc[0]['x']
        n = len(bloc)
        lignes = decoupe_equilibree(complet, n, fs, gras)
        if max(largeur(l, fs, gras) for l in lignes) > x_ancre - MARGE_G:
            lignes = decoupe(complet, x_ancre - MARGE_G, fs, gras)
        centre = sum(t['y'] for t in bloc) / len(bloc)
        y0 = centre - (len(lignes) - 1) * pas / 2
        for t in bloc:
            remplacements[t['span']] = []
        remplacements[bloc[0]['span']] = [texte_svg(l, x_ancre, y0 + i * pas, bloc[0])
                                          for i, l in enumerate(lignes)]

    entetes = [t for t in textes if t['anchor'] == 'start' and not t['rot']
               and t['y'] < panneaux[0][1] + 2 and t['x1'] > W - MARGE_G]
    for bloc in groupes_par_y(entetes):
        fs, gras = bloc[0]['fs'], bloc[0]['gras']
        pas = fs * INTERLIGNE
        complet = ' '.join(t['txt'].strip() for t in bloc)
        lignes = decoupe(complet, W - 2 * MARGE_G, fs, gras)
        y0 = bloc[0]['y'] if len(lignes) <= len(bloc) else max(fs * 0.75, bloc[0]['y'] - (len(lignes) - len(bloc)) * pas)
        for t in bloc:
            remplacements[t['span']] = []
        remplacements[bloc[0]['span']] = [texte_svg(l, MARGE_G, y0 + i * pas, bloc[0], anchor='start')
                                          for i, l in enumerate(lignes)]

    # petits débordements à droite de la toile (titres d'axe, annotations) : simple translation
    deb_droite = [t for t in textes if t['anchor'] == 'start' and not t['rot']
                  and t['span'] not in remplacements and t['x1'] > W - MARGE_G
                  and t['x1'] - (W - MARGE_G) <= 6]
    for bloc in groupes_par_y(deb_droite):
        dx = max(t['x1'] for t in bloc) - (W - MARGE_G)
        for t in bloc:
            remplacements[t['span']] = [
                t['brut'].replace(f"x='{t['x']}'", f"x='{t['x'] - dx:.2f}'", 1)]

    if not remplacements:
        return None, 'rien à corriger' + (f' ; A LA MAIN : {restes}' if restes else '')
    for (a, b), nouv in sorted(remplacements.items(), reverse=True):
        s = s[:a] + ''.join(nouv) + s[b:]
    info = f'{len(remplacements)} textes réécrits'
    if restes:
        info += f' ; A LA MAIN : {restes}'
    return s, info

def main():
    src, dst = sys.argv[1], sys.argv[2]
    cibles = sys.argv[3:] or [os.path.basename(p) for p in sorted(glob.glob(os.path.join(src, 'G*.svg')))]
    os.makedirs(dst, exist_ok=True)
    for nom in cibles:
        if nom in EXCLUS:
            print(f'{nom:60} EXCLU (arbitrage éditorial)')
            continue
        res, info = corrige(os.path.join(src, nom))
        if res is None:
            if 'A LA MAIN' in info:
                print(f'{nom:60} {info}')
            continue
        open(os.path.join(dst, nom), 'w', encoding='utf-8').write(res)
        print(f'{nom:60} {info}')

if __name__ == '__main__':
    main()
