import { useState, useEffect, useMemo, useRef } from "react";
import { shuffle, fitSize } from "../outils.js";
import { noter } from "../revision.js";
import { Ico, I } from "./Icons.jsx";

const GRADES = [
  { key: 0, label: "À revoir", hint: "1", color: "var(--rouge)", fg: "#FFF" },
  { key: 1, label: "Presque", hint: "2", color: "var(--or)", fg: "#2A0F4C" },
  { key: 2, label: "Acquis", hint: "3", color: "var(--vert)", fg: "#0D3B2E" },
];

/* Une session porte sur une file de références { paquetId, ficheId } construite
   en amont par revision.js. Elle peut donc traverser plusieurs paquets, ce qui
   est tout l'intérêt de la file du jour.

   La file est figée au montage : chaque fiche est vue une seule fois, et noter
   « À revoir » ne la remet pas en fin de file. Les ratées sont reproposées à
   l'écran de fin, dans une nouvelle session explicite. Ne pas régresser. */
export function Study({ decks, fileInitiale, sousTitre, onNoter, onCorriger, onCours, onQuit }) {
  const [queue, setQueue] = useState(fileInitiale);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState([0, 0, 0]);
  const [missed, setMissed] = useState([]);
  /* Pile des notes posées, pour pouvoir revenir en arrière. Un mauvais appui
     sur les trois boutons ne coûte plus une couleur mais jusqu'à 21 jours
     d'absence : il faut pouvoir le reprendre. */
  const [histoire, setHistoire] = useState([]);
  /* Les paquets viennent d'un LLM : les coquilles se rencontrent au moment
     même où l'on révise. On corrige sur place plutôt que de quitter, chercher
     la fiche dans la liste, corriger, et relancer une session. */
  const [correction, setCorrection] = useState(null);
  /* Balayage : la fiche suit le doigt, sinon rien ne dit que le geste est pris.
     `glisse` est le décalage en cours, null quand aucun doigt n'est posé. */
  const [glisse, setGlisse] = useState(null);
  const depart = useRef(null);
  /* Un balayage abouti peut être suivi d'un clic synthétisé par le navigateur.
     On retient l'instant de fin du geste plutôt qu'un drapeau : selon les cas le
     clic ne vient jamais, et un drapeau resté armé avalerait le clic suivant. */
  const finDuGeste = useRef(0);

  const ref = queue[pos];
  const paquet = useMemo(() => decks.find((d) => d.id === ref?.paquetId), [decks, ref]);
  const card = useMemo(() => paquet?.cards.find((c) => c.id === ref?.ficheId), [paquet, ref]);
  const done = pos >= queue.length;

  // Un paquet supprimé pendant la session laisserait une référence morte.
  useEffect(() => { if (!done && !card) setPos((p) => p + 1); }, [done, card]);

  const grade = (g) => {
    if (!card) return;
    const avant = { box: card.box, interval: card.interval, due: card.due };
    onNoter(ref.paquetId, ref.ficheId, noter(g, card.interval, Date.now()));
    setHistoire((h) => [...h, { ref, avant, note: g }]);
    setTally((t) => t.map((n, i) => (i === g ? n + 1 : n)));
    if (g === 0) setMissed((m) => [...m, ref]);
    setFlipped(false);
    setTimeout(() => setPos((p) => p + 1), 130);
  };

  /* Revient sur la dernière note : l'échéance de la fiche est remise telle
     qu'elle était, et la session recule d'une position. */
  const annuler = () => {
    if (!histoire.length) return;
    const dernier = histoire[histoire.length - 1];
    onNoter(dernier.ref.paquetId, dernier.ref.ficheId, dernier.avant);
    setHistoire((h) => h.slice(0, -1));
    setTally((t) => t.map((n, i) => (i === dernier.note ? Math.max(0, n - 1) : n)));
    if (dernier.note === 0) setMissed((m) => m.filter((r) => r !== dernier.ref));
    setPos((p) => Math.max(0, p - 1));
    setFlipped(false);
  };

  useEffect(() => {
    const k = (e) => {
      if (done || correction) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && ["1", "2", "3"].includes(e.key)) grade(Number(e.key) - 1);
      else if (e.key === "Backspace") { e.preventDefault(); annuler(); }
      else if (e.key === "Escape") onQuit();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  /* Seuil de déclenchement du balayage, en pixels. En deçà, la fiche revient
     en place et le geste est traité comme une simple pression. */
  const SEUIL = 70;

  /* On n'arme le geste que réponse visible : balayer une question qu'on n'a pas
     retournée ne veut rien dire. Sur une fiche face question, le doigt retombe
     donc sur le clic, qui la retourne comme avant. */
  const debutGeste = (e) => {
    if (correction || !flipped) return;
    depart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, bouge: false };
    setGlisse(0);
  };
  const pendantGeste = (e) => {
    if (!depart.current) return;
    const dx = e.touches[0].clientX - depart.current.x;
    const dy = e.touches[0].clientY - depart.current.y;
    // Un geste vertical, c'est un défilement de la réponse : on ne le vole pas.
    if (!depart.current.bouge && Math.abs(dy) > Math.abs(dx)) { depart.current = null; setGlisse(null); return; }
    if (Math.abs(dx) > 6) depart.current.bouge = true;
    depart.current.dx = dx;
    setGlisse(dx);
  };
  const finGeste = () => {
    if (!depart.current) return;
    const { dx, bouge } = depart.current;
    depart.current = null;
    setGlisse(null);
    if (!bouge) return;              // pression simple : c'est le clic qui retourne
    finDuGeste.current = Date.now();  // et on neutralise le clic synthétisé qui suit
    if (dx >= SEUIL) grade(2);
    else if (dx <= -SEUIL) grade(0);
  };

  const relancer = (refs) => {
    setQueue(shuffle(refs));
    setPos(0);
    setTally([0, 0, 0]);
    setMissed([]);
    setHistoire([]);
    setFlipped(false);
  };

  if (done) {
    return (
      <div className="study">
        <div className="scroll" style={{ paddingTop: 26 }}>
          <div className="empty">
            <div className="mark" style={{ color: "var(--vert)" }}>✓</div>
            <h2 className="display">Session terminée</h2>
            <p>
              {queue.length > 1
                ? queue.length + " fiches vues, chacune une seule fois."
                : "1 fiche vue."}
            </p>
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
        {histoire.length > 0 && (
          <button className="revenir" onClick={annuler}>
            <Ico d={I.annuler} size={15} /> Annuler la dernière note
          </button>
        )}
        <div className="foot">
          <button className="btn btn-s" onClick={onQuit}>Terminer</button>
          {missed.length > 0 ? (
            <button className="btn btn-p" onClick={() => relancer(missed)}>Revoir les {missed.length} ratées</button>
          ) : (
            <button className="btn btn-p" onClick={() => relancer(fileInitiale)}>Recommencer</button>
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
        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <div className="sub" style={{ fontSize: 12, marginBottom: 0 }}>{pos + 1} / {queue.length}</div>
          {sousTitre && (
            <div className="sub" style={{ fontSize: 10, marginBottom: 0, color: "var(--sourdine)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sousTitre === "jour" ? paquet?.name : sousTitre}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
          {histoire.length > 0 && (
            <button className="iconbtn" onClick={annuler} aria-label="Annuler la dernière note">
              <Ico d={I.annuler} size={18} />
            </button>
          )}
          {card?.section && (
            <button className="iconbtn" aria-label="Voir le cours"
              onClick={() => onCours(ref.paquetId, card.section)}>
              <Ico d={I.cours} size={18} />
            </button>
          )}
          <button className="iconbtn" aria-label="Corriger la fiche"
            onClick={() => card && setCorrection({ q: card.q, a: card.a })}>
            <Ico d={I.crayon} size={18} />
          </button>
        </div>
      </div>

      {correction && (
        <div className="sheet-bg" onClick={() => setCorrection(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grip" />
            <h2 className="display">Corriger la fiche</h2>
            <p className="lede">La session reprend où elle en est, sans reperdre votre place.</p>
            <div className="label" style={{ marginTop: 0 }}>Question</div>
            <textarea className="field" rows={3} value={correction.q} autoFocus
              onChange={(e) => setCorrection({ ...correction, q: e.target.value })} />
            <div className="label">Réponse</div>
            <textarea className="field" rows={4} value={correction.a}
              onChange={(e) => setCorrection({ ...correction, a: e.target.value })} />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-s" onClick={() => setCorrection(null)}>Annuler</button>
              <button className="btn btn-p" disabled={!correction.q.trim() || !correction.a.trim()}
                onClick={() => {
                  onCorriger(ref.paquetId, ref.ficheId, { q: correction.q.trim(), a: correction.a.trim() });
                  setCorrection(null);
                }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stage">
        <div className="stack">
          {rest > 2 && <div className="ghost" style={{ transform: "translateY(14px) scale(.94)" }} />}
          {rest > 1 && <div className="ghost" style={{ transform: "translateY(7px) scale(.97)", opacity: .3 }} />}
          {/* Deux repères sous la fiche, révélés par le balayage. */}
          {glisse !== null && (
            <>
              <div className="marque gauche" style={{ opacity: Math.min(1, Math.max(0, -glisse) / SEUIL) }}>À revoir</div>
              <div className="marque droite" style={{ opacity: Math.min(1, Math.max(0, glisse) / SEUIL) }}>Acquis</div>
            </>
          )}
          <div className={"flip" + (flipped ? " on" : "")}
            onClick={() => { if (Date.now() - finDuGeste.current < 500) return; setFlipped((f) => !f); }}
            onTouchStart={debutGeste} onTouchMove={pendantGeste} onTouchEnd={finGeste} onTouchCancel={finGeste}
            style={glisse !== null
              ? { transform: `translateX(${glisse}px) rotateY(180deg) rotate(${glisse / 28}deg)`, transition: "none" }
              : undefined}
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
