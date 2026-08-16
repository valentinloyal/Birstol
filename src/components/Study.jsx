import { useState, useEffect, useMemo } from "react";
import { shuffle, fitSize } from "../outils.js";
import { Ico, I } from "./Icons.jsx";

const GRADES = [
  { key: 0, label: "À revoir", hint: "1", color: "var(--rouge)", fg: "#FFF" },
  { key: 1, label: "Presque", hint: "2", color: "var(--or)", fg: "#2A0F4C" },
  { key: 2, label: "Acquis", hint: "3", color: "var(--vert)", fg: "#0D3B2E" },
];

export function Study({ deck, filter, onUpdate, onQuit }) {
  const [queue, setQueue] = useState(() => {
    let src = deck.cards;
    if (filter === "todo") src = src.filter((c) => (c.box || 0) < 2);
    return shuffle(src).sort((a, b) => (a.box || 0) - (b.box || 0)).map((c) => c.id);
  });
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState([0, 0, 0]);
  const [missed, setMissed] = useState([]);

  const card = useMemo(() => deck.cards.find((c) => c.id === queue[pos]), [deck.cards, queue, pos]);
  const done = pos >= queue.length;

  const grade = (g) => {
    if (!card) return;
    onUpdate({
      cards: deck.cards.map((c) => (c.id === card.id ? { ...c, box: g } : c)),
      lastStudied: Date.now(),
    });
    setTally((t) => t.map((n, i) => (i === g ? n + 1 : n)));
    if (g === 0) setMissed((m) => [...m, card.id]);
    setFlipped(false);
    setTimeout(() => setPos((p) => p + 1), 130);
  };

  useEffect(() => {
    const k = (e) => {
      if (done) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && ["1", "2", "3"].includes(e.key)) grade(Number(e.key) - 1);
      else if (e.key === "Escape") onQuit();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const relancer = (ids) => { setQueue(shuffle(ids)); setPos(0); setTally([0, 0, 0]); setMissed([]); setFlipped(false); };

  if (done) {
    return (
      <div className="study">
        <div className="scroll" style={{ paddingTop: 26 }}>
          <div className="empty">
            <div className="mark" style={{ color: "var(--vert)" }}>✓</div>
            <h2 className="display">Session terminée</h2>
            <p>{queue.length} fiche{queue.length > 1 ? "s" : ""} vue{queue.length > 1 ? "s" : ""}, chacune une seule fois.</p>
          </div>
          <div className="tally">
            {GRADES.map((g, i) => (
              <div key={g.key}>
                <b style={{ color: g.color }}>{tally[i]}</b>
                <span>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="foot">
          <button className="btn btn-s" onClick={onQuit}>Terminer</button>
          {missed.length > 0 ? (
            <button className="btn btn-p" onClick={() => relancer(missed)}>Revoir les {missed.length} ratées</button>
          ) : (
            <button className="btn btn-p" onClick={() => relancer(deck.cards.map((c) => c.id))}>Recommencer</button>
          )}
        </div>
      </div>
    );
  }

  const rest = queue.length - pos;
  return (
    <div className="study">
      <div className="progress"><i style={{ width: `${(pos / queue.length) * 100}%` }} /></div>
      <div className="topbar" style={{ paddingBottom: 2 }}>
        <button className="iconbtn" onClick={onQuit} aria-label="Quitter la révision"><Ico d={I.close} /></button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div className="sub" style={{ fontSize: 12, marginBottom: 0 }}>{pos + 1} / {queue.length}</div>
        </div>
        <div style={{ width: 42 }} />
      </div>

      <div className="stage">
        <div className="stack">
          {rest > 2 && <div className="ghost" style={{ transform: "translateY(14px) scale(.94)" }} />}
          {rest > 1 && <div className="ghost" style={{ transform: "translateY(7px) scale(.97)", opacity: .3 }} />}
          <div className={"flip" + (flipped ? " on" : "")} onClick={() => setFlipped((f) => !f)}
            role="button" tabIndex={0} aria-label="Retourner la fiche">
            <div className="face">
              <div className="rule" /><div className="marge" />
              <div className="tag">Question</div>
              <div className="body"><span style={{ fontSize: fitSize(card?.q) }}>{card?.q}</span></div>
            </div>
            <div className="face back">
              <div className="rule" /><div className="marge" />
              <div className="tag" style={{ color: "#B8860F" }}>Réponse</div>
              <div className="body"><span style={{ fontSize: fitSize(card?.a) }}>{card?.a}</span></div>
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grade">
          {GRADES.map((g) => (
            <button key={g.key} style={{ backgroundColor: g.color, color: g.fg }} onClick={() => grade(g.key)}>
              {g.label}<small>touche {g.hint}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="grade" style={{ justifyContent: "center" }}>
          <div className="hint">Touchez la fiche pour voir la réponse</div>
        </div>
      )}
    </div>
  );
}
