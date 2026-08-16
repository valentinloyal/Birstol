import { useState } from "react";

export function MenuSheet({ deck, onClose, onRename, onReset, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(deck?.name || "");
  const [confirm, setConfirm] = useState(false);

  const exportDeck = () => {
    const blob = new Blob([JSON.stringify(deck.cards.map(({ q, a }) => ({ q, a })), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${deck.name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
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
