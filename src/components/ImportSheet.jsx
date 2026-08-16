import { useState, useEffect, useRef } from "react";
import { parseText, cleanName } from "../parse.js";
import { Ico, I } from "./Icons.jsx";
import { lireFichier } from "../fichier.js";


/* `texteInitial` et `nomInitial` servent au partage Android : la feuille
   s'ouvre déjà remplie, sur l'onglet texte, et l'utilisateur voit ce qui va
   être créé avant de valider. Importer un partage en silence créerait un
   paquet parasite dès qu'on partage une phrase ou un lien par mégarde. */
export function ImportSheet({ decks = [], onClose, onDone, texteInitial = "", nomInitial = "" }) {
  const [tab, setTab] = useState(texteInitial ? "texte" : "fichier");
  const [hot, setHot] = useState(false);
  const [name, setName] = useState(nomInitial);
  const [text, setText] = useState(texteInitial);
  /* Destination : un paquet neuf, ou un paquet existant à compléter. Les
     paquets sont générés par jour et s'empilent vite ; pouvoir verser dans
     un paquet déjà là évite d'en accumuler une liste. */
  const [destination, setDestination] = useState("");
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
    onDone(out, destination);
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
        <p className="lede">
          {destination
            ? "Les fiches rejoindront un paquet existant."
            : "Un fichier = un paquet. Le nom du fichier devient le nom du paquet."}
        </p>

        {decks.length > 0 && (
          <>
            <div className="label" style={{ marginTop: 0 }}>Destination</div>
            <select className="field" value={destination} onChange={(e) => setDestination(e.target.value)}>
              <option value="">Créer un nouveau paquet</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>Ajouter à « {d.name} »</option>
              ))}
            </select>
          </>
        )}

        <div className="tabs" role="tablist" style={{ marginTop: 16 }}>
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
                onDone(p ? [{ ...p, name: name.trim() || p.name }] : [], destination);
              }}>
              Créer le paquet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
