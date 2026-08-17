/* Sauvegarde complète de la base : fabrication et relecture du JSON.
   Volontairement pur — aucun accès au DOM — pour rester testable avec node --test.

   Contrairement à l'export d'un paquet (qui ne garde que q et a, pour être
   réimportable ailleurs), la sauvegarde conserve tout : identifiants, niveaux
   Leitner, dates. Elle sert à remonter la base à l'identique, pas à partager. */

import { uid } from "./outils.js";

export const VERSION = 1;

export function construireSauvegarde(decks) {
  return { memento: VERSION, exporte: new Date().toISOString(), paquets: decks };
}

/* Nom de fichier daté : deux sauvegardes du même jour s'écrasent, c'est voulu. */
export function nomSauvegarde(date = new Date()) {
  const deuxChiffres = (n) => String(n).padStart(2, "0");
  const jour = [date.getFullYear(), deuxChiffres(date.getMonth() + 1), deuxChiffres(date.getDate())].join("-");
  return "memento-sauvegarde-" + jour + ".json";
}

const estFiche = (c) => c && typeof c === "object" && typeof c.q === "string" && typeof c.a === "string";

/* Rend un tableau de paquets propre, ou lève une erreur dont le message est
   montré tel quel à l'écran : il doit rester compréhensible sans le code. */
export function lireSauvegarde(texte) {
  let j;
  try {
    j = JSON.parse(texte);
  } catch {
    throw new Error("Ce fichier n'est pas du JSON.");
  }

  // On accepte aussi le tableau nu, qui est ce que contient localStorage.
  const brut = Array.isArray(j) ? j : j && j.paquets;
  if (!Array.isArray(brut)) {
    throw new Error("Ce fichier n'est pas une sauvegarde Memento.");
  }
  if (brut.some((d) => d && typeof d === "object" && "q" in d && !("cards" in d))) {
    throw new Error("Ceci est l'export d'un seul paquet. Passez par Importer, pas par Restaurer.");
  }
  if (!brut.length) {
    throw new Error("Cette sauvegarde ne contient aucun paquet.");
  }

  const paquets = brut
    .filter((d) => d && typeof d === "object" && Array.isArray(d.cards))
    .map((d) => ({
      id: typeof d.id === "string" && d.id ? d.id : uid(),
      name: typeof d.name === "string" && d.name.trim() ? d.name.trim() : "Sans titre",
      created: Number.isFinite(d.created) ? d.created : Date.now(),
      ...(Number.isFinite(d.lastStudied) ? { lastStudied: d.lastStudied } : {}),
      // Le cours fait partie du paquet : le perdre viderait la moitié du travail.
      ...(typeof d.cours === "string" && d.cours.trim() ? { cours: d.cours } : {}),
      cards: d.cards
        .filter(estFiche)
        .filter((c) => c.q.trim() && c.a.trim())
        .map((c) => ({
          id: typeof c.id === "string" && c.id ? c.id : uid(),
          q: c.q.trim(),
          a: c.a.trim(),
          box: c.box === 1 || c.box === 2 ? c.box : 0,
          // La programmation des révisions fait partie de la sauvegarde : la
          // perdre remettrait tout le paquet à réviser aujourd'hui. Absente
          // d'une vieille sauvegarde, elle sera reconstruite par la migration.
          ...(Number.isFinite(c.interval) ? { interval: c.interval } : {}),
          ...(Number.isFinite(c.due) ? { due: c.due } : {}),
          // Lien vers une section du cours, quand la fiche en porte un.
          ...(typeof c.section === "string" && c.section ? { section: c.section } : {}),
          // Mise en pause : la perdre remettrait les fiches ecartees en circulation.
          ...(c.suspendue === true ? { suspendue: true } : {}),
        })),
    }));

  if (!paquets.length) {
    throw new Error("Cette sauvegarde ne contient aucun paquet lisible.");
  }
  return paquets;
}

export const compterFiches = (paquets) => paquets.reduce((n, d) => n + d.cards.length, 0);
