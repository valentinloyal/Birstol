/* Programmation des révisions : quand une fiche doit-elle revenir.
   Volontairement pur — aucun accès au DOM, l'instant présent est toujours passé
   en argument — pour rester testable avec node --test.

   Le champ `box` ne change pas de sens : il porte toujours la couleur et le
   niveau Leitner (0 rouge, 1 orange, 2 vert). On lui adjoint `interval`, en
   jours, et `due`, l'instant à partir duquel la fiche redevient à réviser.

   L'échelle 1 / 3 / 7 / 21 tient sur trois boîtes parce que « Acquis » monte
   d'un cran quand il est répété : 7 jours la première fois, 21 ensuite. */

import { shuffle } from "./outils.js";

export const INTERVALLES = [1, 3, 7, 21];

/* Minuit du jour de `t`, dans le fuseau de l'appareil. Les échéances sont
   posées au début d'une journée : une fiche notée à 22 h avec un jour de délai
   revient le lendemain matin, pas le lendemain soir. */
export function debutDuJour(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const enJours = (n) => n * 86400000;

/* Prochaine échéance après une note. `intervalPrecedent` sert au seul cas
   d'« Acquis » répété, qui fait passer de 7 à 21 jours. */
export function noter(note, intervalPrecedent, maintenant) {
  const box = note === 1 || note === 2 ? note : 0;
  let interval;
  if (box === 0) interval = INTERVALLES[0];
  else if (box === 1) interval = INTERVALLES[1];
  else interval = intervalPrecedent >= INTERVALLES[2] ? INTERVALLES[3] : INTERVALLES[2];
  return { box, interval, due: debutDuJour(maintenant) + enJours(interval) };
}

/* Une fiche mise en pause sort de toutes les files et de tous les comptes :
   les paquets écrits par une IA contiennent toujours deux ou trois fiches
   qu'on ne veut ni réviser ni supprimer tout de suite. */
export const estActive = (fiche) => !fiche.suspendue;

export const estDue = (fiche, maintenant) =>
  estActive(fiche) && (!fiche.due || fiche.due <= maintenant);

/* Remise à zéro d'une fiche : la boîte seule ne suffit pas, il faut aussi
   ramener l'échéance à aujourd'hui, sans quoi « progression remise à zéro »
   laisserait le paquet muet jusqu'à la date déjà posée. */
export const reinitialiser = (fiche, maintenant) => ({
  ...fiche,
  box: 0,
  interval: INTERVALLES[0],
  due: debutDuJour(maintenant),
});

/* Une fiche d'avant les dates a un `box` mais pas de `due` : elle est due
   aujourd'hui, et hérite de l'intervalle correspondant à son niveau. */
export function migrerFiche(fiche, maintenant) {
  if (Number.isFinite(fiche.due) && Number.isFinite(fiche.interval)) return fiche;
  const box = fiche.box === 1 || fiche.box === 2 ? fiche.box : 0;
  return {
    ...fiche,
    box,
    interval: Number.isFinite(fiche.interval) ? fiche.interval : INTERVALLES[box],
    due: Number.isFinite(fiche.due) ? fiche.due : debutDuJour(maintenant),
  };
}

/* Rend { paquets, touche }. `touche` dit si quelque chose a bougé, pour
   n'écrire dans localStorage que lorsqu'il y a vraiment eu migration. */
export function migrerPaquets(paquets, maintenant) {
  let touche = false;
  const sortie = paquets.map((p) => {
    let paquetTouche = false;
    const fiches = p.cards.map((c) => {
      const m = migrerFiche(c, maintenant);
      if (m !== c) paquetTouche = true;
      return m;
    });
    if (!paquetTouche) return p;
    touche = true;
    return { ...p, cards: fiches };
  });
  return { paquets: sortie, touche };
}

/* Ordre d'une session : mélange aléatoire, puis tri stable par box croissant,
   le plus faible d'abord. Ne pas changer sans relire les règles de révision. */
const ordonner = (refs) => shuffle(refs).sort((a, b) => a.box - b.box);

const reference = (paquet, fiche) => ({
  paquetId: paquet.id,
  ficheId: fiche.id,
  box: fiche.box || 0,
});

/* File d'un seul paquet. `filtre` : "all" tout, "todo" les non acquis,
   "jour" les seules fiches échues. */
export function filePaquet(paquet, filtre, maintenant) {
  let fiches = paquet.cards.filter(estActive);
  if (filtre === "todo") fiches = fiches.filter((c) => (c.box || 0) < 2);
  else if (filtre === "jour") fiches = fiches.filter((c) => estDue(c, maintenant));
  return ordonner(fiches.map((c) => reference(paquet, c)));
}

/* File des fiches rattachées à une section du cours : on vient de lire le
   passage, on enchaîne sur ce qu'il contient. */
export function fileSection(paquet, sectionId, maintenant) {
  const fiches = paquet.cards.filter((c) => estActive(c) && c.section === sectionId);
  return ordonner(fiches.map((c) => reference(paquet, c)));
}

export const compterSection = (paquet, sectionId) =>
  paquet.cards.filter((c) => estActive(c) && c.section === sectionId).length;

/* File du jour, tous paquets confondus. */
export function fileDuJour(paquets, maintenant) {
  const refs = [];
  for (const p of paquets) for (const c of p.cards) if (estDue(c, maintenant)) refs.push(reference(p, c));
  return ordonner(refs);
}

export const compterDues = (paquets, maintenant) =>
  paquets.reduce((n, p) => n + p.cards.filter((c) => estDue(c, maintenant)).length, 0);

/* Prochaine échéance de toute la base, pour annoncer « revenez demain ». */
export function prochaineEcheance(paquets, maintenant) {
  let mini = null;
  for (const p of paquets)
    for (const c of p.cards)
      if (estActive(c) && !estDue(c, maintenant) && (mini === null || c.due < mini)) mini = c.due;
  return mini;
}

/* Formulation en français du délai avant la prochaine fiche. */
export function dansCombien(due, maintenant) {
  const jours = Math.round((debutDuJour(due) - debutDuJour(maintenant)) / 86400000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "demain";
  return "dans " + jours + " jours";
}
