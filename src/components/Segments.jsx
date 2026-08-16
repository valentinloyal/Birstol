import { counts, BOX_COLOR } from "../outils.js";

/* Barre de progression d'un paquet : rouge / orange / vert, proportionnelle. */
export function Segments({ cards }) {
  const [a, b, c] = counts(cards);
  const t = Math.max(1, cards.length);
  return (
    <div className="seg">
      {[a, b, c].map((n, i) => (
        <i key={i} style={{ width: `${(n / t) * 100}%`, backgroundColor: BOX_COLOR[i] }} />
      ))}
    </div>
  );
}
