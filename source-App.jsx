import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Bristol — fiches de révision                                       */
/*  Identité : fiche bristol réglée Seyès, marge rouge, encre bleue.   */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Newsreader:opsz,wght@6..72,300;6..72,500&family=JetBrains+Mono:wght@400;600&display=swap');

.bx * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.bx {
  --encre:#16223D; --encre2:#1E2E4E; --encre3:#2A3B60;
  --papier:#FBFAF6; --papier2:#EDE7DA;
  --seyes:#8E8ACB; --marge:#D8434E; --vert:#3F7D62; --ambre:#C4872B;
  --clair:#E9E5DA; --sourdine:#93A0BE;
  --ui:'Bricolage Grotesque', system-ui, sans-serif;
  --serif:'Newsreader', Georgia, serif;
  --mono:'JetBrains Mono', ui-monospace, monospace;
  position:fixed; inset:0; overflow:hidden;
  background:var(--encre); color:var(--clair);
  font-family:var(--ui); font-size:16px; line-height:1.45;
  display:flex; justify-content:center;
}
.bx-shell { width:100%; max-width:520px; height:100%; display:flex; flex-direction:column; position:relative; }
.bx button { font-family:inherit; font-size:inherit; color:inherit; background:none; border:none; cursor:pointer; }
.bx :focus-visible { outline:2px solid var(--seyes); outline-offset:3px; border-radius:4px; }
.bx input, .bx textarea { font-family:inherit; font-size:16px; }

/* --- barres --- */
.topbar { display:flex; align-items:center; gap:12px; padding:16px 18px 10px; flex:0 0 auto; }
.topbar h1 { font-size:26px; font-weight:800; letter-spacing:-.02em; margin:0; }
.topbar .sub { font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--sourdine); }
.iconbtn { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background:var(--encre2); color:var(--clair); flex:0 0 auto; transition:background .15s; }
.iconbtn:active { background:var(--encre3); }
.scroll { flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:0 18px 140px; }

/* --- ligne de stats --- */
.tally { display:flex; gap:8px; margin:4px 0 18px; }
.tally div { flex:1; background:var(--encre2); border-radius:12px; padding:10px 12px; }
.tally b { display:block; font-family:var(--mono); font-size:20px; font-weight:600; }
.tally span { font-size:11px; color:var(--sourdine); letter-spacing:.06em; text-transform:uppercase; }

/* --- fiche dans la liste --- */
.deck { position:relative; width:100%; text-align:left; background:var(--papier); color:var(--encre);
  border-radius:10px; padding:14px 16px 14px 30px; margin-bottom:12px; overflow:hidden;
  box-shadow:0 1px 0 rgba(0,0,0,.35), 0 10px 20px -14px rgba(0,0,0,.9); transition:transform .12s; }
.deck:active { transform:scale(.985); }
.deck::before { content:""; position:absolute; left:20px; top:0; bottom:0; width:1px; background:var(--marge); opacity:.5; }
.deck::after { content:""; position:absolute; inset:0; pointer-events:none;
  background:repeating-linear-gradient(to bottom, transparent 0 25px, rgba(142,138,203,.22) 25px 26px); }
