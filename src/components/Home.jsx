import { counts, relative } from "../outils.js";
import { InstallButton } from "./Install.jsx";
import { Segments } from "./Segments.jsx";
import { Ico, I } from "./Icons.jsx";

export function Home({ decks, ready, onOpen, onSheet }) {
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
        <button className="iconbtn" onClick={() => onSheet({ type: "backup" })} aria-label="Sauvegarde">
          <Ico d={I.more} />
        </button>
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
