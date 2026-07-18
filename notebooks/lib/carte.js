// Conversion des fonds de carte TopoJSON en GeoJSON pour Plot.
// Import bare (résolu par vite depuis node_modules), comme culori dans spectre.js.
import { feature } from "topojson-client";

// Retourne la France métropolitaine (départements) en FeatureCollection.
export function franceMetropolitaine(topo, objet = "departements-light") {
  const tous = feature(topo, topo.objects[objet]);
  return {
    type: "FeatureCollection",
    features: tous.features.filter((f) => !f.properties.INSEE_DEP.startsWith("97")),
  };
}
