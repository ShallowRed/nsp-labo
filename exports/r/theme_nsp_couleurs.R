# theme_nsp_couleurs.R : GÉNÉRÉ, ne pas éditer à la main.
# Source : nsp-labo, node scripts/gen-r.mjs
# Spectre NSP « resserré » (ACTÉ le 23 juillet 2026 : l'enquête part sur ce
# spectre ; si une teinte évolue, régénérer ce fichier suffit, rien d'autre ne change).
#
# Audit daltonisme des archétypes de palettes de l'enquête :
#   aucun conflit sous le seuil (dE 10) en vision normale, deutan, protan, tritan

# Familles du spectre (19 paliers, du plus clair 50 au plus foncé 950) ----
nsp_coquelicot <- c("#FEF2F1", "#FCDEDC", "#F9CAC7", "#F6B6B3", "#F1A19E", "#EC8D8A", "#E67876", "#DF6263", "#D44E52", "#C24146", "#AF373C", "#9B2E33", "#87272C", "#722225", "#5C1E1F", "#471A1A", "#331515", "#1F1110", "#0B0B0B")
nsp_framboise <- c("#FCF2F7", "#F8DDEB", "#F3C9DF", "#EDB5D4", "#E7A1C8", "#E08DBC", "#D878B1", "#CF65A5", "#BF5796", "#AE4B88", "#9D407A", "#8B376B", "#782F5C", "#65284E", "#532240", "#401C32", "#2E1724", "#1C1117", "#0B0B0B")
nsp_lavande <- c("#F4F4FE", "#E3E3FD", "#D3D3FB", "#C3C2F8", "#B3B2F5", "#A4A1F2", "#9590EE", "#877FE8", "#7A71D8", "#6E64C7", "#6158B4", "#554C9F", "#49428A", "#3E3874", "#322E5E", "#282548", "#1D1C33", "#14141E", "#0B0B0B")
nsp_petrole <- c("#EDF7FD", "#D1EBF9", "#B4DEF6", "#97D1F2", "#7AC4EC", "#63B7E2", "#4FA8D5", "#3C9AC8", "#2B8CB9", "#1C7EA9", "#107098", "#096286", "#085574", "#0B4862", "#0E3B50", "#0F2E3D", "#0F222C", "#0E161B", "#0B0B0B")
nsp_canard <- c("#EBF8F8", "#CDEEED", "#AEE3E2", "#8CD8D7", "#67CDCD", "#32C2C2", "#00B4B4", "#00A4A4", "#009595", "#008686", "#007777", "#006868", "#005A5A", "#004C4C", "#003F3F", "#003232", "#062525", "#0B1817", "#0B0B0B")
nsp_prairie <- c("#F0F7EF", "#DBECD7", "#C5E1BF", "#AFD5A7", "#99C98F", "#83BE76", "#6FB160", "#5FA350", "#529543", "#468737", "#3B782D", "#336A26", "#2B5B20", "#254D1C", "#1F3F18", "#1A3115", "#162412", "#10170F", "#0B0B0B")
nsp_ambre <- c("#FCF3EC", "#F7E2CF", "#F1D0B2", "#EBBF95", "#E5AD77", "#DE9B58", "#D58A37", "#C77C1F", "#B86E02", "#A66200", "#945700", "#824C00", "#714100", "#603700", "#4F2D01", "#3D2407", "#2C1C0B", "#1B130C", "#0B0B0B")
nsp_ardoise <- c("#F2F6F8", "#E0E7EB", "#D0D9DE", "#BFCAD1", "#B0BCC3", "#A1AEB6", "#92A0A8", "#84929A", "#77848C", "#6A777F", "#5D6971", "#515C63", "#465055", "#3B4348", "#31373B", "#272B2E", "#1D2022", "#141516", "#0B0B0B")
nsp_paliers <- c(50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950)
nsp_palier <- function(famille, palier) famille[[match(palier, nsp_paliers)]]

# Séquentielle NSP (remplace les rampes Brewer "Blues") ----
nsp_seq <- function(n, famille = nsp_petrole) {
  stopifnot(n >= 2)
  lo <- match(150, nsp_paliers); hi <- match(750, nsp_paliers)
  famille[round(seq(lo, hi, length.out = n))]
}

# Correspondance avec les constantes de utils_rapports.R ----
# (pôle positif = canard, négatif = coquelicot, bleu et séquentiel = petrole,
#  jaune et orange = ambre, gris = ardoise)
nsp_rouge1 <- "#C24146"  # coquelicot 500
nsp_rouge2 <- "#DF6263"  # coquelicot 400
nsp_rouge3 <- "#EBBF95"  # ambre 200
nsp_rouge4 <- "#FCDEDC"  # coquelicot 100
nsp_vert1 <- "#007777"  # canard 550
nsp_vert2 <- "#32C2C2"  # canard 300
nsp_vert3 <- "#8CD8D7"  # canard 200
nsp_vert4 <- "#CDEEED"  # canard 100
nsp_jaune1 <- "#DE9B58"  # ambre 300
nsp_jaune2 <- "#F1D0B2"  # ambre 150
nsp_bleu1 <- "#0B4862"  # petrole 700
nsp_bleu2 <- "#107098"  # petrole 550
nsp_bleu3 <- "#3C9AC8"  # petrole 400
nsp_bleu4 <- "#7AC4EC"  # petrole 250
nsp_bleu5 <- "#D1EBF9"  # petrole 100
nsp_orange <- "#A66200"  # ambre 500
nsp_gris1 <- "#6A777F"  # ardoise 500
nsp_gris2 <- "#B0BCC3"  # ardoise 250
nsp_gris3 <- "#D0D9DE"  # ardoise 150
nsp_gris4 <- "#E0E7EB"  # ardoise 100

# Catégories sans ordre ni connotation (FPE / FPT / FPH…) ----
# Hors familles de l'échelle d'opinion, clartés proches : aucun classement suggéré.
nsp_neutre2 <- c("#554C9F", "#E08DBC")
nsp_neutre3 <- c("#554C9F", "#E08DBC", "#5FA350")
