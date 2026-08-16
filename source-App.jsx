import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Bristol — fiches de révision                                       */
/*  Thème : violet profond, titres orange italique, fiche papier réglée */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,900&family=Newsreader:opsz,wght@6..72,300;6..72,500&family=JetBrains+Mono:wght@400;600&display=swap');

.bx * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.bx {
  --violet:#2A0F4C; --violet2:#3A1668; --violet3:#502290;
  --or:#F2A310; --lavande:#A98BE8;
  --papier:#FBF6EE; --papier2:#E7DECF; --encre:#2A0F4C;
  --rouge:#E2506B; --vert:#46B394;
  --clair:#F0E8FA; --sourdine:#AE9BD0;
  --ui:'Archivo', system-ui, sans-serif;
  --serif:'Newsreader', Georgia, serif;
  --mono:'JetBrains Mono', ui-monospace, monospace;
  position:fixed; inset:0; overflow:hidden;
  background:var(--violet); color:var(--clair);
  font-family:var(--ui); font-size:16px; line-height:1.45;
  display:flex; justify-content:center;
}
.bx-shell { width:100%; max-width:520px; height:100%; display:flex; flex-direction:column; position:relative; }
.bx button { font-family:inherit; font-size:inherit; color:inherit; background-color:transparent; border:none; cursor:pointer; }
/* NB : ici on ne remet a zero que la couleur de fond. Le raccourci complet effacerait aussi les degrades des boutons. */
.bx :focus-visible { outline:2px solid var(--or); outline-offset:3px; border-radius:4px; }
.bx input, .bx textarea { font-family:inherit; font-size:16px; }

/* Les fonds passent par background-image : le mode sombre force par le
   navigateur repeint les background-color, jamais les degrades. */
.display { font-weight:900; font-style:italic; text-transform:uppercase; letter-spacing:-.015em; line-height:.95; }

/* --- barres --- */
.topbar { display:flex; align-items:center; gap:12px; padding:18px 18px 12px; flex:0 0 auto; }
.topbar h1 { font-size:34px; margin:0; color:var(--or); }
.topbar .sub { font-family:var(--mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--lavande); margin-bottom:3px; }
.iconbtn { width:42px; height:42px; border-radius:13px; display:grid; place-items:center; color:var(--clair); flex:0 0 auto;
  background-image:linear-gradient(var(--violet2),var(--violet2)); transition:transform .12s; }
.iconbtn:active { transform:scale(.92); }
.scroll { flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:0 18px 150px; }

/* --- compteurs --- */
.tally { display:flex; gap:8px; margin:2px 0 20px; }
.tally div { flex:1; border-radius:14px; padding:11px 13px; background-image:linear-gradient(var(--violet2),var(--violet2)); }
.tally b { display:block; font-family:var(--mono); font-size:21px; font-weight:600; letter-spacing:-.03em; }
.tally span { font-size:10px; color:var(--sourdine); letter-spacing:.12em; text-transform:uppercase; font-family:var(--mono); }

