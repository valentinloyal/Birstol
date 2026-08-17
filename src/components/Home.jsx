import { counts, relative } from "../outils.js";
import { compterDues, prochaineEcheance, dansCombien, estActive } from "../revision.js";
import { InstallButton } from "./Install.jsx";
import { Segments } from "./Segments.jsx";
import { Ico, I } from "./Icons.jsx";
import { AstucesBloc } from "./AstucesSheet.jsx";

export function Home({ decks, ready, onOpen, onJour, onSheet }) {
  // Les fiches en pause sont mises de cote : elles ne pesent sur aucun compteur.
  const all = decks.flatMap((d) => d.cards).filter(estActive);
  const [aRevoir, , acquis] = counts(all);

  const maintenant = Date.now();
  const dues = compterDues(decks, maintenant);
  const suivante = prochaineEcheance(decks, maintenant);

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div className="sub">Fiches de révision</div>
          <h1 className="display">Memento</h1>
        </div>
        <InstallButton onHelp={() => onSheet({ type: "install" })} />
        <button className="iconbtn" onClick={() => onSheet({ type: "backup" })} aria-label="Sauvegarde">
          <Ico d={I.more} />
        </button>
      </div>

      <div className="scroll scroll-accueil">
        {decks.length > 0 && (
          <div className="tally">
            <div><b>{decks.length}</b><span>Paquets</span></div>
            <div><b style={{ color: "var(--rouge)" }}>{aRevoir}</b><span>À revoir</span></div>
            <div><b style={{ color: "var(--vert)" }}>{all.length ? Math.round((acquis / all.length) * 100) : 0}%</b><span>Acquis</span></div>
          </div>
        )}

        {/* Le geste du jour, tous paquets confondus : c'est ce qui doit
            transformer l'app en habitude, donc c'est le seul bouton mis en avant. */}
        {dues > 0 && (
          <button className="btn btn-p jour" onClick={onJour}>
            <b>{dues} fiche{dues > 1 ? "s" : ""} à réviser</b>
            <small>aujourd'hui, tous paquets confondus</small>
          </button>
        )}
        {decks.length > 0 && dues === 0 && (
          <div className="rien-du-jour">
            <b>À jour.</b> {suivante ? "Prochaine fiche " + dansCombien(suivante, maintenant) + "." : ""}
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
            <Segments cards={d.cards.filter(estActive)} />
          </button>
        ))}
        <AstucesBloc onOuvrir={() => onSheet({ type: "astuces" })} />
      </div>

      <div className="foot">
        <button className="btn btn-s" onClick={() => onSheet({ type: "new" })}>Créer à la main</button>
        <button className="btn btn-p" onClick={() => onSheet({ type: "import" })}>Importer</button>
      </div>
    </>
  );
}
