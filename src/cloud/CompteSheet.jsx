import { useState, useRef } from "react";
import { lireSauvegarde, compterFiches } from "../sauvegarde.js";
import { lireFichier } from "../fichier.js";

/* Version en ligne de la sauvegarde : les fiches vivent sur le serveur, donc
   pas d'export manuel (perdre le navigateur ne perd rien) — mais restaurer
   une sauvegarde JSON (faite ici ou depuis la version locale) reste utile :
   récupérer une base locale, ou remonter après une erreur de manipulation. */
export function CompteSheet({ email, decks, onClose, onDeconnexion, onRestore }) {
  const [enAttente, setEnAttente] = useState(null);
  const [erreur, setErreur] = useState("");
  const fileRef = useRef(null);

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
              ? `Elle remplacera vos ${decks.length} paquet${decks.length > 1 ? "s" : ""} actuels et leur progression, sur le compte ${email}. Cette opération ne peut pas être annulée.`
              : "Votre compte est vide : rien ne sera écrasé."}
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
        <h2 className="display">Compte</h2>
        <p className="lede">Connecté en tant que {email}. Vos fiches sont sauvegardées automatiquement.</p>

        <div className="menu">
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

        <button className="btn btn-s" style={{ marginTop: 14 }} onClick={onDeconnexion}>Se déconnecter</button>
      </div>
    </div>
  );
}
