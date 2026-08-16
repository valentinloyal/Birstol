import { useState, useRef } from "react";
import { construireSauvegarde, lireSauvegarde, nomSauvegarde, compterFiches } from "../sauvegarde.js";
import { lireFichier, telecharger } from "../fichier.js";

export function BackupSheet({ decks, onClose, onRestore }) {
  const [enAttente, setEnAttente] = useState(null); // paquets lus, en attente de confirmation
  const [erreur, setErreur] = useState("");
  const fileRef = useRef(null);

  const fichesActuelles = compterFiches(decks);

  const exporter = () => {
    telecharger(nomSauvegarde(), JSON.stringify(construireSauvegarde(decks), null, 2));
    onClose();
  };

  const choisir = async (files) => {
    const f = files && files[0];
    if (!f) return;
    setErreur("");
    try {
      setEnAttente(lireSauvegarde(await lireFichier(f)));
    } catch (e) {
      setEnAttente(null);
      setErreur(e.message);
    }
  };

  if (enAttente) {
    return (
      <div className="sheet-bg" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="grip" />
          <h2 className="display">Restaurer</h2>
          <p className="lede">
            Cette sauvegarde contient {enAttente.length} paquet{enAttente.length > 1 ? "s" : ""} et{" "}
            {compterFiches(enAttente)} fiche{compterFiches(enAttente) > 1 ? "s" : ""}.
          </p>
          <p className="note">
            {decks.length
              ? `Elle remplacera vos ${decks.length} paquet${decks.length > 1 ? "s" : ""} actuels et leur progression. Cette opération ne peut pas être annulée.`
              : "Votre base est vide : rien ne sera écrasé."}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-s" onClick={() => setEnAttente(null)}>Annuler</button>
            <button className="btn btn-p" onClick={() => onRestore(enAttente)}>Remplacer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Sauvegarde</h2>
        <p className="lede">
          Vos fiches ne vivent que dans ce navigateur. Un nettoyage les efface sans recours.
        </p>

        <div className="menu">
          <button onClick={exporter} disabled={!decks.length}>
            Exporter toutes mes fiches
            <small style={{ display: "block", fontWeight: 400, fontSize: 12, color: "var(--sourdine)" }}>
              {decks.length
                ? `${decks.length} paquet${decks.length > 1 ? "s" : ""} · ${fichesActuelles} fiche${fichesActuelles > 1 ? "s" : ""}, progression comprise`
                : "rien à exporter pour l'instant"}
            </small>
          </button>
          <button onClick={() => fileRef.current.click()}>
            Restaurer une sauvegarde
            <small style={{ display: "block", fontWeight: 400, fontSize: 12, color: "var(--sourdine)" }}>
              remplace tout par le contenu du fichier
            </small>
          </button>
        </div>

        <input ref={fileRef} type="file" accept=".json,application/json" hidden
          onChange={(e) => { choisir(e.target.files); e.target.value = ""; }} />

        {erreur && (
          <p className="note" style={{ color: "var(--rouge)", marginTop: 14 }}>{erreur}</p>
        )}
      </div>
    </div>
  );
}
