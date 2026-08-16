import { useState, useEffect } from "react";
import { Ico, I } from "./Icons.jsx";

export function InstallButton({ onHelp }) {
  const [posee, setPosee] = useState(false);

  useEffect(() => {
    const done = () => setPosee(true);
    window.addEventListener("bip-done", done);
    const mq = window.matchMedia("(display-mode: standalone)");
    setPosee(mq.matches || window.navigator.standalone === true);
    return () => window.removeEventListener("bip-done", done);
  }, []);

  if (posee) return null;

  const go = async () => {
    const e = window.__bip;
    if (!e) { onHelp(); return; }
    e.prompt();
    await e.userChoice;
    window.__bip = null;
  };

  return (
    <button className="pill" onClick={go} aria-label="Installer l'application">
      <Ico d={I.install} size={15} /> Installer
    </button>
  );
}

export function InstallSheet({ onClose }) {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Sur l'écran d'accueil</h2>
        <p className="lede">L'app s'ouvre alors en plein écran et fonctionne sans connexion.</p>
        {ios ? (
          <ol className="steps">
            <li>Ouvrez cette page dans <b>Safari</b>.</li>
            <li>Touchez le bouton <b>Partager</b>, en bas.</li>
            <li>Choisissez <b>Sur l'écran d'accueil</b>.</li>
          </ol>
        ) : (
          <ol className="steps">
            <li>Touchez le menu <b>⋮</b> du navigateur.</li>
            <li>Choisissez <b>Ajouter à l'écran d'accueil</b>.</li>
            <li>Confirmez avec <b>Installer</b>.</li>
          </ol>
        )}
        <button className="btn btn-s" style={{ marginTop: 18 }} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}
