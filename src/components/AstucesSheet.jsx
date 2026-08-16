import { useState, useRef } from "react";
import { ASTUCES } from "../astuces.js";
import { Ico, I } from "./Icons.jsx";

/* Les astuces sont la seule documentation de l'app. Une seule est ouverte à la
   fois : sur un écran de téléphone, tout déplier d'un coup rend la liste
   illisible et fait perdre le fil. */
export function AstucesSheet({ onClose }) {
  const [ouverte, setOuverte] = useState(null);
  const [copie, setCopie] = useState("");
  const texteRef = useRef(null);

  const copier = async (astuce) => {
    try {
      await navigator.clipboard.writeText(astuce.prompt);
      setCopie(astuce.id);
      setTimeout(() => setCopie(""), 2200);
    } catch {
      /* Le presse-papiers peut être refusé : hors HTTPS, ou fenêtre sans focus.
         Plutôt que de laisser l'utilisateur devant un échec, on sélectionne le
         prompt pour qu'un appui long suffise à le copier. */
      const bloc = texteRef.current;
      if (bloc) {
        const plage = document.createRange();
        plage.selectNodeContents(bloc);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(plage);
      }
      setCopie("echec");
      setTimeout(() => setCopie(""), 4000);
    }
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Astuces</h2>
        <p className="lede">Ce que l'app sait faire et qui ne se voit pas.</p>

        <div className="astuces">
          {ASTUCES.map((a) => {
            const active = ouverte === a.id;
            return (
              <div key={a.id} className={active ? "ouverte" : ""}>
                <button onClick={() => setOuverte(active ? null : a.id)} aria-expanded={active}>
                  <span>{a.titre}</span>
                  <em>{active ? "−" : "+"}</em>
                </button>
                {active && (
                  <div className="corps">
                    <p>{a.texte}</p>
                    {a.prompt && (
                      <>
                        <button className="btn btn-p" style={{ height: 44, marginBottom: 10 }}
                          onClick={() => copier(a)}>
                          {copie === a.id ? "Copié" : copie === "echec" ? "Texte sélectionné : appui long, puis Copier" : "Copier le prompt"}
                        </button>
                        <pre ref={texteRef}>{a.prompt}</pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-s" style={{ marginTop: 16 }} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

/* Le bloc de l'accueil, juste au-dessus de « Créer à la main » et « Importer ». */
export function AstucesBloc({ onOuvrir }) {
  return (
    <button className="astuces-bloc" onClick={onOuvrir}>
      <span className="pastille"><Ico d={I.astuce} size={17} /></span>
      <span>
        <b>Astuces</b>
        <small>Faire écrire un paquet par une IA, noter au pouce, relier le cours…</small>
      </span>
    </button>
  );
}
