import { useState, useEffect } from "react";
import { CSS } from "../styles.js";
import { uid, mkCard } from "../outils.js";
import { fileDuJour, filePaquet, fileSection, reinitialiser } from "../revision.js";
import { client } from "./client.js";
import {
  chargerDecks, creerDeck, supprimerDeck, majDeckChamps,
  synchroniserCartes, ajouterCartes, majCarte, versChampsCartePartiels,
} from "./nuage.js";
import { Connexion } from "./Connexion.jsx";
import { CompteSheet } from "./CompteSheet.jsx";
import { Home } from "../components/Home.jsx";
import { DeckView } from "../components/DeckView.jsx";
import { Study } from "../components/Study.jsx";
import { InstallSheet } from "../components/Install.jsx";
import { NewDeckSheet } from "../components/NewDeckSheet.jsx";
import { ImportSheet } from "../components/ImportSheet.jsx";
import { MenuSheet } from "../components/MenuSheet.jsx";
import { Cours } from "../components/Cours.jsx";
import { CoursSheet } from "../components/CoursSheet.jsx";
import { SectionSheet } from "../components/SectionSheet.jsx";
import { AstucesSheet } from "../components/AstucesSheet.jsx";
import { CoursMenuSheet } from "../components/CoursMenuSheet.jsx";
import { FicheDepuisCoursSheet } from "../components/FicheDepuisCoursSheet.jsx";
import { RattacherSheet } from "../components/RattacherSheet.jsx";
import { LotSheet } from "../components/LotSheet.jsx";

/* ------------------------------------------------------------------ */
/*  Memento — version en ligne                                         */
/*  Même interface que la version locale ; les mêmes composants sont    */
/*  réutilisés tels quels. Ce qui change ici : les fiches vivent sur le */
/*  serveur, chaque mutation part en réseau derrière une mise à jour    */
/*  optimiste de l'écran, plutôt que dans le localStorage du téléphone. */
/* ------------------------------------------------------------------ */

