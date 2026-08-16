import { useState, useRef, useEffect } from "react";
import { sections } from "../cours.js";

/* Fiche créée depuis un passage du cours.

   Le passage sélectionné devient la RÉPONSE, et la question reste à écrire :
   on sélectionne ce qu'on veut savoir restituer, la question est ce qu'on
   formule soi-même. Le champ question prend le focus d'emblée pour que la
   saisie commence sans un appui de plus. */
export function FicheDepuisCoursSheet({ deck, texte, section, onClose, onCreer }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState(texte || "");
  const [lien, setLien] = useState(section || "");
  const qRef = useRef(null);
  const parties = sections(deck.cours);

  useEffect(() => { if (qRef.current) qRef.current.focus(); }, []);

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Nouvelle fiche</h2>
        <p className="lede">Le passage retenu devient la réponse. Reste à écrire la question.</p>

        <div className="label" style={{ marginTop: 0 }}>Question</div>
        <textarea ref={qRef} className="field" rows={2} value={q} placeholder="Que voulez-vous pouvoir restituer ?"
          onChange={(e) => setQ(e.target.value)} />

        <div className="label">Réponse</div>
        <textarea className="field" rows={4} value={a} onChange={(e) => setA(e.target.value)} />

        {parties.length > 0 && (
          <>
            <div className="label">Section du cours</div>
            <select className="field" value={lien} onChange={(e) => setLien(e.target.value)}>
              <option value="">Aucune</option>
              {parties.map((s) => <option key={s.id} value={s.id}>{s.titre}</option>)}
            </select>
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn btn-s" onClick={onClose}>Annuler</button>
          <button className="btn btn-p" disabled={!q.trim() || !a.trim()}
            onClick={() => onCreer(q.trim(), a.trim(), lien)}>
            Ajouter au paquet
          </button>
        </div>
      </div>
    </div>
  );
}
