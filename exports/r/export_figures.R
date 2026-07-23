# export_figures.R : squelette du manifeste de figures de l'enquête.
# Objectif : chaque figure du rapport = un fichier vectoriel nommé par identifiant
# stable + une ligne de légendes, produits par la chaîne R (jamais de capture collée).
# Généralise la convention des exports cartos du RESP 2025.
#
# Usage (depuis le repo analyse_enquete_hm, après theme_nsp appliqué) :
#   source("theme_nsp_couleurs.R"); source("theme_nsp.R"); appliquer_theme_nsp()
#   source("export_figures.R")
#   exporter_figures(data, manifeste, dossier = "figures")
#
# `manifeste` est une table id / expression de tracé / légendes. Exemple minimal
# (à compléter avec la rédaction, une ligne par figure retenue) :
#
# manifeste <- tibble::tribble(
#   ~id,                 ~trace,                                              ~titre,
#   "M1_D_general",      \(d) trace_graph_total(d, "M1_D_general"),           "Comment vous sentez-vous en général ?",
#   "M1_E_x_D",          \(d) trace_graph(d, "M1_D_general", "M1_E_travail"), "Bien-être général selon le bien-être au travail",
# )

exporter_figures <- function(data, manifeste, dossier = "figures",
                             largeur = 180, hauteur = 110) { # mm, gabarit maquette
  dir.create(dossier, showWarnings = FALSE)
  legendes <- list()
  for (i in seq_len(nrow(manifeste))) {
    ligne <- manifeste[i, ]
    p <- ligne$trace[[1]](data)
    chemin <- file.path(dossier, paste0("enquete-hm_", ligne$id, ".svg"))
    ggplot2::ggsave(chemin, plot = p, device = svglite::svglite,
                    width = largeur, height = hauteur, units = "mm")
    legendes[[i]] <- data.frame(id = ligne$id, fichier = basename(chemin), titre = ligne$titre)
    message("figure : ", chemin)
  }
  write.csv(do.call(rbind, legendes), file.path(dossier, "legendes.csv"), row.names = FALSE)
  message("manifeste : ", file.path(dossier, "legendes.csv"))
}