.deck h3 { position:relative; z-index:1; margin:0 0 2px; font-size:18px; font-weight:600; letter-spacing:-.01em; }
.deck .meta { position:relative; z-index:1; font-family:var(--mono); font-size:11px; color:#6b7285; }
.seg { position:relative; z-index:1; display:flex; gap:2px; height:5px; margin-top:12px; border-radius:99px; overflow:hidden; background:var(--papier2); }
.seg i { display:block; height:100%; }

/* --- boutons de pied --- */
.foot { position:absolute; left:0; right:0; bottom:0; padding:14px 18px calc(18px + env(safe-area-inset-bottom));
  display:flex; gap:10px; background:linear-gradient(to top, var(--encre) 62%, rgba(22,34,61,0)); }
.btn { flex:1; height:52px; border-radius:14px; font-weight:600; font-size:16px; display:grid; place-items:center; transition:transform .12s, filter .15s; }
.btn:active { transform:scale(.97); }
.btn-p { background:var(--marge); color:#fff; }
.btn-s { background:var(--encre2); color:var(--clair); box-shadow:inset 0 0 0 1px var(--encre3); }
.btn-g { background:var(--papier); color:var(--encre); }
.btn[disabled] { opacity:.4; pointer-events:none; }

/* --- vide --- */
.empty { text-align:center; padding:54px 10px; }
.empty .mark { font-family:var(--serif); font-size:52px; color:var(--encre3); }
.empty h2 { font-size:19px; margin:6px 0 6px; font-weight:600; }
.empty p { color:var(--sourdine); font-size:14px; margin:0 auto; max-width:300px; }

/* --- révision --- */
.study { position:absolute; inset:0; background:var(--encre); display:flex; flex-direction:column; z-index:20; }
.progress { height:3px; background:var(--encre2); flex:0 0 auto; }
.progress i { display:block; height:100%; background:var(--seyes); transition:width .3s; }
.stage { flex:1 1 auto; display:grid; place-items:center; padding:8px 18px 0; perspective:1400px; min-height:0; }
.stack { position:relative; width:100%; height:100%; max-height:460px; }
.ghost { position:absolute; inset:0; background:var(--papier2); border-radius:12px; opacity:.22; }
.flip { position:absolute; inset:0; transition:transform .5s cubic-bezier(.2,.8,.2,1); transform-style:preserve-3d; cursor:pointer; }
.flip.on { transform:rotateY(180deg); }
.face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  background:var(--papier); color:var(--encre); border-radius:12px; overflow:hidden;
  box-shadow:0 1px 0 rgba(0,0,0,.4), 0 26px 40px -26px #000; display:flex; flex-direction:column; }
.face.back { transform:rotateY(180deg); }
.face .rule { position:absolute; inset:0; pointer-events:none;
  background:repeating-linear-gradient(to bottom, transparent 0 29px, rgba(142,138,203,.25) 29px 30px); }
.face .marge { position:absolute; left:34px; top:0; bottom:0; width:1px; background:var(--marge); opacity:.45; }
.face .tag { position:relative; z-index:1; font-family:var(--mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
  color:#8a90a3; padding:16px 20px 0 46px; flex:0 0 auto; }
.face .body { position:relative; z-index:1; flex:1 1 auto; overflow-y:auto; padding:10px 22px 22px 46px;
  font-family:var(--serif); font-size:23px; line-height:1.32; font-weight:300; display:flex; align-items:center; }
.face .body span { width:100%; white-space:pre-wrap; }
.hint { text-align:center; font-size:13px; color:var(--sourdine); padding:14px 0 4px; }
.grade { display:flex; gap:8px; padding:10px 18px calc(20px + env(safe-area-inset-bottom)); flex:0 0 auto; }
.grade button { flex:1; height:56px; border-radius:14px; font-weight:600; font-size:14px; color:#fff; display:flex; flex-direction:column; justify-content:center; gap:2px; transition:transform .12s; }
.grade button:active { transform:scale(.96); }
.grade small { font-family:var(--mono); font-size:10px; opacity:.75; font-weight:400; }

/* --- éditeur / fiches --- */
.row { display:flex; gap:10px; align-items:flex-start; background:var(--encre2); border-radius:12px; padding:12px 14px; margin-bottom:8px; text-align:left; width:100%; }
.row .n { font-family:var(--mono); font-size:11px; color:var(--sourdine); padding-top:3px; min-width:22px; }
.row .q { font-weight:600; font-size:15px; }
.row .a { font-size:14px; color:var(--sourdine); margin-top:2px; }
.dot { width:7px; height:7px; border-radius:99px; margin-top:7px; flex:0 0 auto; }
.field { width:100%; background:var(--encre2); border:1px solid var(--encre3); color:var(--clair);
  border-radius:12px; padding:12px 14px; resize:vertical; }
.field::placeholder { color:#63708f; }
.label { font-family:var(--mono); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--sourdine); margin:14px 0 6px; }

/* --- feuille modale --- */
.sheet-bg { position:absolute; inset:0; background:rgba(9,14,26,.72); z-index:30; display:flex; align-items:flex-end; animation:fade .2s; }
.sheet { width:100%; max-height:88%; overflow-y:auto; background:var(--encre); border-radius:20px 20px 0 0;
  padding:8px 18px calc(24px + env(safe-area-inset-bottom)); animation:up .28s cubic-bezier(.2,.8,.2,1); }
.grip { width:38px; height:4px; border-radius:99px; background:var(--encre3); margin:6px auto 14px; }
.sheet h2 { font-size:20px; margin:0 0 4px; font-weight:700; }
.sheet .lede { color:var(--sourdine); font-size:14px; margin:0 0 16px; }
.tabs { display:flex; gap:6px; background:var(--encre2); padding:4px; border-radius:12px; margin-bottom:16px; }
.tabs button { flex:1; height:38px; border-radius:9px; font-size:14px; font-weight:600; color:var(--sourdine); }
.tabs button[aria-selected="true"] { background:var(--encre3); color:var(--clair); }
.drop { border:1.5px dashed var(--encre3); border-radius:14px; padding:22px 16px; text-align:center; margin-bottom:10px; }
.drop.hot { border-color:var(--seyes); background:rgba(142,138,203,.09); }
.drop p { margin:8px 0 0; font-size:13px; color:var(--sourdine); }
.note { font-size:12px; color:var(--sourdine); line-height:1.5; }
.note code { font-family:var(--mono); font-size:11px; background:var(--encre2); padding:1px 5px; border-radius:4px; }
.menu button { display:block; width:100%; text-align:left; padding:15px 4px; font-size:16px; border-bottom:1px solid var(--encre2); }
.menu button.danger { color:#F07A82; }

@keyframes fade { from { opacity:0 } }
@keyframes up { from { transform:translateY(24px) } }
@media (prefers-reduced-motion: reduce) { .bx *, .bx *::before { animation:none !important; transition-duration:.01ms !important; } }
`;

/* ------------------------------ stockage ------------------------------ */
const KEY = "bristol:v1";

async function loadDecks() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
async function saveDecks(decks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(decks));
  } catch (e) {
    console.error("sauvegarde impossible", e);
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);
const mkCard = (q, a) => ({ id: uid(), q: q.trim(), a: a.trim(), box: 0 });

/* ------------------------------ lecture des fichiers ------------------------------ */
const SEPS = ["::", "\t", " | ", "|", ";", " — ", " - ", ","];

function parseText(raw, fallbackName) {
  const text = raw.replace(/\r/g, "").trim();
  if (!text) return null;

  // 1. JSON
  if (text[0] === "[" || text[0] === "{") {
    try {
      const j = JSON.parse(text);
      const arr = Array.isArray(j) ? j : j.cards || j.fiches || j.questions || [];
      const cards = arr
        .map((o) =>
          typeof o === "object"
            ? mkCard(String(o.q ?? o.question ?? o.recto ?? ""), String(o.a ?? o.r ?? o.answer ?? o.reponse ?? o.réponse ?? o.verso ?? ""))
            : null
        )
        .filter((c) => c && c.q && c.a);
      if (cards.length) return { name: j.name || j.nom || fallbackName, cards };
    } catch { /* on continue en texte */ }
  }

  const lines = text.split("\n").map((l) => l.trim());

  // 2. blocs Q: / R:
  const qa = /^(q|question)\s*[:.\-)]\s*/i;
  const ra = /^(r|a|rep|rép|reponse|réponse|answer)\s*[:.\-)]\s*/i;
  if (lines.some((l) => qa.test(l)) && lines.some((l) => ra.test(l))) {
    const cards = [];
    let cur = null;
    for (const l of lines) {
      if (qa.test(l)) {
        if (cur && cur.q && cur.a) cards.push(mkCard(cur.q, cur.a));
        cur = { q: l.replace(qa, ""), a: "" };
      } else if (ra.test(l) && cur) {
        cur.a = l.replace(ra, "");
      } else if (cur && l) {
        cur[cur.a ? "a" : "q"] += "\n" + l;
      }
    }
    if (cur && cur.q && cur.a) cards.push(mkCard(cur.q, cur.a));
    if (cards.length) return { name: fallbackName, cards };
  }

  // 3. une fiche par ligne, séparateur détecté
  const useful = lines.filter((l) => l && !l.startsWith("#"));
  let best = null;
  for (const sep of SEPS) {
    let n = 0;
    for (const l of useful) {
      const i = l.indexOf(sep);
      if (i > 0 && l.slice(i + sep.length).trim()) n++;
    }
    if (n && (!best || n > best.n)) best = { sep, n };
  }
  if (best && best.n >= Math.max(1, useful.length * 0.6)) {
    const cards = [];
    for (const l of useful) {
      const i = l.indexOf(best.sep);
      if (i > 0) {
        const c = mkCard(l.slice(0, i), l.slice(i + best.sep.length));
        if (c.q && c.a) cards.push(c);
      }
    }
    if (cards.length) return { name: fallbackName, cards };
  }

  // 4. paires de lignes séparées par une ligne vide
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim().split("\n"));
  const cards = blocks.filter((b) => b.length >= 2).map((b) => mkCard(b[0], b.slice(1).join("\n")));
  if (cards.length) return { name: fallbackName, cards };
  return null;
}

const cleanName = (f) => f.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Sans titre";
const readFile = (f) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => res("");
    r.readAsText(f);
  });

/* ------------------------------ petits éléments ------------------------------ */
const Ico = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const I = {
  back: <path d="M15 19l-7-7 7-7" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  more: <><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></>,
  close: <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>,
  folder: <path d="M4 7a2 2 0 012-2h3.5l2 2H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />,
};

const counts = (cards) => {
  const c = [0, 0, 0];
  cards.forEach((k) => c[k.box || 0]++);
  return c;
};
const BOX_COLOR = ["var(--marge)", "var(--ambre)", "var(--vert)"];

function Segments({ cards }) {
  const [a, b, c] = counts(cards);
  const t = Math.max(1, cards.length);
  return (
    <div className="seg">
      {[a, b, c].map((n, i) => (
        <i key={i} style={{ width: `${(n / t) * 100}%`, background: BOX_COLOR[i] }} />
      ))}
    </div>
  );
}

/* ------------------------------ application ------------------------------ */
export default function Bristol() {
  const [decks, setDecks] = useState([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState({ name: "home" });
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadDecks().then((d) => {
      setDecks(d);
      setReady(true);
    });
  }, []);

  const commit = useCallback((next) => {
    setDecks(next);
    saveDecks(next);
  }, []);

  const say = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const deck = view.id ? decks.find((d) => d.id === view.id) : null;
  useEffect(() => {
    if (view.id && ready && !deck) setView({ name: "home" });
  }, [view, deck, ready]);

  const addDecks = (list) => {
    if (!list.length) {
      say("Aucune fiche trouvée dans ce fichier.");
      return;
    }
    const made = list.map((d) => ({ id: uid(), name: d.name, cards: d.cards, created: Date.now() }));
    commit([...made, ...decks]);
    setSheet(null);
    const n = made.reduce((s, d) => s + d.cards.length, 0);
    say(`${made.length} paquet${made.length > 1 ? "s" : ""} · ${n} fiches importées`);
  };

  const updateDeck = (id, patch) => commit(decks.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const removeDeck = (id) => {
    commit(decks.filter((d) => d.id !== id));
    setView({ name: "home" });
    setSheet(null);
  };

  return (
    <div className="bx">
      <style>{CSS}</style>
      <div className="bx-shell">
        {view.name === "home" && (
          <Home decks={decks} ready={ready} onOpen={(id) => setView({ name: "deck", id })} onSheet={setSheet} />
        )}
        {view.name === "deck" && deck && (
          <DeckView
            deck={deck}
            onBack={() => setView({ name: "home" })}
            onUpdate={(p) => updateDeck(deck.id, p)}
            onStudy={() => setView({ name: "study", id: deck.id })}
            onSheet={setSheet}
          />
        )}
        {view.name === "study" && deck && (
          <Study deck={deck} onUpdate={(p) => updateDeck(deck.id, p)} onQuit={() => setView({ name: "deck", id: deck.id })} />
        )}

        {sheet?.type === "import" && <ImportSheet onClose={() => setSheet(null)} onDone={addDecks} />}
        {sheet?.type === "menu" && (
          <MenuSheet
            deck={deck}
            onClose={() => setSheet(null)}
            onRename={(name) => {
              updateDeck(deck.id, { name });
              setSheet(null);
            }}
            onReset={() => {
              updateDeck(deck.id, { cards: deck.cards.map((c) => ({ ...c, box: 0 })) });
              setSheet(null);
              say("Progression remise à zéro.");
            }}
            onDelete={() => removeDeck(deck.id)}
          />
        )}

        {toast && (
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 92, zIndex: 40, background: "var(--papier)", color: "var(--encre)", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 500, boxShadow: "0 14px 30px -16px #000" }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ accueil ------------------------------ */
function Home({ decks, ready, onOpen, onSheet }) {
  const all = decks.flatMap((d) => d.cards);
  const [aRevoir, , acquis] = counts(all);

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div className="sub">Fiches de révision</div>
          <h1>Bristol</h1>
        </div>
      </div>

      <div className="scroll">
        {decks.length > 0 && (
          <div className="tally">
            <div><b>{decks.length}</b><span>Paquets</span></div>
            <div><b>{aRevoir}</b><span>À revoir</span></div>
            <div><b>{all.length ? Math.round((acquis / all.length) * 100) : 0}%</b><span>Acquis</span></div>
          </div>
        )}

        {ready && decks.length === 0 && (
          <div className="empty">
            <div className="mark">?</div>
            <h2>Rien à réviser pour l'instant</h2>
            <p>Importez un dossier de questions-réponses déjà prêt, ou créez votre premier paquet à la main.</p>
          </div>
        )}

        {decks.map((d) => (
          <button key={d.id} className="deck" onClick={() => onOpen(d.id)}>
            <h3>{d.name}</h3>
            <div className="meta">
              {d.cards.length} fiche{d.cards.length > 1 ? "s" : ""}
              {d.lastStudied ? ` · révisé ${relative(d.lastStudied)}` : " · jamais révisé"}
            </div>
            <Segments cards={d.cards} />
          </button>
        ))}
      </div>

      <div className="foot">
        <button className="btn btn-s" onClick={() => onSheet({ type: "import", mode: "new" })}>Nouveau paquet</button>
        <button className="btn btn-p" onClick={() => onSheet({ type: "import" })}>Importer</button>
      </div>
    </>
  );
}

function relative(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return j === 1 ? "hier" : `il y a ${j} jours`;
}

/* ------------------------------ un paquet ------------------------------ */
function DeckView({ deck, onBack, onUpdate, onStudy, onSheet }) {
  const [draft, setDraft] = useState(null); // {id?, q, a}
  const qRef = useRef(null);

  useEffect(() => {
    if (draft && qRef.current) qRef.current.focus();
  }, [draft?.id]);

  const save = () => {
    if (!draft.q.trim() || !draft.a.trim()) return;
    const cards = draft.id
      ? deck.cards.map((c) => (c.id === draft.id ? { ...c, q: draft.q.trim(), a: draft.a.trim() } : c))
      : [...deck.cards, mkCard(draft.q, draft.a)];
    onUpdate({ cards });
    setDraft(draft.id ? null : { q: "", a: "" });
  };
  const del = () => {
    onUpdate({ cards: deck.cards.filter((c) => c.id !== draft.id) });
    setDraft(null);
  };

  return (
    <>
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Retour"><Ico d={I.back} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sub">{deck.cards.length} fiches</div>
          <h1 style={{ fontSize: 21, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{deck.name}</h1>
        </div>
        <button className="iconbtn" onClick={() => onSheet({ type: "menu" })} aria-label="Options du paquet"><Ico d={I.more} /></button>
      </div>

      <div className="scroll">
        {draft ? (
          <div style={{ background: "var(--encre2)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div className="label" style={{ marginTop: 0 }}>Question</div>
            <textarea ref={qRef} className="field" rows={2} value={draft.q} placeholder="Recto de la fiche"
              onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
            <div className="label">Réponse</div>
            <textarea className="field" rows={3} value={draft.a} placeholder="Verso de la fiche"
              onChange={(e) => setDraft({ ...draft, a: e.target.value })} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-s" style={{ height: 44 }} onClick={() => setDraft(null)}>Fermer</button>
              {draft.id && <button className="btn btn-s" style={{ height: 44, color: "#F07A82" }} onClick={del}>Supprimer</button>}
              <button className="btn btn-g" style={{ height: 44 }} onClick={save} disabled={!draft.q.trim() || !draft.a.trim()}>
                {draft.id ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        ) : (
          <button className="row" style={{ justifyContent: "center", color: "var(--sourdine)", fontWeight: 600, marginBottom: 16 }}
            onClick={() => setDraft({ q: "", a: "" })}>
            <Ico d={I.plus} size={18} /> Ajouter une fiche
          </button>
        )}

        {deck.cards.map((c, i) => (
          <button key={c.id} className="row" onClick={() => setDraft({ id: c.id, q: c.q, a: c.a })}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span className="dot" style={{ background: BOX_COLOR[c.box || 0] }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="q" style={{ display: "block" }}>{c.q}</span>
              <span className="a" style={{ display: "block" }}>{c.a}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="foot">
        <button className="btn btn-p" onClick={onStudy} disabled={!deck.cards.length}>
          Réviser {deck.cards.length ? `· ${deck.cards.length}` : ""}
        </button>
      </div>
    </>
  );
}

/* ------------------------------ révision ------------------------------ */
const GRADES = [
  { key: 0, label: "À revoir", hint: "1", color: "var(--marge)" },
  { key: 1, label: "Presque", hint: "2", color: "var(--ambre)" },
  { key: 2, label: "Acquis", hint: "3", color: "var(--vert)" },
];

function Study({ deck, onUpdate, onQuit }) {
  const [queue, setQueue] = useState(() => {
    const c = [...deck.cards];
    c.sort((a, b) => (a.box || 0) - (b.box || 0) || Math.random() - 0.5);
    return c.map((x) => x.id);
  });
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState([0, 0, 0]);

  const card = useMemo(() => deck.cards.find((c) => c.id === queue[pos]), [deck.cards, queue, pos]);
  const done = pos >= queue.length;

  useEffect(() => {
    const k = (e) => {
      if (done) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && ["1", "2", "3"].includes(e.key)) grade(Number(e.key) - 1);
      if (e.key === "Escape") onQuit();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const grade = (g) => {
    if (!card) return;
    onUpdate({
      cards: deck.cards.map((c) => (c.id === card.id ? { ...c, box: g } : c)),
      lastStudied: Date.now(),
    });
    setTally((t) => t.map((n, i) => (i === g ? n + 1 : n)));
    if (g === 0) setQueue((q) => [...q, card.id]);
    setFlipped(false);
    setTimeout(() => setPos((p) => p + 1), 130);
  };

  if (done) {
    return (
      <div className="study">
        <div className="scroll" style={{ paddingTop: 40 }}>
          <div className="empty">
            <div className="mark" style={{ color: "var(--vert)" }}>✓</div>
            <h2>Session terminée</h2>
            <p>{queue.length} fiches passées en revue.</p>
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
          <button className="btn btn-s" onClick={() => { setQueue(deck.cards.map((c) => c.id).sort(() => Math.random() - 0.5)); setPos(0); setTally([0, 0, 0]); }}>Recommencer</button>
          <button className="btn btn-p" onClick={onQuit}>Terminer</button>
        </div>
      </div>
    );
  }

  const rest = queue.length - pos;
  return (
    <div className="study">
      <div className="progress"><i style={{ width: `${(pos / queue.length) * 100}%` }} /></div>
      <div className="topbar" style={{ paddingBottom: 4 }}>
        <button className="iconbtn" onClick={onQuit} aria-label="Quitter la révision"><Ico d={I.close} /></button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div className="sub" style={{ fontSize: 12 }}>{pos + 1} / {queue.length}</div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="stage">
        <div className="stack">
          {rest > 2 && <div className="ghost" style={{ transform: "translateY(14px) scale(.94)" }} />}
          {rest > 1 && <div className="ghost" style={{ transform: "translateY(7px) scale(.97)", opacity: .32 }} />}
          <div className={"flip" + (flipped ? " on" : "")} onClick={() => setFlipped((f) => !f)}
            role="button" tabIndex={0} aria-label="Retourner la fiche">
            <div className="face">
              <div className="rule" /><div className="marge" />
              <div className="tag">Question</div>
              <div className="body"><span>{card?.q}</span></div>
            </div>
            <div className="face back">
              <div className="rule" /><div className="marge" />
              <div className="tag" style={{ color: "var(--marge)" }}>Réponse</div>
              <div className="body"><span>{card?.a}</span></div>
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grade">
          {GRADES.map((g) => (
            <button key={g.key} style={{ background: g.color }} onClick={() => grade(g.key)}>
              {g.label}<small>touche {g.hint}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="grade" style={{ display: "block" }}>
          <div className="hint">Touchez la fiche pour voir la réponse</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ import ------------------------------ */
function ImportSheet({ onClose, onDone }) {
  const [tab, setTab] = useState("fichier");
  const [hot, setHot] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const fileRef = useRef(null);
  const dirRef = useRef(null);

  useEffect(() => {
    if (dirRef.current) {
      dirRef.current.webkitdirectory = true;
      dirRef.current.directory = true;
    }
  }, []);

  const handleFiles = async (files) => {
    const out = [];
    for (const f of Array.from(files)) {
      if (f.size > 2_000_000) continue;
      const parsed = parseText(await readFile(f), cleanName(f.name));
      if (parsed) out.push(parsed);
    }
    onDone(out);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setHot(false);
    const items = Array.from(e.dataTransfer.items || []);
    const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
    if (entries.length) {
      const files = [];
      const walk = (entry) =>
        new Promise((res) => {
          if (entry.isFile) entry.file((f) => { files.push(f); res(); });
          else if (entry.isDirectory) {
            const rd = entry.createReader();
            rd.readEntries(async (list) => { await Promise.all(list.map(walk)); res(); });
          } else res();
        });
      await Promise.all(entries.map(walk));
      handleFiles(files);
    } else handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2>Ajouter des fiches</h2>
        <p className="lede">Un fichier = un paquet. Le nom du fichier devient le nom du paquet.</p>

        <div className="tabs" role="tablist">
          {["fichier", "texte"].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === "fichier" ? "Fichiers" : "Coller du texte"}
            </button>
          ))}
        </div>

        {tab === "fichier" ? (
          <>
            <div className={"drop" + (hot ? " hot" : "")}
              onDragOver={(e) => { e.preventDefault(); setHot(true); }}
              onDragLeave={() => setHot(false)}
              onDrop={onDrop}>
              <Ico d={I.folder} size={26} />
              <p>Glissez un dossier entier, ou choisissez ci-dessous.</p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button className="btn btn-s" style={{ height: 46 }} onClick={() => fileRef.current.click()}>Choisir des fichiers</button>
              <button className="btn btn-s" style={{ height: 46 }} onClick={() => dirRef.current.click()}>Choisir un dossier</button>
            </div>
            <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.tsv,.json,text/*" hidden
              onChange={(e) => handleFiles(e.target.files)} />
            <input ref={dirRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
            <p className="note">
              Formats lus automatiquement : <code>question ; réponse</code>, <code>question :: réponse</code>,
              tabulation, <code>Q:</code> / <code>R:</code>, blocs séparés par une ligne vide, et JSON
              <code>[{"{"}"q":"…","a":"…"{"}"}]</code>.
            </p>
          </>
        ) : (
          <>
            <input className="field" value={name} placeholder="Nom du paquet" onChange={(e) => setName(e.target.value)} />
            <div className="label">Une fiche par ligne</div>
            <textarea className="field" rows={8} value={text} placeholder={"Quelle est la capitale du Japon ; Tokyo\nEncapsulation ; Regrouper données et méthodes…"}
              onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-p" style={{ marginTop: 14 }}
              disabled={!text.trim()}
              onClick={() => {
                const p = parseText(text, name.trim() || "Paquet collé");
                onDone(p ? [{ ...p, name: name.trim() || p.name }] : []);
              }}>
              Créer le paquet
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ menu paquet ------------------------------ */
function MenuSheet({ deck, onClose, onRename, onReset, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(deck?.name || "");
  const [confirm, setConfirm] = useState(false);

  const exportDeck = () => {
    const blob = new Blob([JSON.stringify(deck.cards.map(({ q, a }) => ({ q, a })), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${deck.name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    onClose();
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        {renaming ? (
          <>
            <h2>Renommer</h2>
            <input className="field" style={{ marginTop: 12 }} value={name} autoFocus onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-p" style={{ marginTop: 14 }} disabled={!name.trim()} onClick={() => onRename(name.trim())}>Enregistrer</button>
          </>
        ) : (
          <>
            <h2>{deck?.name}</h2>
            <p className="lede">{deck?.cards.length} fiches</p>
            <div className="menu">
              <button onClick={() => setRenaming(true)}>Renommer le paquet</button>
              <button onClick={exportDeck}>Exporter en JSON</button>
              <button onClick={onReset}>Remettre la progression à zéro</button>
              <button className="danger" onClick={() => (confirm ? onDelete() : setConfirm(true))}>
                {confirm ? "Confirmer la suppression" : "Supprimer le paquet"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
