import { useState, useRef, useEffect } from "react";
import { sections, blocs, fragments, fichesParSection } from "../cours.js";
import { Ico, I } from "./Icons.jsx";

/* Rendu d'une ligne : les fragments deviennent des éléments React, jamais du
   HTML injecté. Le cours vient d'un fichier importé, on ne lui fait pas
   confiance au point de le passer à dangerouslySetInnerHTML. */
function Ligne({ texte }) {
  return (
    <>
      {fragments(texte).map((f, i) =>
        f.style === "code" ? <code key={i}>{f.texte}</code>
        : f.style === "gras" ? <b key={i}>{f.texte}</b>
        : f.style === "italique" ? <i key={i}>{f.texte}</i>
        : <span key={i}>{f.texte}</span>
      )}
    </>
  );
}

function Corps({ corps }) {
  return (
    <>
      {blocs(corps).map((b, i) => {
        if (b.type === "code") return <pre key={i}><code>{b.texte}</code></pre>;
        if (b.type === "sous-titre") return <h4 key={i}>{b.texte}</h4>;
        if (b.type === "citation") return <blockquote key={i}><Ligne texte={b.texte} /></blockquote>;
        if (b.type === "liste") {
          const points = b.points.map((p, k) => <li key={k}><Ligne texte={p} /></li>);
          return b.numerotee ? <ol key={i}>{points}</ol> : <ul key={i}>{points}</ul>;
        }
        return <p key={i}><Ligne texte={b.texte} /></p>;
      })}
    </>
  );
}

/* Lecture du cours d'un paquet. `sectionVisee` ouvre directement une section,
   ce qui sert au bouton « Cours » de la révision. */
export function Cours({ deck, sectionVisee, onBack, onImporter, onSupprimer }) {
  const parties = sections(deck.cours);
  const compte = fichesParSection(deck);
  const [ouverte, setOuverte] = useState(sectionVisee || (parties[0] && parties[0].id) || null);
  const scrollRef = useRef(null);

  // Changer de section ramène en haut : sinon on arrive au milieu d'un texte.
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [ouverte]);

  const partie = parties.find((s) => s.id === ouverte) || parties[0] || null;

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Retour"><Ico d={I.back} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sub">Cours</div>
          <h1 className="display" style={{ fontSize: 21, color: "var(--clair)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {deck.name}
          </h1>
        </div>
      </div>

      {parties.length > 1 && (
        <div className="sommaire">
          {parties.map((s) => (
            <button key={s.id} className={s.id === partie?.id ? "actif" : ""} onClick={() => setOuverte(s.id)}>
              {s.titre}
              {compte.get(s.id) ? <em>{compte.get(s.id)}</em> : null}
            </button>
          ))}
        </div>
      )}

      <div className="scroll cours" ref={scrollRef}>
        {!parties.length ? (
          <div className="empty">
            <div className="mark">§</div>
            <h2 className="display">Pas encore de cours</h2>
            <p>Importez un fichier markdown : ses titres découpent le cours en sections, auxquelles vous pourrez rattacher des fiches.</p>
          </div>
        ) : (
          <>
            <h3>{partie.titre}</h3>
            <Corps corps={partie.corps} />
          </>
        )}
      </div>

      <div className="foot">
        <button className="btn btn-s" onClick={onImporter}>
          {parties.length ? "Remplacer" : "Importer un cours"}
        </button>
        {parties.length > 0 && (
          <button className="btn btn-s btn-n" style={{ color: "var(--rouge)" }} onClick={onSupprimer}>Retirer</button>
        )}
      </div>
    </>
  );
}
