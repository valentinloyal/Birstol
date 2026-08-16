import { useState, useEffect, useRef } from "react";
import { mkCard, BOX_COLOR } from "../outils.js";
import { sections } from "../cours.js";
import { estActive } from "../revision.js";
import { Ico, I } from "./Icons.jsx";

export function DeckView({ deck, startDraft, onBack, onUpdate, onStudy, onCours, onSheet }) {
  const [draft, setDraft] = useState(startDraft ? { q: "", a: "" } : null);
  const [recherche, setRecherche] = useState("");
  /* Sélection multiple. Sur un paquet de 76 fiches, ouvrir chaque fiche pour
     lui donner sa section est impraticable : il faut pouvoir agir sur un lot.
     Le mode est explicite plutôt que déclenché par un appui long, qui entre en
     conflit avec la sélection de texte du système. */
  const [choisies, setChoisies] = useState(null);
  const qRef = useRef(null);
  // Les fiches en pause ne sont proposées à aucune révision : elles ne comptent
  // donc dans aucun des deux boutons du pied.
  const actives = deck.cards.filter(estActive);
  const restants = actives.filter((c) => (c.box || 0) < 2).length;
  const enPause = deck.cards.length - actives.length;

  /* Recherche sans accent ni casse : on tape « heritage », on trouve
     « héritage ». Le numéro affiché reste celui de la fiche dans le paquet,
     pas celui du résultat, pour ne pas perdre ses repères. */
  const sansAccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const terme = sansAccent(recherche.trim());
  const fiches = deck.cards
    .map((c, i) => ({ c, rang: i }))
    .filter(({ c }) => !terme || sansAccent(c.q + " " + c.a).includes(terme));

  useEffect(() => { if (draft && qRef.current) qRef.current.focus(); }, [draft?.id]);

  const parties = sections(deck.cours);

  const save = () => {
    if (!draft.q.trim() || !draft.a.trim()) return;
    // `section` absent plutôt que vide : une fiche sans lien n'a pas de champ.
    const lien = draft.section ? { section: draft.section } : {};
    const pause = draft.suspendue ? { suspendue: true } : {};
    const cards = draft.id
      ? deck.cards.map((c) => {
          if (c.id !== draft.id) return c;
          const { section, suspendue, ...reste } = c;
          return { ...reste, q: draft.q.trim(), a: draft.a.trim(), ...lien, ...pause };
        })
      : [...deck.cards, { ...mkCard(draft.q, draft.a), ...lien }];
    onUpdate({ cards });
    setDraft(draft.id ? null : { q: "", a: "", section: draft.section });
  };
  const del = () => { onUpdate({ cards: deck.cards.filter((c) => c.id !== draft.id) }); setDraft(null); };

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Retour"><Ico d={I.back} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sub">{deck.cards.length} fiches{enPause ? ` · ${enPause} en pause` : ""}</div>
          <h1 className="display" style={{ fontSize: 21, color: "var(--clair)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{deck.name}</h1>
        </div>
        {deck.cards.length > 1 && (
          <button className="iconbtn" aria-label={choisies ? "Quitter la sélection" : "Sélectionner des fiches"}
            onClick={() => setChoisies(choisies ? null : new Set())}>
            <Ico d={choisies ? I.close : I.cocher} />
          </button>
        )}
        <button className="iconbtn" onClick={onCours} aria-label="Cours du paquet"><Ico d={I.cours} /></button>
        <button className="iconbtn" onClick={() => onSheet({ type: "menu" })} aria-label="Options du paquet"><Ico d={I.more} /></button>
      </div>

      <div className="scroll">
        {draft ? (
          <div style={{ borderRadius: 16, padding: 15, marginBottom: 16, backgroundColor: "var(--violet2)" }}>
            <div className="label" style={{ marginTop: 0 }}>Question</div>
            <textarea ref={qRef} className="field" rows={2} value={draft.q} placeholder="Recto de la fiche"
              onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
            <div className="label">Réponse</div>
            <textarea className="field" rows={3} value={draft.a} placeholder="Verso de la fiche"
              onChange={(e) => setDraft({ ...draft, a: e.target.value })} />
            {parties.length > 0 && (
              <>
                <div className="label">Section du cours</div>
                <select className="field" value={draft.section || ""}
                  onChange={(e) => setDraft({ ...draft, section: e.target.value })}>
                  <option value="">Aucune</option>
                  {parties.map((s) => <option key={s.id} value={s.id}>{s.titre}</option>)}
                </select>
              </>
            )}
            {draft.id && (
              <button className="bascule" onClick={() => setDraft({ ...draft, suspendue: !draft.suspendue })}
                aria-pressed={!!draft.suspendue}>
                <span>
                  <b>Mettre en pause</b>
                  <small>{draft.suspendue ? "Écartée des révisions et des compteurs" : "La fiche reste dans le paquet, mais sort des révisions"}</small>
                </span>
                <i className={draft.suspendue ? "on" : ""} />
              </button>
            )}
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

        {deck.cards.length > 6 && !draft && (
          <div className="chercher">
            <Ico d={I.loupe} size={17} />
            <input value={recherche} placeholder="Chercher dans les fiches"
              onChange={(e) => setRecherche(e.target.value)} />
            {recherche && (
              <button onClick={() => setRecherche("")} aria-label="Effacer la recherche">
                <Ico d={I.close} size={16} />
              </button>
            )}
          </div>
        )}

        {terme && (
          <p className="note" style={{ margin: "0 0 10px" }}>
            {fiches.length === 0
              ? "Aucune fiche ne contient ce mot."
              : `${fiches.length} fiche${fiches.length > 1 ? "s" : ""} sur ${deck.cards.length}`}
          </p>
        )}

        {fiches.map(({ c, rang }) => (
          <button key={c.id}
            className={"row" + (c.suspendue ? " en-pause" : "") + (choisies?.has(c.id) ? " choisie" : "")}
            onClick={() => {
              if (!choisies) { setDraft({ id: c.id, q: c.q, a: c.a, section: c.section || "", suspendue: !!c.suspendue }); return; }
              // Forme fonctionnelle : deux appuis rapprochés liraient sinon le
              // même état, et le second effacerait la sélection du premier.
              setChoisies((avant) => {
                const suite = new Set(avant);
                suite.has(c.id) ? suite.delete(c.id) : suite.add(c.id);
                return suite;
              });
            }}>
            {choisies
              ? <span className={"case" + (choisies.has(c.id) ? " on" : "")} />
              : <span className="n">{String(rang + 1).padStart(2, "0")}</span>}
            <span className="dot" style={{ backgroundColor: BOX_COLOR[c.box || 0] }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="q" style={{ display: "block" }}>{c.q}</span>
              <span className="a" style={{ display: "block" }}>{c.suspendue ? "En pause · " : ""}{c.a}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="foot">
        {choisies ? (
          <>
            <button className="btn btn-s" onClick={() => setChoisies((avant) =>
              avant.size === fiches.length ? new Set() : new Set(fiches.map(({ c }) => c.id))
            )}>
              {choisies.size === fiches.length ? "Aucune" : "Toutes"}
            </button>
            <button className="btn btn-p" disabled={!choisies.size}
              onClick={() => onSheet({ type: "lot", ids: [...choisies], vider: () => setChoisies(new Set()) })}>
              {choisies.size ? `${choisies.size} sélectionnée${choisies.size > 1 ? "s" : ""}` : "Aucune sélection"}
            </button>
          </>
        ) : (
        <button className="btn btn-p" onClick={() => onStudy("all")} disabled={!actives.length}>
          Réviser {actives.length ? `· ${actives.length}` : ""}
        </button>
        )}
        {!choisies && restants > 0 && restants < actives.length && (
          <button className="btn btn-s btn-n" onClick={() => onStudy("todo")}>Non acquis · {restants}</button>
        )}
      </div>
    </>
  );
}
