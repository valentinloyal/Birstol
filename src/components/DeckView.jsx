import { useState, useEffect, useRef } from "react";
import { mkCard, flat, BOX_COLOR } from "../outils.js";
import { Ico, I } from "./Icons.jsx";

export function DeckView({ deck, startDraft, onBack, onUpdate, onStudy, onSheet }) {
  const [draft, setDraft] = useState(startDraft ? { q: "", a: "" } : null);
  const qRef = useRef(null);
  const restants = deck.cards.filter((c) => (c.box || 0) < 2).length;

  useEffect(() => { if (draft && qRef.current) qRef.current.focus(); }, [draft?.id]);

  const save = () => {
    if (!draft.q.trim() || !draft.a.trim()) return;
    const cards = draft.id
      ? deck.cards.map((c) => (c.id === draft.id ? { ...c, q: draft.q.trim(), a: draft.a.trim() } : c))
      : [...deck.cards, mkCard(draft.q, draft.a)];
    onUpdate({ cards });
    setDraft(draft.id ? null : { q: "", a: "" });
  };
  const del = () => { onUpdate({ cards: deck.cards.filter((c) => c.id !== draft.id) }); setDraft(null); };

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Retour"><Ico d={I.back} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sub">{deck.cards.length} fiches</div>
          <h1 className="display" style={{ fontSize: 21, color: "var(--clair)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{deck.name}</h1>
        </div>
        <button className="iconbtn" onClick={() => onSheet({ type: "menu" })} aria-label="Options du paquet"><Ico d={I.more} /></button>
      </div>

      <div className="scroll">
        {draft ? (
          <div style={{ borderRadius: 16, padding: 15, marginBottom: 16, backgroundImage: flat("var(--violet2)") }}>
            <div className="label" style={{ marginTop: 0 }}>Question</div>
            <textarea ref={qRef} className="field" rows={2} value={draft.q} placeholder="Recto de la fiche"
              onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
            <div className="label">Réponse</div>
            <textarea className="field" rows={3} value={draft.a} placeholder="Verso de la fiche"
              onChange={(e) => setDraft({ ...draft, a: e.target.value })} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-s" style={{ height: 46 }} onClick={() => setDraft(null)}>Fermer</button>
              {draft.id && <button className="btn btn-s" style={{ height: 46, color: "var(--rouge)" }} onClick={del}>Supprimer</button>}
              <button className="btn btn-p" style={{ height: 46 }} onClick={save} disabled={!draft.q.trim() || !draft.a.trim()}>
                {draft.id ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        ) : (
          <button className="row" style={{ justifyContent: "center", color: "var(--lavande)", fontWeight: 700, marginBottom: 16, gap: 8 }}
            onClick={() => setDraft({ q: "", a: "" })}>
            <Ico d={I.plus} size={18} /> Ajouter une fiche
          </button>
        )}

        {deck.cards.map((c, i) => (
          <button key={c.id} className="row" onClick={() => setDraft({ id: c.id, q: c.q, a: c.a })}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span className="dot" style={{ backgroundImage: flat(BOX_COLOR[c.box || 0]) }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="q" style={{ display: "block" }}>{c.q}</span>
              <span className="a" style={{ display: "block" }}>{c.a}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="foot">
        <button className="btn btn-p" onClick={() => onStudy("all")} disabled={!deck.cards.length}>
          Réviser {deck.cards.length ? `· ${deck.cards.length}` : ""}
        </button>
        {restants > 0 && restants < deck.cards.length && (
          <button className="btn btn-s btn-n" onClick={() => onStudy("todo")}>Non acquis · {restants}</button>
        )}
      </div>
    </>
  );
}
