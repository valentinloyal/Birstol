import { useState, useEffect, useCallback } from "react";
import { CSS } from "./styles.js";
import { loadDecks, saveDecks } from "./storage.js";
import { uid } from "./outils.js";
import { Home } from "./components/Home.jsx";
import { DeckView } from "./components/DeckView.jsx";
import { Study } from "./components/Study.jsx";
import { InstallSheet } from "./components/Install.jsx";
import { NewDeckSheet } from "./components/NewDeckSheet.jsx";
import { ImportSheet } from "./components/ImportSheet.jsx";
import { MenuSheet } from "./components/MenuSheet.jsx";

/* ------------------------------------------------------------------ */
/*  Bristol — fiches de révision                                       */
/*  Thème : violet profond, titres orange italique, fiche papier réglée */
/* ------------------------------------------------------------------ */

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
