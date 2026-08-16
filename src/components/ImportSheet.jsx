import { useState, useEffect, useRef } from "react";
import { parseText, cleanName } from "../parse.js";
import { Ico, I } from "./Icons.jsx";
import { lireFichier } from "../fichier.js";


export function ImportSheet({ onClose, onDone }) {
  const [tab, setTab] = useState("fichier");
  const [hot, setHot] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const fileRef = useRef(null);
  const dirRef = useRef(null);

  useEffect(() => {
    if (dirRef.current) { dirRef.current.webkitdirectory = true; dirRef.current.directory = true; }
  }, []);

  const handleFiles = async (files) => {
    const out = [];
    for (const f of Array.from(files)) {
      if (f.size > 2000000) continue;
      const parsed = parseText(await lireFichier(f), cleanName(f.name));
      if (parsed) out.push(parsed);
    }
    onDone(out);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setHot(false);
    const items = Array.from(e.dataTransfer.items || []);
    const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
    if (entries.length) {
      const files = [];
      const walk = (entry) =>
        new Promise((res) => {
          if (entry.isFile) entry.file((f) => { files.push(f); res(); });
          else if (entry.isDirectory) {
            entry.createReader().readEntries(async (list) => { await Promise.all(list.map(walk)); res(); });
          } else res();
        });
      await Promise.all(entries.map(walk));
      handleFiles(files);
    } else handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Ajouter des fiches</h2>
        <p className="lede">Un fichier = un paquet. Le nom du fichier devient le nom du paquet.</p>

        <div className="tabs" role="tablist">
          {["fichier", "texte"].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === "fichier" ? "Fichiers" : "Coller du texte"}
            </button>
          ))}
        </div>

        {tab === "fichier" ? (
          <>
            <div className={"drop" + (hot ? " hot" : "")}
              onDragOver={(e) => { e.preventDefault(); setHot(true); }}
              onDragLeave={() => setHot(false)}
              onDrop={onDrop}>
              <Ico d={I.folder} size={26} />
              <p>Glissez un dossier entier, ou choisissez ci-dessous.</p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button className="btn btn-s" style={{ height: 48 }} onClick={() => fileRef.current.click()}>Des fichiers</button>
              <button className="btn btn-s" style={{ height: 48 }} onClick={() => dirRef.current.click()}>Un dossier</button>
            </div>
            <input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.tsv,.json,text/*" hidden
              onChange={(e) => handleFiles(e.target.files)} />
            <input ref={dirRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
            <p className="note">
              Formats lus automatiquement : <code>question ; réponse</code>, <code>question :: réponse</code>,
              tabulation, <code>Q:</code> / <code>R:</code>, blocs séparés par une ligne vide, et JSON.
            </p>
          </>
        ) : (
          <>
            <input className="field" value={name} placeholder="Nom du paquet" onChange={(e) => setName(e.target.value)} />
            <div className="label">Une fiche par ligne</div>
            <textarea className="field" rows={8} value={text} placeholder={"Quelle est la capitale du Japon ; Tokyo\nEncapsulation ; Regrouper données et méthodes…"}
              onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-p" style={{ marginTop: 14 }} disabled={!text.trim()}
              onClick={() => {
                const p = parseText(text, name.trim() || "Paquet collé");
                onDone(p ? [{ ...p, name: name.trim() || p.name }] : []);
              }}>
              Créer le paquet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
