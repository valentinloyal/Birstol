import { trouverSection, blocs, fragments } from "../cours.js";

/* Une section de cours montrée par-dessus la révision. C'est une feuille et
   non une vue : la session reste montée derrière, on ne perd pas sa place. */
export function SectionSheet({ deck, section, onClose }) {
  const partie = deck ? trouverSection(deck.cours, section) : null;

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        {!partie ? (
          <>
            <h2 className="display">Section introuvable</h2>
            <p className="lede">
              Le cours a dû être remplacé depuis que cette fiche y a été rattachée.
              Rouvrez la fiche pour la relier à une section actuelle.
            </p>
          </>
        ) : (
          <>
            <h2 className="display">{partie.titre}</h2>
            <div className="cours" style={{ maxHeight: "58vh", overflowY: "auto" }}>
              {blocs(partie.corps).map((b, i) => {
                if (b.type === "code") return <pre key={i}><code>{b.texte}</code></pre>;
                if (b.type === "sous-titre") return <h4 key={i}>{b.texte}</h4>;
                if (b.type === "citation") return <blockquote key={i}>{b.texte}</blockquote>;
                if (b.type === "liste") {
                  const points = b.points.map((p, k) => <li key={k}>{rendre(p)}</li>);
                  return b.numerotee ? <ol key={i}>{points}</ol> : <ul key={i}>{points}</ul>;
                }
                return <p key={i}>{rendre(b.texte)}</p>;
              })}
            </div>
          </>
        )}
        <button className="btn btn-s" style={{ marginTop: 16 }} onClick={onClose}>Reprendre la révision</button>
      </div>
    </div>
  );
}

const rendre = (texte) =>
  fragments(texte).map((f, i) =>
    f.style === "code" ? <code key={i}>{f.texte}</code>
    : f.style === "gras" ? <b key={i}>{f.texte}</b>
    : f.style === "italique" ? <i key={i}>{f.texte}</i>
    : <span key={i}>{f.texte}</span>
  );
