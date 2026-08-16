import { useState } from "react";
import { telecharger } from "../fichier.js";
import { sections } from "../cours.js";

/* Actions du cours, sorties du pied de page pour lui laisser toute la place :
   sur un téléphone, le geste principal doit rester à portée du pouce. */
export function CoursMenuSheet({ deck, onClose, onImporter, onRattacher, onSupprimer }) {
  const [confirme, setConfirme] = useState(false);
  const parties = sections(deck.cours);
  const sansSection = deck.cards.filter((c) => !c.section).length;

  const exporter = () => {
    telecharger(deck.name + ".md", deck.cours, "text/markdown");
    onClose();
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Le cours</h2>
        <p className="lede">
          {parties.length} section{parties.length > 1 ? "s" : ""} ·{" "}
          {deck.cards.length - sansSection} fiche{deck.cards.length - sansSection > 1 ? "s" : ""} rattachée
          {deck.cards.length - sansSection > 1 ? "s" : ""}
        </p>
        <div className="menu">
          {sansSection > 0 && (
            <button onClick={onRattacher}>
              Rattacher les fiches
              <small>{sansSection} fiche{sansSection > 1 ? "s" : ""} sans section</small>
            </button>
          )}
          <button onClick={onImporter}>Remplacer le cours</button>
          <button onClick={exporter}>
            Exporter le cours
            <small>un fichier .md, à retravailler ailleurs</small>
          </button>
          <button className="danger" onClick={() => (confirme ? onSupprimer() : setConfirme(true))}>
            {confirme ? "Confirmer : retirer le cours et les liens" : "Retirer le cours"}
          </button>
        </div>
      </div>
    </div>
  );
}
