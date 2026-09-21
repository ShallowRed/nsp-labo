#!/bin/sh
# Génère les douze graphiques des annexes au gabarit retenu : 353,738 × 630 pt, texte à 7 pt.
set -e
cd "$(dirname "$0")"
titre() {
  case "$1" in
    A) echo "Se sentir mal ou plutôt mal au travail" ;;
    B) echo "Ambiance mauvaise ou plutôt mauvaise" ;;
    C) echo "Ne pas se sentir capable de tenir jusqu’à la retraite" ;;
  esac
}
perimetre() {
  case "$1" in
    1) echo "Tous versants FP confondus" ;;
    2) echo "FPE" ;;
    3) echo "FPT" ;;
    4) echo "FPH" ;;
  esac
}
for serie in A B C; do
  for n in 1 2 3 4; do
    retrait=0.6
    [ "$n" = 1 ] && retrait=0.3   # les graphiques « tous versants » ont une variable et deux modalités de plus
    node generer.mjs "donnees/$serie$n.csv" "sortie/$serie$n.svg" --largeur 353.738 --hauteur 630 --corps 7 --retrait "$retrait" --axe "$(titre $serie)" --perimetre "$(perimetre $n)"
  done
done
