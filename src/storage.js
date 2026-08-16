/* Persistance : localStorage, un seul tableau de paquets sous une seule clé. */

const KEY = "bristol:v1";

export async function loadDecks() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export async function saveDecks(decks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(decks));
  } catch (e) {
    console.error("sauvegarde impossible", e);
  }
}
