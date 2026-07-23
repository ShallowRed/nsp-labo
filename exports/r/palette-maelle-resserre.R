# Palette NSP — spectre unifié « resserré » (ACTÉ le 23 juillet 2026).
# Drop-in : remplace ton bloc de couleurs, les palettes pal_M* s'adaptent seules.
# Convention conservée : 1 = le plus foncé, 4 = le plus clair (y compris les gris).

rouge1 <- "#9B2E33"
rouge2 <- "#C24146"
rouge3 <- "#FF7F7E"
rouge4 <- "#FFD3CF"

vert1  <- "#006C6D"
vert2  <- "#009899"
vert3  <- "#55CFCF"
vert4  <- "#BAF3F2"

jaune1 <- "#E29A4E"
jaune2 <- "#F6BB81"

bleu1  <- "#0B4862"
bleu2  <- "#2B8CB9"
bleu3  <- "#7AC4EC"
bleu4  <- "#C6EDFF"

orange <- "#C77C1F"

gris1  <- "#6A777F"
gris2  <- "#B0BCC3"
gris3  <- "#D0D9DE"
gris4  <- "#E0E7EB"


# Correspondance : rouge=coquelicot, vert=canard, jaune/orange=ambre, bleu=petrole, gris=ardoise
# Points de passation (a confirmer ensemble) :
# - pivot "ca depend" : l'ex-#ccbd2f servait a la fois de rouge4/vert4/jaune1/orange ;
#   ici chaque variable a sa propre valeur. Milieu d'une echelle a 3 etats : jaune1 (audite).
#   Pivot d'un likert a 5 modalites : gris clair (gris4), un pivot jaune-orange se
#   confond avec le pole chaud en daltonisme (mesure : dE 7 contre 15 en pivot neutre).
# - "ne sait pas / non renseigne" : prendre gris3 ou gris4 (clairs), pas gris1 (fonce).
# - encre (ex-noir -> bleu fonce) : bleu1 convient (texte et axes).
# Audit daltonisme : OK (aucun conflit sous dE 10 en deutan/protan/tritan sur les archétypes likert, oui-non, 3 états, catégoriel).
