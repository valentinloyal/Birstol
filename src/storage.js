/* Persistance : localStorage, un seul tableau de paquets sous une seule clé. */

import { migrerPaquets } from "./revision.js";

const KEY = "bristol:v1";

export async function loadDecks() {
  let brut;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    brut = Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
  // Les paquets d'avant les dates de révision n'ont ni `due` ni `interval` :
  // on les complète ici, à l'unique porte d'entrée des données, et on réécrit
  // aussitôt pour que la migration ne soit pas refaite à chaque ouverture.
  const { paquets, touche } = migrerPaquets(brut, Date.now());
  if (touche) saveDecks(paquets);
  return paquets;
}

export async function saveDecks(decks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(decks));
  } catch (e) {
    console.error("sauvegarde impossible", e);
  }
}
