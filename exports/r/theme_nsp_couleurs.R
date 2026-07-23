# theme_nsp_couleurs.R : GÉNÉRÉ, ne pas éditer à la main.
# Source : nsp-labo, node scripts/gen-r.mjs (2026-07-23)
# Spectre NSP « resserré » (ACTÉ le 23 juillet 2026 : l'enquête part sur ce
# spectre ; si une teinte évolue, régénérer ce fichier suffit, rien d'autre ne change).
#
# Audit daltonisme des archétypes de palettes de l'enquête :
#   aucun conflit sous le seuil (dE 10) en vision normale, deutan, protan, tritan

# Familles du spectre (19 paliers, du plus clair 50 au plus foncé 950) ----
nsp_coquelicot <- c("#FFEAE8", "#FFD3CF", "#FFBCB8", "#FFA6A3", "#FF9290", "#FF7F7E", "#F36D6D", "#E45C5F", "#D44E52", "#C24146", "#AF373C", "#9B2E33", "#87272C", "#722225", "#5C1E1F", "#471A1A", "#331515", "#1F1110", "#0B0B0B")
nsp_framboise <- c("#FFEBFB", "#FFD4F1", "#FFBFE5", "#FEAAD9", "#F597CD", "#EA85C0", "#DD74B2", "#CF65A5", "#BF5796", "#AE4B88", "#9D407A", "#8B376B", "#782F5C", "#65284E", "#532240", "#401C32", "#2E1724", "#1C1117", "#0B0B0B")
nsp_lavande <- c("#F2F2FF", "#E0E0FF", "#D0CFFF", "#C0BEFF", "#B1ADFF", "#A39DFF", "#958EF5", "#877FE8", "#7A71D8", "#6E64C7", "#6158B4", "#554C9F", "#49428A", "#3E3874", "#322E5E", "#282548", "#1D1C33", "#14141E", "#0B0B0B")
nsp_petrole <- c("#E3F9FF", "#C6EDFF", "#ABE0FD", "#92D2F5", "#7AC4EC", "#63B7E2", "#4FA8D5", "#3C9AC8", "#2B8CB9", "#1C7EA9", "#107098", "#096286", "#085574", "#0B4862", "#0E3B50", "#0F2E3D", "#0F222C", "#0E161B", "#0B0B0B")
nsp_canard <- c("#DDFDFC", "#BAF3F2", "#99E8E7", "#77DCDB", "#55CFCF", "#2DC2C2", "#00B5B5", "#00A7A7", "#009899", "#008A8B", "#007B7C", "#006C6D", "#005D5E", "#004F4F", "#004041", "#003233", "#062525", "#0B1817", "#0B0B0B")
nsp_prairie <- c("#E9FBE5", "#D1F1CA", "#BBE5B1", "#A5D99A", "#92CC85", "#7FBF71", "#6FB160", "#5FA350", "#529543", "#468737", "#3B782D", "#336A26", "#2B5B20", "#254D1C", "#1F3F18", "#1A3115", "#162412", "#10170F", "#0B0B0B")
nsp_ambre <- c("#FFF1DD", "#FFDFBC", "#FECC9E", "#F6BB81", "#EDAA67", "#E29A4E", "#D58A37", "#C77C1F", "#B86E02", "#A86100", "#975500", "#854A00", "#733F00", "#613600", "#4F2D01", "#3D2407", "#2C1C0B", "#1B130C", "#0B0B0B")
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
nsp_rouge1 <- "#9B2E33"  # coquelicot 600
nsp_rouge2 <- "#C24146"  # coquelicot 500
nsp_rouge3 <- "#FF7F7E"  # coquelicot 300
nsp_rouge4 <- "#FFD3CF"  # coquelicot 100
nsp_vert1 <- "#006C6D"  # canard 600
nsp_vert2 <- "#009899"  # canard 450
nsp_vert3 <- "#55CFCF"  # canard 250
nsp_vert4 <- "#BAF3F2"  # canard 100
nsp_jaune1 <- "#E29A4E"  # ambre 300
nsp_jaune2 <- "#F6BB81"  # ambre 200
nsp_bleu1 <- "#0B4862"  # petrole 700
nsp_bleu2 <- "#2B8CB9"  # petrole 450
nsp_bleu3 <- "#7AC4EC"  # petrole 250
nsp_bleu4 <- "#C6EDFF"  # petrole 100
nsp_orange <- "#C77C1F"  # ambre 400
nsp_gris1 <- "#6A777F"  # ardoise 500
nsp_gris2 <- "#B0BCC3"  # ardoise 250
nsp_gris3 <- "#D0D9DE"  # ardoise 150
nsp_gris4 <- "#E0E7EB"  # ardoise 100
