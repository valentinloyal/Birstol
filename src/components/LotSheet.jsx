import { useState } from "react";
import { sections } from "../cours.js";

/* Que faire d'un lot de fiches sélectionnées. Sur un paquet de 76 fiches,
   ouvrir chaque fiche pour lui donner sa section est impraticable : c'est ce
   qui rendait le rattachement manuel inutilisable. */
export function LotSheet({ deck, nombre, onClose, onSection, onPause, onSupprimer }) {
  const [section, setSection] = useState("");
  const [confirme, setConfirme] = useState(false);
  const parties = sections(deck.cours);
  const s = nombre > 1 ? "s" : "";

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">{nombre} fiche{s}</h2>
        <p className="lede">Ce que vous faites ici s'applique aux {nombre} fiche{s} sélectionnée{s}.</p>

        {parties.length > 0 ? (
          <>
            <div className="label" style={{ marginTop: 0 }}>Rattacher à une section</div>
            <select className="field" value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Choisir une section…</option>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.titre}</option>)}
              <option value="__aucune">Retirer le rattachement</option>
            </select>
            <button className="btn btn-p" style={{ marginTop: 12 }} disabled={!section}
              onClick={() => onSection(section === "__aucune" ? "" : section)}>
              Rattacher les {nombre} fiche{s}
            </button>
          </>
        ) : (
          <p className="note">Ce paquet n'a pas encore de cours : importez-en un pour pouvoir rattacher des fiches.</p>
        )}

        <div className="menu" style={{ marginTop: 18 }}>
          <button onClick={() => onPause(true)}>
            Mettre en pause
            <small>écartées des révisions, sans être supprimées</small>
          </button>
          <button onClick={() => onPause(false)}>Réactiver</button>
          <button className="danger" onClick={() => (confirme ? onSupprimer() : setConfirme(true))}>
            {confirme ? `Confirmer : supprimer ${nombre} fiche${s}` : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
