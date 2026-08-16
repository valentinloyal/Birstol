import { useState } from "react";

export function NewDeckSheet({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Créer à la main</h2>
        <p className="lede">Un paquet vide, puis vous saisissez vos fiches une par une.</p>
        <input className="field" value={name} autoFocus placeholder="Nom du paquet"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onCreate(name.trim()); }} />
        <button className="btn btn-p" style={{ marginTop: 16 }} disabled={!name.trim()}
          onClick={() => onCreate(name.trim())}>
          Créer et ajouter une fiche
        </button>
      </div>
    </div>
  );
}
