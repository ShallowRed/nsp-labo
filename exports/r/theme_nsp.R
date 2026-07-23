# theme_nsp.R : habillage NSP pour la chaîne d'analyse de l'enquête
# « Hiérarchie et management » (repo analyse_enquete_hm), sans toucher au code existant.
#
# Usage, dans un rapport ou un script, APRÈS le source de utils_rapports.R :
#
#   source("theme_nsp_couleurs.R")   # les couleurs (fichier généré, même dossier)
#   source("theme_nsp.R")            # ce fichier
#   appliquer_theme_nsp("utils_rapports.R")   # même chemin que votre source() d'origine
#
# Effet : les 19 constantes de couleur (rouge1..gris4) prennent les valeurs NSP,
# les rampes Brewer "Blues" deviennent la séquentielle NSP, puis le bloc
# "# Palettes ----" de utils_rapports.R est ré-évalué tel quel : toutes les
# palettes pal_M* suivent, y compris celles ajoutées ou modifiées depuis.
# Les fonctions trace_graph* (ggplot et plotly) les retrouvent par get() à l'appel.
# Pour revenir à l'habillage d'origine : re-sourcer utils_rapports.R, rien d'autre.

if (!exists("nsp_canard")) {
  stop("Sourcer d'abord theme_nsp_couleurs.R (généré par nsp-labo, scripts/gen-theme-r.mjs)")
}

# Thème ggplot ----

theme_nsp <- function(base_size = 11, base_family = "") {
  ggplot2::theme_minimal(base_size = base_size, base_family = base_family) +
    ggplot2::theme(
      text = ggplot2::element_text(colour = nsp_palier(nsp_ardoise, 800)),
      plot.title = ggplot2::element_text(face = "bold"),
      plot.title.position = "plot",
      panel.grid.minor = ggplot2::element_blank(),
      legend.position = "bottom",
      plot.caption = ggplot2::element_text(colour = nsp_palier(nsp_ardoise, 500),
                                           size = ggplot2::rel(0.8))
    )
}

# Échelles pour de nouveaux graphiques (les archétypes de l'enquête) ----

pal_nsp_likert4 <- function(gris = TRUE) {
  v <- c(nsp_vert1, nsp_vert2, nsp_rouge3, nsp_rouge1)
  if (gris) v <- c(v, nsp_gris2, nsp_gris4)
  v
}
scale_fill_nsp_likert4 <- function(...) ggplot2::scale_fill_manual(values = pal_nsp_likert4(), ...)
scale_fill_nsp_seq <- function(n, ...) ggplot2::scale_fill_manual(values = nsp_seq(n), ...)

# Application à la chaîne existante ----

appliquer_theme_nsp <- function(chemin_utils = "utils_rapports.R") {
  constantes <- c("rouge1", "rouge2", "rouge3", "rouge4",
                  "vert1", "vert2", "vert3", "vert4",
                  "jaune1", "jaune2",
                  "bleu1", "bleu2", "bleu3", "bleu4",
                  "orange",
                  "gris1", "gris2", "gris3", "gris4")
  for (cst in constantes) {
    assign(cst, get(paste0("nsp_", cst)), envir = globalenv())
  }

  # Le global masque le package : les brewer.pal(n, "Blues") du bloc palettes
  # deviennent la séquentielle NSP (l'ordre clair->foncé est conservé).
  assign("brewer.pal", function(n, name) nsp_seq(n), envir = globalenv())

  # Ré-évaluation du bloc "# Palettes ----" de utils_rapports.R, sans ses
  # définitions de constantes (les nôtres restent en place).
  lignes <- readLines(chemin_utils)
  debut <- grep("^# Palettes", lignes)[1]
  fin <- grep("^# Graphiques", lignes)[1]
  stopifnot("bloc palettes introuvable dans utils_rapports.R" = !is.na(debut) && !is.na(fin) && debut < fin)
  bloc <- lignes[(debut + 1):(fin - 1)]
  bloc <- bloc[!grepl("^(rouge|vert|jaune|bleu|orange|gris)[0-9]* *<-", bloc)]
  eval(parse(text = bloc), envir = globalenv())

  ggplot2::theme_set(theme_nsp())
  message("Thème NSP appliqué : constantes, palettes pal_M*, rampes séquentielles, theme ggplot.")
  invisible(TRUE)
}
