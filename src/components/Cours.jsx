import { useState, useRef, useEffect } from "react";
import { sections, blocs, fragments, fichesParSection } from "../cours.js";
import { compterSection } from "../revision.js";
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
export function Cours({ deck, sectionVisee, onBack, onImporter, onReviser, onMenu, onNouvelleFiche }) {
  const parties = sections(deck.cours);
  const compte = fichesParSection(deck);
  const [ouverte, setOuverte] = useState(sectionVisee || (parties[0] && parties[0].id) || null);
  const scrollRef = useRef(null);

  // Changer de section ramène en haut : sinon on arrive au milieu d'un texte.
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [ouverte]);

  const partie = parties.find((s) => s.id === ouverte) || parties[0] || null;
  const aReviser = partie ? compterSection(deck, partie.id) : 0;
  const rang = partie ? parties.findIndex((s) => s.id === partie.id) : -1;
  const precedente = rang > 0 ? parties[rang - 1] : null;
  const suivante = rang >= 0 && rang < parties.length - 1 ? parties[rang + 1] : null;

  /* Sélection dans le cours : lire, repérer un passage, en faire une fiche.
     La barre s'affiche en BAS de l'écran et non près du texte : sur Android,
     la barre native de sélection occupe déjà les abords immédiats. */
  const [selection, setSelection] = useState("");
  useEffect(() => {
    const relire = () => {
      const s = window.getSelection();
      const texte = s ? s.toString().trim() : "";
      const dedans = s && s.rangeCount && scrollRef.current
        && scrollRef.current.contains(s.getRangeAt(0).commonAncestorContainer);
      setSelection(texte.length >= 3 && dedans ? texte.replace(/\s+/g, " ") : "");
    };
    document.addEventListener("selectionchange", relire);
    return () => document.removeEventListener("selectionchange", relire);
  }, []);

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
        {parties.length > 0 && (
          <button className="iconbtn" onClick={onMenu} aria-label="Options du cours"><Ico d={I.more} /></button>
        )}
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

            {/* Navigation en fin de lecture : on arrive au bout d'une section,
                on enchaîne sans remonter chercher le sommaire tout en haut. */}
            <div className="suite">
              {precedente && (
                <button onClick={() => setOuverte(precedente.id)}>
                  <small>Section précédente</small>
                  <b>{precedente.titre}</b>
                </button>
              )}
              {suivante ? (
                <button className="prochaine" onClick={() => setOuverte(suivante.id)}>
                  <small>Section suivante</small>
                  <b>{suivante.titre}</b>
                </button>
              ) : (
                <p className="fin">Fin du cours.</p>
              )}
            </div>
          </>
        )}
      </div>

      {selection && (
        <button className="depuis-selection" onClick={() => {
          onNouvelleFiche(selection, partie?.id || "");
          window.getSelection()?.removeAllRanges();
          setSelection("");
        }}>
          <span className="pastille"><Ico d={I.plus} size={16} /></span>
          <span>
            <b>Faire une fiche de ce passage</b>
            <small>{selection.length > 46 ? selection.slice(0, 46) + "…" : selection}</small>
          </span>
        </button>
      )}

      <div className="foot">
        {!parties.length ? (
          <button className="btn btn-p" onClick={onImporter}>Importer un cours</button>
        ) : aReviser ? (
          <button className="btn btn-p" onClick={() => onReviser(partie.id)}>
            Réviser cette section · {aReviser}
          </button>
        ) : (
          <button className="btn btn-s" disabled>Aucune fiche dans cette section</button>
        )}
      </div>
    </>
  );
}
