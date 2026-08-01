# figure-G40.R : « à quoi servent les outils de pilotage ? », selon le statut.
# Figure demandée à refaire de zéro à la charte. Deux modalités sans ordre ni
# connotation : palette neutre2. Écrit à la main, non exécuté sur ce poste (R absent).
#
# Prérequis : source("theme_nsp_couleurs.R") puis source("theme_nsp.R").

library(ggplot2)

# Données transmises (feuille « avec outils pilotage »), en % de répondants.
g40 <- data.frame(
  statut = factor(
    rep(c("Titulaire civil", "Personnel médical hospitalier",
          "Fonctionnaire élève ou stagiaire", "CDI", "CDD"), each = 2),
    levels = rev(c("Titulaire civil", "Personnel médical hospitalier",
                   "Fonctionnaire élève ou stagiaire", "CDI", "CDD"))
  ),
  usage = factor(rep(c("organiser les journées de travail",
                       "mesurer le temps de travail"), times = 5),
                 levels = c("organiser les journées de travail",
                            "mesurer le temps de travail")),
  part = c(23, 28.2, 30.1, 14.6, 29.7, 23.2, 27.3, 24.8, 31, 29.8)
)

p_g40 <- ggplot(g40, aes(x = part, y = statut, fill = usage)) +
  geom_col(position = position_dodge(width = 0.7), width = 0.6) +
  geom_text(aes(label = paste0(format(part, decimal.mark = ",", trim = TRUE), " %")),
            position = position_dodge(width = 0.7), hjust = -0.15,
            size = 3.2, colour = nsp_bleu1) +
  scale_fill_manual(values = nsp_neutre2, name = NULL) +
  scale_x_continuous(limits = c(0, 40), breaks = seq(0, 40, 10),
                     position = "top", expand = c(0, 0)) +
  labs(x = NULL, y = NULL) +
  theme_nsp()

# Le titre, le champ et la note de lecture restent dans la maquette InDesign :
# ne rien mettre ici, la mise en page les pose au-dessus et au-dessous du cadre.

# Export : svglite, texte éditable (voir README, section « Export SVG »).
ggsave("enquete-hm_G40_outils-pilotage.svg", p_g40,
       device = svglite::svglite, width = 180, height = 110, units = "mm")

# Note : la seconde figure annoncée (G45) n'était pas dans le fichier de données
# reçu, qui ne contient qu'une série de croisements (statut x deux usages).
