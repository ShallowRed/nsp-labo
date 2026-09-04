#!/usr/bin/env python3
"""Substitution de couleurs en lot dans des SVG, quelle que soit la notation
(classe CSS, attribut fill/stroke, style inline) et quelle que soit la casse.

Usage : svg-recolore.py <dossier> <ancienne>:<nouvelle> [<ancienne>:<nouvelle> ...]
        [--sauvegarde <dossier>] [--simulation]
"""
import re, sys, os, glob, shutil

def couleurs(arg):
    a, n = arg.split(':')
    return a.lstrip('#').lower(), '#' + n.lstrip('#').upper()

def main():
    argv, args, sauvegarde, simulation = sys.argv[1:], [], None, False
    i = 0
    while i < len(argv):
        if argv[i] == '--simulation':
            simulation = True
        elif argv[i] == '--sauvegarde':
            i += 1
            sauvegarde = argv[i]
        else:
            args.append(argv[i])
        i += 1
    dossier, paires = args[0], [couleurs(a) for a in args[1:]]
    if not paires:
        raise SystemExit('aucune paire de couleurs')

    fichiers = sorted(glob.glob(os.path.join(dossier, '*.svg')))
    if sauvegarde and not simulation:
        os.makedirs(sauvegarde, exist_ok=True)

    total, touches = 0, 0
    for p in fichiers:
        s = open(p, encoding='utf-8').read()
        n = 0
        for ancienne, nouvelle in paires:
            motif = re.compile('#' + ancienne, re.IGNORECASE)
            s, k = motif.subn(nouvelle, s)
            n += k
        if not n:
            continue
        touches += 1
        total += n
        if not simulation:
            if sauvegarde:
                shutil.copy(p, os.path.join(sauvegarde, os.path.basename(p)))
            open(p, 'w', encoding='utf-8').write(s)
        print(f'{os.path.basename(p):62} {n:4} remplacement(s)')
    verbe = 'à remplacer' if simulation else 'remplacées'
    print(f'\n{total} occurrence(s) {verbe} dans {touches}/{len(fichiers)} fichiers')

if __name__ == '__main__':
    main()
