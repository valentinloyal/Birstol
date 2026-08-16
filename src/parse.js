/* Parseur d'import : texte brut d'un fichier -> { name, cards }.
   Volontairement pur — aucun accès au DOM ni au FileReader — pour rester
   testable directement avec node --test. */

import { mkCard } from "./outils.js";

export const SEPS = ["::", "\t", " | ", "|", ";", " — ", " - ", ","];

/* Coupe une ligne en question / réponse. Les espaces autour du séparateur lèvent
   l'ambiguïté : dans « Que fait int x = 5; ? ; Déclare un entier », la coupure
   doit tomber sur le point-virgule espacé, pas sur celui du code Java. Faute
   d'occurrence espacée, on garde la première, comme avant.
   Élire " ; " comme séparateur à part entière ne suffisait pas : une seule
   ligne écrite « question;reponse » — une en-tête de CSV, par exemple — faisait
   gagner la forme nue au comptage et recoupait tout le fichier au mauvais endroit. */
const coupe = (l, sep) => {
  const espace = l.indexOf(" " + sep + " ");
  const i = espace > 0 ? espace + 1 : l.indexOf(sep);
  return i > 0 ? [l.slice(0, i), l.slice(i + sep.length)] : null;
};

/* Mots qui trahissent une ligne d'en-tête de CSV plutôt qu'une vraie fiche. */
const ENTETES = new Set([
  "question", "questions", "q", "recto", "front", "carte", "fiche", "intitule",
  "reponse", "reponses", "r", "a", "answer", "verso", "back", "definition",
]);
// NFD sépare les accents de leur lettre, le filtre a-z les jette ensuite.
const sansAccent = (s) => s.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");
const estEntete = (c) => ENTETES.has(sansAccent(c.q)) && ENTETES.has(sansAccent(c.a));

/* Un fichier binaire lâché dans l'import ne doit produire aucune fiche. Écrit
   avec des codes de caractères : des caractères de contrôle littéraux dans une
   expression régulière seraient invisibles à la relecture. */
function estBinaire(text) {
  let controles = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0) return true; // un NUL ne se rencontre jamais dans un fichier texte
    if (c < 32 && c !== 9 && c !== 10) controles++; // hors tabulation et saut de ligne
  }
  return controles / text.length > 0.01;
}

export function parseText(raw, fallbackName) {
  const text = raw.replace(/\r/g, "").trim();
  if (!text || estBinaire(text)) return null;

  if (text[0] === "[" || text[0] === "{") {
    try {
      const j = JSON.parse(text);
      const arr = Array.isArray(j) ? j : j.cards || j.fiches || j.questions || [];
      const cards = arr
        .map((o) =>
          typeof o === "object"
            ? mkCard(String(o.q ?? o.question ?? o.recto ?? ""), String(o.a ?? o.r ?? o.answer ?? o.reponse ?? o.réponse ?? o.verso ?? ""))
            : null
        )
        .filter((c) => c && c.q && c.a);
      if (cards.length) return { name: j.name || j.nom || fallbackName, cards };
    } catch { /* on continue en texte */ }
  }

  const lines = text.split("\n").map((l) => l.trim());

  const qa = /^(q|question)\s*[:.\-)]\s*/i;
  const ra = /^(r|a|rep|rép|reponse|réponse|answer)\s*[:.\-)]\s*/i;
  if (lines.some((l) => qa.test(l)) && lines.some((l) => ra.test(l))) {
    const cards = [];
    let cur = null;
    for (const l of lines) {
      if (qa.test(l)) {
        if (cur && cur.q && cur.a) cards.push(mkCard(cur.q, cur.a));
        cur = { q: l.replace(qa, ""), a: "" };
      } else if (ra.test(l) && cur) {
        cur.a = l.replace(ra, "");
      } else if (cur && l) {
        cur[cur.a ? "a" : "q"] += "\n" + l;
      }
    }
    if (cur && cur.q && cur.a) cards.push(mkCard(cur.q, cur.a));
    if (cards.length) return { name: fallbackName, cards };
  }

  const useful = lines.filter((l) => l && !l.startsWith("#"));
  let best = null;
  for (const sep of SEPS) {
    let n = 0;
    for (const l of useful) {
      const i = l.indexOf(sep);
      if (i > 0 && l.slice(i + sep.length).trim()) n++;
    }
    if (n && (!best || n > best.n)) best = { sep, n };
  }
  if (best && best.n >= Math.max(1, useful.length * 0.6)) {
    const cards = [];
    for (const l of useful) {
      const paire = coupe(l, best.sep);
      if (!paire) continue;
      const c = mkCard(paire[0], paire[1]);
      if (c.q && c.a) cards.push(c);
    }
    // Un CSV exporté depuis un tableur ouvre sur sa ligne d'en-tête : elle
    // donnerait une fiche « question / réponse » sans intérêt. On ne la retire
    // que s'il reste des fiches derrière, pour ne jamais vider un paquet.
    if (cards.length > 1 && estEntete(cards[0])) cards.shift();
    if (cards.length) return { name: fallbackName, cards };
  }

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim().split("\n"));
  const cards = blocks.filter((b) => b.length >= 2).map((b) => mkCard(b[0], b.slice(1).join("\n")));
  if (cards.length) return { name: fallbackName, cards };
  return null;
}

export const cleanName = (f) => f.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Sans titre";
