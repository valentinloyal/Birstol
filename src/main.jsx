import React from "react";
import { createRoot } from "react-dom/client";
import Memento from "./App.jsx";

createRoot(document.getElementById("root")).render(<Memento />);

// Le service worker sert l'app hors-ligne ; un échec d'enregistrement
// (page ouverte en file://, navigateur ancien) ne doit pas casser l'app.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
