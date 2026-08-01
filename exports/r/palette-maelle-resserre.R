# Palette NSP « canard et coquelicot », retenue par le collectif le 24 juillet 2026.
# Drop-in : remplace le bloc de couleurs, les noms de variables ne changent pas.
# Convention : 1 = le plus foncé, 4 = le plus clair, sauf rouge3 (voir plus bas).

rouge1 <- "#C24146"
rouge2 <- "#E45C5F"
rouge3 <- "#F6BB81"
rouge4 <- "#FFD3CF"

vert1  <- "#007B7C"
vert2  <- "#2DC2C2"
vert3  <- "#77DCDB"
vert4  <- "#BAF3F2"

jaune1 <- "#E29A4E"
jaune2 <- "#FECC9E"

bleu1  <- "#0B4862"
bleu2  <- "#107098"
bleu3  <- "#3C9AC8"
bleu4  <- "#7AC4EC"
bleu5  <- "#C6EDFF"

orange <- "#A86100"

gris1  <- "#6A777F"
gris2  <- "#B0BCC3"
gris3  <- "#D0D9DE"
gris4  <- "#E0E7EB"

# Categories sans ordre et sans connotation (ex. FPE / FPT / FPH, ou deux usages
# d'un meme outil). Teintes prises hors des familles que l'echelle d'opinion occupe
# deja (ni canard, ni coquelicot, ni ambre), pour qu'un aplat neutre ne se lise
# jamais comme un "bien" ou un "mal" ailleurs dans le rapport.
# A CONFIRMER : trois trios sont possibles, celui-ci est le mieux separe.
neutre2 <- c("#EA85C0", "#7FBF71")
neutre3 <- c("#EA85C0", "#7FBF71", "#554C9F")


# Echelle d'opinion a 4 modalites, dans cet ordre :
#   vert1  bien
#   vert2  plutot bien
#   rouge3 plutot mal
#   rouge1 mal
#   gris4  ne sait pas, non renseigne
#
# Deux variables ont change de teinte sans changer de nom :
# - rouge3 est un abricot et non plus un rouge clair : c'est le "plutot mal" adouci,
#   qui donne le continuum demande sans que la figure devienne illisible en daltonisme.
# - gris4 porte les non-reponses (gris2 est trop proche de vert2 en protanopie).
#
# Autres cas :
# - milieu d'une echelle a 3 etats : jaune1.
# - pivot d'un likert a 5 modalites : gris4, pas un jaune-orange (il se confondrait
#   avec le pole chaud en daltonisme : ecart mesure 7 contre 15 avec un pivot neutre).
# - progression "jamais -> toujours" : bleu5, bleu4, bleu3, bleu2, bleu1 (une seule famille).
# - encre des textes, etiquettes et axes : bleu1, comme recommande par Tram Anh.
# - familles : rouge=coquelicot, vert=canard, jaune/orange=ambre, bleu=petrole, gris=ardoise.
# Audit daltonisme : OK (aucun conflit sous dE 10 en deutan/protan/tritan sur les archétypes likert, oui-non, 3 états, catégoriel).
