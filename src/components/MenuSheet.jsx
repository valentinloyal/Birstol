import { useState } from "react";
import { telecharger } from "../fichier.js";

export function MenuSheet({ deck, onClose, onRename, onReset, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(deck?.name || "");
  const [confirm, setConfirm] = useState(false);

  const exportDeck = () => {
    // Export d'un paquet : seulement q et a, pour rester reimportable ailleurs.
    // La sauvegarde complete, elle, garde la progression (voir sauvegarde.js).
    telecharger(deck.name + ".json", JSON.stringify(deck.cards.map(({ q, a }) => ({ q, a })), null, 2));
    onClose();
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        {renaming ? (
          <>
            <h2 className="display">Renommer</h2>
            <input className="field" style={{ marginTop: 12 }} value={name} autoFocus onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-p" style={{ marginTop: 14 }} disabled={!name.trim()} onClick={() => onRename(name.trim())}>Enregistrer</button>
          </>
        ) : (
          <>
            <h2 className="display">{deck?.name}</h2>
            <p className="lede">{deck?.cards.length} fiches</p>
            <div className="menu">
              <button onClick={() => setRenaming(true)}>Renommer le paquet</button>
              <button onClick={exportDeck}>Exporter en JSON</button>
              <button onClick={onReset}>Remettre la progression à zéro</button>
              <button className="danger" onClick={() => (confirm ? onDelete() : setConfirm(true))}>
                {confirm ? "Confirmer la suppression" : "Supprimer le paquet"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