export default function MementoNuage() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [decks, setDecks] = useState([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState({ name: "home" });
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState("");

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2400); };
  const signalerErreur = (e) => {
    console.error(e);
    say("Problème de connexion : la modification n'a peut-être pas été enregistrée.");
  };

  const chargerPourUtilisateur = () =>
    chargerDecks()
      .then((d) => setDecks(d))
      .catch(signalerErreur)
      .finally(() => setReady(true));

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      if (data?.session && data?.user) {
        setUtilisateur(data.user);
        chargerPourUtilisateur();
      } else {
        setReady(true);
      }
    });
  }, []);

  const deck = view.id ? decks.find((d) => d.id === view.id) : null;
  useEffect(() => { if (view.id && ready && !deck) setView({ name: "home" }); }, [view, deck, ready]);

  const addDecks = (list, destination) => {
    if (!list.length) { say("Aucune fiche trouvée dans ce fichier."); return; }
    const fiches = list.flatMap((d) => d.cards);
    const cible = destination ? decks.find((d) => d.id === destination) : null;

    if (cible) {
      const coursApporte = (list.find((d) => d.cours) || {}).cours;
      const patchCours = coursApporte && !cible.cours ? { cours: coursApporte } : {};
      setDecks((prev) => prev.map((d) => (d.id !== cible.id ? d : { ...d, ...patchCours, cards: [...d.cards, ...fiches] })));
      setSheet(null);
      say(`${fiches.length} fiche${fiches.length > 1 ? "s" : ""} ajoutée${fiches.length > 1 ? "s" : ""} à « ${cible.name} »`);
      ajouterCartes(cible.id, fiches).catch(signalerErreur);
      if (Object.keys(patchCours).length) majDeckChamps(cible.id, patchCours).catch(signalerErreur);
      return;
    }

    const made = list.map((d) => ({ id: uid(), name: d.name, cards: d.cards, created: Date.now(), ...(d.cours ? { cours: d.cours } : {}) }));
    setDecks((prev) => [...made, ...prev]);
    setSheet(null);
    say(`${made.length} paquet${made.length > 1 ? "s" : ""} · ${fiches.length} fiches importées`);
    Promise.all(made.map((d) => creerDeck(d))).catch(signalerErreur);
  };

  const newDeck = (name) => {
    const d = { id: uid(), name, cards: [], created: Date.now() };
    setDecks((prev) => [d, ...prev]);
    setSheet(null);
    setView({ name: "deck", id: d.id, draft: true });
    creerDeck(d).catch(signalerErreur);
  };

  /* Point d'entrée unique pour toute modification d'un paquet : les feuilles
     (menu, lot, rattacher, cours…) lui passent un patch de la même forme
     qu'en local. On sépare ce qui touche aux fiches — comparé avant/après
     pour n'envoyer que le nécessaire — du reste, mis à jour tel quel. */
  const updateDeck = (id, patch) => {
    const avant = decks.find((d) => d.id === id);
    setDecks((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    if (!avant) return;
    const { cards: apresCartes, ...champs } = patch;
    if (Object.keys(champs).length) majDeckChamps(id, champs).catch(signalerErreur);
    if (apresCartes) synchroniserCartes(id, avant.cards, apresCartes).catch(signalerErreur);
  };

  const removeDeck = (id) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setView({ name: "home" });
    setSheet(null);
    supprimerDeck(id).catch(signalerErreur);
  };

  const noterFiche = (paquetId, ficheId, maj) => {
    setDecks((prev) => prev.map((d) => (d.id !== paquetId ? d : {
      ...d,
      lastStudied: Date.now(),
      cards: d.cards.map((c) => (c.id === ficheId ? { ...c, ...maj } : c)),
    })));
    majCarte(ficheId, versChampsCartePartiels(maj)).catch(signalerErreur);
    majDeckChamps(paquetId, { lastStudied: Date.now() }).catch(signalerErreur);
  };

  const corrigerFiche = (paquetId, ficheId, maj) => {
    setDecks((prev) => prev.map((d) => (d.id !== paquetId ? d : {
      ...d,
      cards: d.cards.map((c) => {
        if (c.id !== ficheId) return c;
        const { suspendue, ...reste } = { ...c, ...maj };
        return suspendue ? { ...reste, suspendue: true } : reste;
      }),
    })));
    majCarte(ficheId, versChampsCartePartiels(maj)).catch(signalerErreur);
  };

  const ouvrirRevision = (source) =>
    setView({
      name: "study",
      file: source.jour
        ? fileDuJour(decks, Date.now())
        : source.section
        ? fileSection(source.paquet, source.section, Date.now())
        : filePaquet(source.paquet, source.filtre, Date.now()),
      sousTitre: source.jour ? "jour" : source.paquet.name,
      retour: source.jour
        ? { name: "home" }
        : source.section
        ? { name: "cours", id: source.paquet.id, section: source.section }
        : { name: "deck", id: source.paquet.id },
    });

  const deconnecter = async () => {
    await client.auth.signOut();
    setUtilisateur(null);
    setDecks([]);
    setView({ name: "home" });
    setSheet(null);
  };

  if (!ready) return <div className="bx"><style>{CSS}</style><div className="bx-shell" /></div>;

  if (!utilisateur) {
    return (
      <div className="bx">
        <style>{CSS}</style>
        <Connexion
          onConnecte={() => {
            client.auth.getSession().then(({ data }) => {
              setUtilisateur(data?.user || null);
              chargerPourUtilisateur();
            });
          }}
        />
      </div>
    );
  }

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
            onReviser={(section) => ouvrirRevision({ paquet: deck, section })}
            onMenu={() => setSheet({ type: "coursMenu" })}
            onNouvelleFiche={(texte, section) => setSheet({ type: "ficheDepuisCours", texte, section })}
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
        {sheet?.type === "astuces" && <AstucesSheet onClose={() => setSheet(null)} />}
        {sheet?.type === "backup" && (
          <CompteSheet email={utilisateur.email} onClose={() => setSheet(null)} onDeconnexion={deconnecter} />
        )}
        {sheet?.type === "section" && (
          <SectionSheet
            deck={decks.find((d) => d.id === sheet.paquetId)}
            section={sheet.section}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet?.type === "lot" && deck && (
          <LotSheet
            deck={deck}
            nombre={sheet.ids.length}
            onClose={() => setSheet(null)}
            onSection={(section) => {
              const dans = new Set(sheet.ids);
              updateDeck(deck.id, {
                cards: deck.cards.map((c) => {
                  if (!dans.has(c.id)) return c;
                  const { section: ancienne, ...reste } = c;
                  return section ? { ...reste, section } : reste;
                }),
              });
              sheet.vider();
              setSheet(null);
              say(section
                ? `${sheet.ids.length} fiche${sheet.ids.length > 1 ? "s" : ""} rattachée${sheet.ids.length > 1 ? "s" : ""}.`
                : "Rattachement retiré.");
            }}
            onPause={(enPause) => {
              const dans = new Set(sheet.ids);
              updateDeck(deck.id, {
                cards: deck.cards.map((c) => {
                  if (!dans.has(c.id)) return c;
                  const { suspendue, ...reste } = c;
                  return enPause ? { ...reste, suspendue: true } : reste;
                }),
              });
              sheet.vider();
              setSheet(null);
              say(enPause ? "Fiches mises en pause." : "Fiches réactivées.");
            }}
            onSupprimer={() => {
              const dans = new Set(sheet.ids);
              updateDeck(deck.id, { cards: deck.cards.filter((c) => !dans.has(c.id)) });
              sheet.vider();
              setSheet(null);
              say(`${sheet.ids.length} fiche${sheet.ids.length > 1 ? "s" : ""} supprimée${sheet.ids.length > 1 ? "s" : ""}.`);
            }}
          />
        )}
        {sheet?.type === "rattacher" && deck && (
          <RattacherSheet
            deck={deck}
            onClose={() => setSheet(null)}
            onEnregistrer={(choix) => {
              const retenues = Object.entries(choix).filter(([, s]) => s);
              updateDeck(deck.id, {
                cards: deck.cards.map((c) => (choix[c.id] ? { ...c, section: choix[c.id] } : c)),
              });
              setSheet(null);
              say(retenues.length + " fiche" + (retenues.length > 1 ? "s" : "") + " rattachée" + (retenues.length > 1 ? "s" : "") + ".");
            }}
          />
        )}
        {sheet?.type === "ficheDepuisCours" && deck && (
          <FicheDepuisCoursSheet
            deck={deck}
            texte={sheet.texte}
            section={sheet.section}
            onClose={() => setSheet(null)}
            onCreer={(q, a, section) => {
              const fiche = { ...mkCard(q, a), ...(section ? { section } : {}) };
              updateDeck(deck.id, { cards: [...deck.cards, fiche] });
              setSheet(null);
              say("Fiche ajoutée au paquet.");
            }}
          />
        )}
        {sheet?.type === "coursMenu" && deck && (
          <CoursMenuSheet
            deck={deck}
            onClose={() => setSheet(null)}
            onImporter={() => setSheet({ type: "cours" })}
            onRattacher={() => setSheet({ type: "rattacher" })}
            onSupprimer={() => {
              updateDeck(deck.id, { cours: "", cards: deck.cards.map(({ section, ...c }) => c) });
              setSheet(null);
              setView({ name: "deck", id: deck.id });
              say("Cours retiré.");
            }}
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
