// Chrome commun des maquettes : bascule des partis typo depuis la barre d'outils.
function setType(t) {
  document.documentElement.className = 'type-' + t;
  const w = document.getElementById('whoami');
  if (w) w.textContent = 'couleur = spectre acté · typo = ' + t;
}
