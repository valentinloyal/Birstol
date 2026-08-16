import { useState, useEffect, useCallback } from "react";
import { CSS } from "./styles.js";
import { loadDecks, saveDecks } from "./storage.js";
import { uid } from "./outils.js";
import { fileDuJour, filePaquet, reinitialiser } from "./revision.js";
import { lirePartage, nomDuPartage, nettoyerURL } from "./partage.js";
import { Home } from "./components/Home.jsx";
import { DeckView } from "./components/DeckView.jsx";
import { Study } from "./components/Study.jsx";
import { InstallSheet } from "./components/Install.jsx";
import { NewDeckSheet } from "./components/NewDeckSheet.jsx";
import { ImportSheet } from "./components/ImportSheet.jsx";
import { MenuSheet } from "./components/MenuSheet.jsx";
import { BackupSheet } from "./components/BackupSheet.jsx";
import { Cours } from "./components/Cours.jsx";
import { CoursSheet } from "./components/CoursSheet.jsx";
import { SectionSheet } from "./components/SectionSheet.jsx";

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

  useEffect(() => {
    loadDecks().then((charges) => {
      setDecks(charges);
      setReady(true);
      /* Un partage reçu ouvre la feuille d'import déjà remplie, plutôt que de
         créer un paquet tout seul : on partage vite une phrase ou un lien par
         mégarde, et le parseur en tirerait une fiche parasite sans rien dire. */
      const recu = lirePartage(location.search);
      if (recu) {
        nettoyerURL();
        setSheet({ type: "import", texte: recu.texte, nom: nomDuPartage(recu.titre) });
      }
    });
  }, []);

  const commit = useCallback((next) => { setDecks(next); saveDecks(next); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const deck = view.id ? decks.find((d) => d.id === view.id) : null;
  useEffect(() => { if (view.id && ready && !deck) setView({ name: "home" }); }, [view, deck, ready]);

  const addDecks = (list, destination) => {
    if (!list.length) { say("Aucune fiche trouvée dans ce fichier."); return; }
    const fiches = list.flatMap((d) => d.cards);
    const cible = destination ? decks.find((d) => d.id === destination) : null;

    if (cible) {
      // Fusion : les fiches arrivent neuves, en fin de paquet, dues aujourd'hui.
      commit(decks.map((d) => (d.id === cible.id ? { ...d, cards: [...d.cards, ...fiches] } : d)));
      setSheet(null);
      say(`${fiches.length} fiche${fiches.length > 1 ? "s" : ""} ajoutée${fiches.length > 1 ? "s" : ""} à « ${cible.name} »`);
      return;
    }

    const made = list.map((d) => ({ id: uid(), name: d.name, cards: d.cards, created: Date.now() }));
    commit([...made, ...decks]);
    setSheet(null);
    say(`${made.length} paquet${made.length > 1 ? "s" : ""} · ${fiches.length} fiches importées`);
  };

  const newDeck = (name) => {
    const d = { id: uid(), name, cards: [], created: Date.now() };
    commit([d, ...decks]);
    setSheet(null);
    setView({ name: "deck", id: d.id, draft: true });
  };

  const updateDeck = (id, patch) => commit(decks.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const removeDeck = (id) => { commit(decks.filter((d) => d.id !== id)); setView({ name: "home" }); setSheet(null); };

  /* Une note s'applique à une fiche précise d'un paquet précis : la session
     peut traverser plusieurs paquets, on ne peut plus se contenter du courant. */
  const noterFiche = (paquetId, ficheId, maj) =>
    commit(decks.map((d) => (d.id !== paquetId ? d : {
      ...d,
      lastStudied: Date.now(),
      cards: d.cards.map((c) => (c.id === ficheId ? { ...c, ...maj } : c)),
    })));

  /* Corriger une fiche ne touche ni à sa boîte ni à son échéance : on répare
     une coquille, on ne réévalue pas ce qui est su. */
  const corrigerFiche = (paquetId, ficheId, texte) =>
    commit(decks.map((d) => (d.id !== paquetId ? d : {
      ...d,
      cards: d.cards.map((c) => (c.id === ficheId ? { ...c, ...texte } : c)),
    })));

  // La file est construite une fois, au moment d'ouvrir la révision : elle est
  // ensuite figée par Study, ce qui garantit une fiche vue une seule fois.
  const ouvrirRevision = (source) =>
    setView({
      name: "study",
      file: source.jour ? fileDuJour(decks, Date.now()) : filePaquet(source.paquet, source.filtre, Date.now()),
      sousTitre: source.jour ? "jour" : source.paquet.name,
      retour: source.jour ? { name: "home" } : { name: "deck", id: source.paquet.id },
    });

  return (
    <div className="bx">
      <style>{CSS}</style>
      <div className="bx-shell">
        {view.name === "home" && (
          <Home
            decks={decks}
            ready={ready}
            onOpen={(id) => setView({ name: "deck", id })}
            onJour={() => ouvrirRevision({ jour: true })}
            onSheet={setSheet}
          />
        )}
        {view.name === "deck" && deck && (
          <DeckView
            key={deck.id}
            deck={deck}
            startDraft={!!view.draft}
            onBack={() => setView({ name: "home" })}
            onUpdate={(p) => updateDeck(deck.id, p)}
            onStudy={(filtre) => ouvrirRevision({ paquet: deck, filtre })}
            onCours={() => setView({ name: "cours", id: deck.id })}
            onSheet={setSheet}
          />
        )}
        {view.name === "cours" && deck && (
          <Cours
            deck={deck}
            sectionVisee={view.section}
            onBack={() => setView({ name: "deck", id: deck.id })}
            onImporter={() => setSheet({ type: "cours" })}
            onSupprimer={() => {
              updateDeck(deck.id, { cours: "", cards: deck.cards.map(({ section, ...c }) => c) });
              say("Cours retiré.");
            }}
          />
        )}
        {view.name === "study" && (
          <Study
            decks={decks}
            fileInitiale={view.file}
            sousTitre={view.sousTitre}
            onNoter={noterFiche}
            onCorriger={corrigerFiche}
            onCours={(paquetId, section) => setSheet({ type: "section", paquetId, section })}
            onQuit={() => setView(view.retour)}
          />
        )}

        {sheet?.type === "install" && <InstallSheet onClose={() => setSheet(null)} />}
        {sheet?.type === "backup" && (
          <BackupSheet
            decks={decks}
            onClose={() => setSheet(null)}
            onRestore={(paquets) => {
              commit(paquets);
              setSheet(null);
              setView({ name: "home" });
              say(`${paquets.length} paquet${paquets.length > 1 ? "s" : ""} restauré${paquets.length > 1 ? "s" : ""}.`);
            }}
          />
        )}
        {sheet?.type === "section" && (
          <SectionSheet
            deck={decks.find((d) => d.id === sheet.paquetId)}
            section={sheet.section}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet?.type === "cours" && deck && (
          <CoursSheet
            deck={deck}
            onClose={() => setSheet(null)}
            onDone={(texte) => {
              updateDeck(deck.id, { cours: texte });
              setSheet(null);
              say("Cours enregistré.");
            }}
          />
        )}
        {sheet?.type === "new" && <NewDeckSheet onClose={() => setSheet(null)} onCreate={newDeck} />}
        {sheet?.type === "import" && (
          <ImportSheet
            decks={decks}
            onClose={() => setSheet(null)}
            onDone={addDecks}
            texteInitial={sheet.texte || ""}
            nomInitial={sheet.nom || ""}
          />
        )}
        {sheet?.type === "menu" && deck && (
          <MenuSheet
            deck={deck}
            onClose={() => setSheet(null)}
            onRename={(name) => { updateDeck(deck.id, { name }); setSheet(null); }}
            onReset={() => {
              const maintenant = Date.now();
              updateDeck(deck.id, { cards: deck.cards.map((c) => reinitialiser(c, maintenant)) });
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
