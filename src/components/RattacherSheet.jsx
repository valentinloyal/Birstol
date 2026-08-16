import { useState } from "react";
import { sections, proposerRattachements } from "../cours.js";

/* Rattacher les fiches aux sections, en une passe.

   Rattacher 24 fiches une par une, c'est 24 allers-retours : personne ne le
   fait. Ici chaque fiche arrive avec une section déjà proposée, et il ne reste
   qu'à corriger les erreurs. On enregistre tout d'un coup.

   Pensé pour le pouce : une ligne par fiche, la question sur une seule ligne
   tronquée, et le choix sur toute la largeur juste en dessous. */
export function RattacherSheet({ deck, onClose, onEnregistrer }) {
  const parties = sections(deck.cours);
  const [choix, setChoix] = useState(() => {
    const depart = {};
    for (const { fiche, proposition } of proposerRattachements(deck)) {
      depart[fiche.id] = proposition ? proposition.id : "";
    }
    return depart;
  });

  const aRattacher = proposerRattachements(deck);
  const proposees = aRattacher.filter((x) => x.proposition).length;
  const retenues = Object.values(choix).filter(Boolean).length;

  if (!aRattacher.length) {
    return (
      <div className="sheet-bg" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="grip" />
          <h2 className="display">Tout est rattaché</h2>
          <p className="lede">Chaque fiche de ce paquet pointe déjà une section du cours.</p>
          <button className="btn btn-s" style={{ marginTop: 12 }} onClick={onClose}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Rattacher les fiches</h2>
        <p className="lede">
          {aRattacher.length} fiche{aRattacher.length > 1 ? "s" : ""} sans section.
          {proposees > 0 && ` ${proposees} proposition${proposees > 1 ? "s" : ""} d'après les mots du cours, à corriger si besoin.`}
        </p>

        <div className="rattacher">
          {aRattacher.map(({ fiche, proposition }) => (
            <div key={fiche.id}>
              <p title={fiche.q}>{fiche.q}</p>
              <select className="field" value={choix[fiche.id] || ""}
                onChange={(e) => setChoix({ ...choix, [fiche.id]: e.target.value })}>
                <option value="">Laisser sans section</option>
                {parties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titre}{proposition && proposition.id === s.id ? " — proposé" : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn btn-s" onClick={onClose}>Annuler</button>
          <button className="btn btn-p" disabled={!retenues} onClick={() => onEnregistrer(choix)}>
            Rattacher {retenues || ""}
          </button>
        </div>
      </div>
    </div>
  );
}
