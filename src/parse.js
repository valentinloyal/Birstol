/* Parseur d'import : texte brut d'un fichier -> { name, cards }.
   Volontairement pur — aucun accès au DOM ni au FileReader — pour rester
   testable directement avec node --test. */

import { mkCard } from "./outils.js";

export const SEPS = ["::", "\t", " | ", "|", ";", " — ", " - ", ","];

export function parseText(raw, fallbackName) {
  const text = raw.replace(/\r/g, "").trim();
  if (!text) return null;

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
      const i = l.indexOf(best.sep);
      if (i > 0) {
        const c = mkCard(l.slice(0, i), l.slice(i + best.sep.length));
        if (c.q && c.a) cards.push(c);
      }
    }
    if (cards.length) return { name: fallbackName, cards };
  }

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim().split("\n"));
  const cards = blocks.filter((b) => b.length >= 2).map((b) => mkCard(b[0], b.slice(1).join("\n")));
  if (cards.length) return { name: fallbackName, cards };
  return null;
}

export const cleanName = (f) => f.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Sans titre";
