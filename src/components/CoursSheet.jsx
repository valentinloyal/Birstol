import { useState, useRef } from "react";
import { lireFichier } from "../fichier.js";
import { sections } from "../cours.js";
import { Ico, I } from "./Icons.jsx";

/* Import d'un cours : un fichier markdown, ou du texte collé. On montre le
   découpage obtenu avant d'enregistrer — un cours sans titres ne donnerait
   qu'une seule section, et mieux vaut le voir tout de suite. */
export function CoursSheet({ deck, onClose, onDone }) {
  const [texte, setTexte] = useState("");
  const fileRef = useRef(null);

  const parties = sections(texte);

  const prendreFichier = async (files) => {
    const f = files && files[0];
    if (!f || f.size > 2000000) return;
    setTexte(await lireFichier(f));
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">{deck.cours ? "Remplacer le cours" : "Ajouter un cours"}</h2>
        <p className="lede">
          Un fichier markdown. Ses titres <code>#</code> et <code>##</code> découpent le cours en sections.
        </p>

        <button className="btn btn-s" style={{ height: 48 }} onClick={() => fileRef.current.click()}>
          <span><Ico d={I.folder} size={17} /> Choisir un fichier .md</span>
        </button>
        <input ref={fileRef} type="file" accept=".md,.markdown,.txt,text/*" hidden
          onChange={(e) => { prendreFichier(e.target.files); e.target.value = ""; }} />

        <div className="label">Ou coller le cours</div>
        <textarea className="field" rows={7} value={texte} placeholder={"# La JVM\n\nJava compile en deux temps.\n\n## Le bytecode\n..."}
          onChange={(e) => setTexte(e.target.value)} />

        {parties.length > 0 && (
          <p className="note" style={{ marginTop: 12 }}>
            {parties.length} section{parties.length > 1 ? "s" : ""} :{" "}
            {parties.slice(0, 4).map((s) => s.titre).join(" · ")}
            {parties.length > 4 ? " …" : ""}
          </p>
        )}
        {texte.trim() && parties.length <= 1 && (
          <p className="note" style={{ marginTop: 12, color: "var(--or)" }}>
            Aucun titre trouvé : le cours restera d'un seul tenant. Ajoutez des lignes
            commençant par <code>##</code> pour pouvoir y rattacher des fiches.
          </p>
        )}

        {deck.cours && (
          <p className="note" style={{ marginTop: 12 }}>
            Les fiches rattachées à une section dont le titre change perdront leur lien.
          </p>
        )}

        <button className="btn btn-p" style={{ marginTop: 14 }} disabled={!texte.trim()}
          onClick={() => onDone(texte)}>
          Enregistrer le cours
        </button>
      </div>
    </div>
  );
}