/* --- paquet dans la liste --- */
.deck { position:relative; width:100%; text-align:left; color:var(--encre);
  background-image:linear-gradient(var(--papier),var(--papier));
  border-radius:12px; padding:15px 16px 15px 32px; margin-bottom:11px; overflow:hidden;
  box-shadow:0 12px 22px -16px #000; transition:transform .12s; }
.deck:active { transform:scale(.985); }
.deck::before { content:""; position:absolute; left:20px; top:0; bottom:0; width:2px;
  background-image:linear-gradient(var(--or),var(--or)); opacity:.85; }
.deck h3 { margin:0 0 3px; font-size:19px; font-weight:700; letter-spacing:-.015em; }
.deck .meta { font-family:var(--mono); font-size:11px; color:#7A6B93; }
.seg { display:flex; gap:2px; height:6px; margin-top:12px; border-radius:99px; overflow:hidden;
  background-image:linear-gradient(var(--papier2),var(--papier2)); }
.seg i { display:block; height:100%; }

/* --- boutons --- */
.foot { position:absolute; left:0; right:0; bottom:0; padding:14px 18px calc(18px + env(safe-area-inset-bottom));
  display:flex; gap:10px; align-items:stretch;
  background-image:linear-gradient(to top, var(--violet) 60%, rgba(42,15,76,0)); }
.btn { flex:1; height:54px; border-radius:15px; font-weight:700; font-size:16px; letter-spacing:-.01em;
  display:grid; place-items:center; text-align:center; transition:transform .12s; }
.btn:active { transform:scale(.97); }
.btn-p { background-image:linear-gradient(var(--or),var(--or)); color:#2A0F4C; }
.btn-s { background-image:linear-gradient(var(--violet2),var(--violet2)); color:var(--clair); box-shadow:inset 0 0 0 1.5px var(--violet3); }
.btn-n { flex:0 0 auto; padding:0 18px; font-size:14px; }
.btn[disabled] { opacity:.35; pointer-events:none; }
.pill { height:36px; padding:0 14px; border-radius:99px; font-size:13px; font-weight:700; color:var(--or);
  box-shadow:inset 0 0 0 1.5px var(--violet3); display:flex; align-items:center; gap:6px; flex:0 0 auto; transition:transform .12s; }
.pill:active { transform:scale(.94); }

/* --- ecran vide --- */
.empty { text-align:center; padding:56px 10px 30px; }
.empty .mark { font-family:var(--serif); font-size:56px; color:var(--violet3); line-height:1; }
.empty h2 { font-size:27px; margin:14px 0 8px; color:var(--or); }
.empty p { color:var(--sourdine); font-size:14px; margin:0 auto; max-width:300px; }

/* --- revision --- */
.study { position:absolute; inset:0; display:flex; flex-direction:column; z-index:20;
  background-image:linear-gradient(var(--violet),var(--violet)); }
.progress { height:3px; flex:0 0 auto; background-image:linear-gradient(var(--violet2),var(--violet2)); }
.progress i { display:block; height:100%; background-image:linear-gradient(var(--or),var(--or)); transition:width .3s; }
.stage { flex:1 1 auto; display:grid; place-items:center; padding:6px 18px 0; perspective:1400px; min-height:0; }
.stack { position:relative; width:100%; height:100%; max-height:430px; }
.ghost { position:absolute; inset:0; border-radius:12px; opacity:.2;
  background-image:linear-gradient(var(--papier2),var(--papier2)); }
.flip { position:absolute; inset:0; transition:transform .5s cubic-bezier(.2,.8,.2,1); transform-style:preserve-3d; cursor:pointer; }
.flip.on { transform:rotateY(180deg); }
.face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  color:var(--encre); border-radius:12px; overflow:hidden;
  background-image:linear-gradient(var(--papier),var(--papier));
  box-shadow:0 26px 40px -26px #000; }
.face.back { transform:rotateY(180deg); }
.face .rule { position:absolute; inset:0; pointer-events:none;
  background-image:repeating-linear-gradient(to bottom, transparent 0 29px, rgba(169,139,232,.32) 29px 30px); }
.face .marge { position:absolute; left:36px; top:0; bottom:0; width:2px;
  background-image:linear-gradient(var(--or),var(--or)); opacity:.7; }
.face .tag { position:absolute; top:7px; left:48px; z-index:1; font-family:var(--mono); font-size:10px;
  letter-spacing:.2em; text-transform:uppercase; color:#8E7BAE; }
.face .body { position:absolute; inset:0; z-index:1; overflow-y:auto; padding:38px 22px 24px 48px;
  font-family:var(--serif); font-weight:300; line-height:30px; }
.face .body span { display:block; white-space:pre-wrap; }
.hint { text-align:center; font-size:13px; color:var(--sourdine); }
.grade { display:flex; gap:8px; padding:12px 18px calc(20px + env(safe-area-inset-bottom)); flex:0 0 auto; min-height:98px; align-items:center; }
.grade button { flex:1; height:62px; border-radius:15px; font-weight:700; font-size:14px;
  display:flex; flex-direction:column; justify-content:center; gap:1px; transition:transform .12s; }
.grade button:active { transform:scale(.95); }
.grade small { font-family:var(--mono); font-size:10px; opacity:.7; font-weight:400; }

/* --- listes de fiches --- */
.row { display:flex; gap:11px; align-items:flex-start; border-radius:13px; padding:13px 15px; margin-bottom:8px;
  text-align:left; width:100%; background-image:linear-gradient(var(--violet2),var(--violet2)); }
.row .n { font-family:var(--mono); font-size:11px; color:var(--sourdine); padding-top:3px; min-width:22px; }
.row .q { font-weight:600; font-size:15px; letter-spacing:-.01em; }
.row .a { font-size:14px; color:var(--sourdine); margin-top:2px; }
.dot { width:8px; height:8px; border-radius:99px; margin-top:7px; flex:0 0 auto; }
.field { width:100%; border:1.5px solid var(--violet3); color:var(--clair); border-radius:13px; padding:12px 14px; resize:vertical;
  background-image:linear-gradient(var(--violet2),var(--violet2)); }
.field::placeholder { color:#7C6A9C; }
.label { font-family:var(--mono); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--lavande); margin:14px 0 6px; }

/* --- feuille modale --- */
.sheet-bg { position:absolute; inset:0; z-index:30; display:flex; align-items:flex-end; animation:fade .2s;
  background-image:linear-gradient(rgba(14,4,28,.78),rgba(14,4,28,.78)); }
.sheet { width:100%; max-height:88%; overflow-y:auto; border-radius:22px 22px 0 0;
  background-image:linear-gradient(var(--violet),var(--violet));
  box-shadow:inset 0 1.5px 0 var(--violet3);
  padding:8px 18px calc(24px + env(safe-area-inset-bottom)); animation:up .28s cubic-bezier(.2,.8,.2,1); }
.grip { width:40px; height:4px; border-radius:99px; margin:6px auto 16px; background-image:linear-gradient(var(--violet3),var(--violet3)); }
.sheet h2 { font-size:24px; margin:0 0 5px; color:var(--or); }
.sheet .lede { color:var(--sourdine); font-size:14px; margin:0 0 16px; }
.tabs { display:flex; gap:6px; padding:4px; border-radius:13px; margin-bottom:16px;
  background-image:linear-gradient(var(--violet2),var(--violet2)); }
.tabs button { flex:1; height:38px; border-radius:10px; font-size:14px; font-weight:600; color:var(--sourdine); }
.tabs button[aria-selected="true"] { background-image:linear-gradient(var(--violet3),var(--violet3)); color:var(--clair); }
.drop { border:1.5px dashed var(--violet3); border-radius:15px; padding:22px 16px; text-align:center; margin-bottom:10px; }
.drop.hot { border-color:var(--or); background-image:linear-gradient(rgba(242,163,16,.1),rgba(242,163,16,.1)); }
.drop p { margin:8px 0 0; font-size:13px; color:var(--sourdine); }
.note { font-size:12px; color:var(--sourdine); line-height:1.5; }
.note code { font-family:var(--mono); font-size:11px; padding:1px 5px; border-radius:4px; color:var(--lavande);
  background-image:linear-gradient(var(--violet2),var(--violet2)); }
.menu button { display:block; width:100%; text-align:left; padding:16px 4px; font-size:16px; font-weight:500;
  border-bottom:1px solid var(--violet2); }
.menu button.danger { color:var(--rouge); }
.steps { counter-reset:s; margin:6px 0 0; padding:0; list-style:none; }
.steps li { counter-increment:s; position:relative; padding:11px 0 11px 36px; font-size:15px; border-bottom:1px solid var(--violet2); }
.steps li::before { content:counter(s); position:absolute; left:0; top:11px; width:24px; height:24px; border-radius:99px;
  color:var(--or); font-family:var(--mono); font-size:11px; display:grid; place-items:center;
  background-image:linear-gradient(var(--violet2),var(--violet2)); }
.toast { position:absolute; left:18px; right:18px; bottom:96px; z-index:40; border-radius:14px; padding:13px 16px;
  font-size:14px; font-weight:600; color:var(--encre); background-image:linear-gradient(var(--papier),var(--papier));
  box-shadow:0 16px 30px -16px #000; }

@keyframes fade { from { opacity:0 } }
@keyframes up { from { transform:translateY(26px) } }
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
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

/* ------------------------------ lecture des fichiers ------------------------------ */
const SEPS = ["::", "\t", " | ", "|", ";", " — ", " - ", ","];

function parseText(raw, fallbackName) {
  const text = raw.replace(/\r/g, "").trim();
  if (!text) return null;

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

/* ------------------------------ petits elements ------------------------------ */
const Ico = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const I = {
  back: <path d="M15 19l-7-7 7-7" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  more: <><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>,
  close: <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>,
  folder: <path d="M4 7a2 2 0 012-2h3.5l2 2H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />,
  install: <><path d="M12 3v11" /><path d="M8 11l4 4 4-4" /><path d="M5 20h14" /></>,
};

const counts = (cards) => {
  const c = [0, 0, 0];
  cards.forEach((k) => c[k.box || 0]++);
  return c;
};
const BOX_COLOR = ["var(--rouge)", "var(--or)", "var(--vert)"];
const flat = (c) => `linear-gradient(${c},${c})`;

function Segments({ cards }) {
  const [a, b, c] = counts(cards);
  const t = Math.max(1, cards.length);
  return (
    <div className="seg">
      {[a, b, c].map((n, i) => (
        <i key={i} style={{ width: `${(n / t) * 100}%`, backgroundImage: flat(BOX_COLOR[i]) }} />
      ))}
    </div>
  );
}

/* ------------------------------ installation ------------------------------ */
function InstallButton({ onHelp }) {
  const [posee, setPosee] = useState(false);

  useEffect(() => {
    const done = () => setPosee(true);
    window.addEventListener("bip-done", done);
    const mq = window.matchMedia("(display-mode: standalone)");
    setPosee(mq.matches || window.navigator.standalone === true);
    return () => window.removeEventListener("bip-done", done);
  }, []);

  if (posee) return null;

  const go = async () => {
    const e = window.__bip;
    if (!e) { onHelp(); return; }
    e.prompt();
    await e.userChoice;
    window.__bip = null;
  };

  return (
    <button className="pill" onClick={go} aria-label="Installer l'application">
      <Ico d={I.install} size={15} /> Installer
    </button>
  );
}

function InstallSheet({ onClose }) {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Sur l'écran d'accueil</h2>
        <p className="lede">L'app s'ouvre alors en plein écran et fonctionne sans connexion.</p>
        {ios ? (
          <ol className="steps">
            <li>Ouvrez cette page dans <b>Safari</b>.</li>
            <li>Touchez le bouton <b>Partager</b>, en bas.</li>
            <li>Choisissez <b>Sur l'écran d'accueil</b>.</li>
          </ol>
        ) : (
          <ol className="steps">
            <li>Touchez le menu <b>⋮</b> du navigateur.</li>
            <li>Choisissez <b>Ajouter à l'écran d'accueil</b>.</li>
            <li>Confirmez avec <b>Installer</b>.</li>
          </ol>
        )}
        <button className="btn btn-s" style={{ marginTop: 18 }} onClick={onClose}>Fermer</button>
      </div>
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

  useEffect(() => { loadDecks().then((d) => { setDecks(d); setReady(true); }); }, []);

  const commit = useCallback((next) => { setDecks(next); saveDecks(next); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const deck = view.id ? decks.find((d) => d.id === view.id) : null;
  useEffect(() => { if (view.id && ready && !deck) setView({ name: "home" }); }, [view, deck, ready]);

  const addDecks = (list) => {
    if (!list.length) { say("Aucune fiche trouvée dans ce fichier."); return; }
    const made = list.map((d) => ({ id: uid(), name: d.name, cards: d.cards, created: Date.now() }));
    commit([...made, ...decks]);
    setSheet(null);
    const n = made.reduce((s, d) => s + d.cards.length, 0);
    say(`${made.length} paquet${made.length > 1 ? "s" : ""} · ${n} fiches importées`);
  };

  const newDeck = (name) => {
    const d = { id: uid(), name, cards: [], created: Date.now() };
    commit([d, ...decks]);
    setSheet(null);
    setView({ name: "deck", id: d.id, draft: true });
  };

  const updateDeck = (id, patch) => commit(decks.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const removeDeck = (id) => { commit(decks.filter((d) => d.id !== id)); setView({ name: "home" }); setSheet(null); };

  return (
    <div className="bx">
      <style>{CSS}</style>
      <div className="bx-shell">
        {view.name === "home" && (
          <Home decks={decks} ready={ready} onOpen={(id) => setView({ name: "deck", id })} onSheet={setSheet} />
        )}
        {view.name === "deck" && deck && (
          <DeckView
            key={deck.id}
            deck={deck}
            startDraft={!!view.draft}
            onBack={() => setView({ name: "home" })}
            onUpdate={(p) => updateDeck(deck.id, p)}
            onStudy={(filter) => setView({ name: "study", id: deck.id, filter })}
            onSheet={setSheet}
          />
        )}
        {view.name === "study" && deck && (
          <Study
            deck={deck}
            filter={view.filter}
            onUpdate={(p) => updateDeck(deck.id, p)}
            onQuit={() => setView({ name: "deck", id: deck.id })}
          />
        )}

        {sheet?.type === "install" && <InstallSheet onClose={() => setSheet(null)} />}
        {sheet?.type === "new" && <NewDeckSheet onClose={() => setSheet(null)} onCreate={newDeck} />}
        {sheet?.type === "import" && <ImportSheet onClose={() => setSheet(null)} onDone={addDecks} />}
        {sheet?.type === "menu" && deck && (
          <MenuSheet
            deck={deck}
            onClose={() => setSheet(null)}
            onRename={(name) => { updateDeck(deck.id, { name }); setSheet(null); }}
            onReset={() => {
              updateDeck(deck.id, { cards: deck.cards.map((c) => ({ ...c, box: 0 })) });
              setSheet(null);
              say("Progression remise à zéro.");
            }}
            onDelete={() => removeDeck(deck.id)}
          />
        )}

        {toast && <div className="toast">{toast}</div>}
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
          <h1 className="display">Bristol</h1>
        </div>
        <InstallButton onHelp={() => onSheet({ type: "install" })} />
      </div>

      <div className="scroll">
        {decks.length > 0 && (
          <div className="tally">
            <div><b>{decks.length}</b><span>Paquets</span></div>
            <div><b style={{ color: "var(--rouge)" }}>{aRevoir}</b><span>À revoir</span></div>
            <div><b style={{ color: "var(--vert)" }}>{all.length ? Math.round((acquis / all.length) * 100) : 0}%</b><span>Acquis</span></div>
          </div>
        )}

        {ready && decks.length === 0 && (
          <div className="empty">
            <div className="mark">?</div>
            <h2 className="display">Rien à réviser</h2>
            <p>Importez un fichier de questions-réponses, ou créez votre premier paquet à la main.</p>
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
        <button className="btn btn-s" onClick={() => onSheet({ type: "new" })}>Créer à la main</button>
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
function DeckView({ deck, startDraft, onBack, onUpdate, onStudy, onSheet }) {
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

/* ------------------------------ revision ------------------------------ */
const GRADES = [
  { key: 0, label: "À revoir", hint: "1", color: "var(--rouge)", fg: "#FFF" },
  { key: 1, label: "Presque", hint: "2", color: "var(--or)", fg: "#2A0F4C" },
  { key: 2, label: "Acquis", hint: "3", color: "var(--vert)", fg: "#0D3B2E" },
];

const fitSize = (t = "") => (t.length > 260 ? 17 : t.length > 150 ? 19 : t.length > 70 ? 21 : 24);

function Study({ deck, filter, onUpdate, onQuit }) {
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
            <button key={g.key} style={{ backgroundImage: flat(g.color), color: g.fg }} onClick={() => grade(g.key)}>
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

/* ------------------------------ paquet vide ------------------------------ */
function NewDeckSheet({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Créer à la main</h2>
        <p className="lede">Un paquet vide, puis vous saisissez vos fiches une par une.</p>
        <input className="field" value={name} autoFocus placeholder="Nom du paquet"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onCreate(name.trim()); }} />
        <button className="btn btn-p" style={{ marginTop: 16 }} disabled={!name.trim()}
          onClick={() => onCreate(name.trim())}>
          Créer et ajouter une fiche
        </button>
      </div>
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
    if (dirRef.current) { dirRef.current.webkitdirectory = true; dirRef.current.directory = true; }
  }, []);

  const handleFiles = async (files) => {
    const out = [];
    for (const f of Array.from(files)) {
      if (f.size > 2000000) continue;
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
            entry.createReader().readEntries(async (list) => { await Promise.all(list.map(walk)); res(); });
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
        <h2 className="display">Ajouter des fiches</h2>
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
              <button className="btn btn-s" style={{ height: 48 }} onClick={() => fileRef.current.click()}>Des fichiers</button>
              <button className="btn btn-s" style={{ height: 48 }} onClick={() => dirRef.current.click()}>Un dossier</button>
            </div>
            <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.tsv,.json,text/*" hidden
              onChange={(e) => handleFiles(e.target.files)} />
            <input ref={dirRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
            <p className="note">
              Formats lus automatiquement : <code>question ; réponse</code>, <code>question :: réponse</code>,
              tabulation, <code>Q:</code> / <code>R:</code>, blocs séparés par une ligne vide, et JSON.
            </p>
          </>
        ) : (
          <>
            <input className="field" value={name} placeholder="Nom du paquet" onChange={(e) => setName(e.target.value)} />
            <div className="label">Une fiche par ligne</div>
            <textarea className="field" rows={8} value={text} placeholder={"Quelle est la capitale du Japon ; Tokyo\nEncapsulation ; Regrouper données et méthodes…"}
              onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-p" style={{ marginTop: 14 }} disabled={!text.trim()}
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
            <h2 className="display">Renommer</h2>
            <input className="field" style={{ marginTop: 12 }} value={name} autoFocus onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-p" style={{ marginTop: 14 }} disabled={!name.trim()} onClick={() => onRename(name.trim())}>Enregistrer</button>
          </>
        ) : (
          <>
            <h2 className="display">{deck?.name}</h2>
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
