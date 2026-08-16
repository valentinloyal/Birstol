/* Petits utilitaires sans dépendance : ni React, ni DOM, ni localStorage. */

export const uid = () => Math.random().toString(36).slice(2, 10);
export const mkCard = (q, a) => ({ id: uid(), q: q.trim(), a: a.trim(), box: 0 });
export const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

/* Répartition d'un paquet par niveau Leitner : [à revoir, presque, acquis]. */
export const counts = (cards) => {
  const c = [0, 0, 0];
  cards.forEach((k) => c[k.box || 0]++);
  return c;
};
export const BOX_COLOR = ["var(--rouge)", "var(--or)", "var(--vert)"];
export const flat = (c) => `linear-gradient(${c},${c})`;

/* Date de dernière révision, en français et en relatif. */
export function relative(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return j === 1 ? "hier" : `il y a ${j} jours`;
}

/* La fiche a une taille fixe : c'est le texte qui rétrécit quand il déborde. */
export const fitSize = (t = "") => (t.length > 260 ? 17 : t.length > 150 ? 19 : t.length > 70 ? 21 : 24);
