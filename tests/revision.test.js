import test from "node:test";
import assert from "node:assert/strict";
import {
  INTERVALLES, debutDuJour, enJours, noter, estDue, migrerFiche, migrerPaquets,
  filePaquet, fileDuJour, compterDues, prochaineEcheance, dansCombien,
} from "../src/revision.js";

/* Un mardi 12 h, pour que les calculs de journée ne dependent pas de l'heure du test. */
const MIDI = new Date(2026, 7, 18, 12, 0, 0).getTime();
const MINUIT = new Date(2026, 7, 18, 0, 0, 0).getTime();

const fiche = (id, box, due, interval) => ({ id, q: "q" + id, a: "a" + id, box, due, interval });

/* ------------------------------------------------------------------ */
/*  Journees                                                           */
/* ------------------------------------------------------------------ */

test("debutDuJour ramene a minuit, quelle que soit l'heure", () => {
  assert.equal(debutDuJour(MIDI), MINUIT);
  assert.equal(debutDuJour(new Date(2026, 7, 18, 23, 59, 59).getTime()), MINUIT);
  assert.equal(debutDuJour(MINUIT), MINUIT);
});

/* ------------------------------------------------------------------ */
/*  L'echelle 1 / 3 / 7 / 21                                           */
/* ------------------------------------------------------------------ */

test("A revoir renvoie la fiche au lendemain", () => {
  const r = noter(0, 21, MIDI);
  assert.deepEqual([r.box, r.interval], [0, 1]);
  assert.equal(r.due, MINUIT + enJours(1));
});

test("Presque pose trois jours", () => {
  const r = noter(1, 1, MIDI);
  assert.deepEqual([r.box, r.interval], [1, 3]);
  assert.equal(r.due, MINUIT + enJours(3));
});

test("Acquis pose sept jours la premiere fois", () => {
  const r = noter(2, 3, MIDI);
  assert.deepEqual([r.box, r.interval], [2, 7]);
});

test("Acquis repete monte de sept a vingt-et-un jours", () => {
  const premier = noter(2, 3, MIDI);
  const second = noter(2, premier.interval, MIDI);
  assert.equal(second.interval, 21);
  const troisieme = noter(2, second.interval, MIDI);
  assert.equal(troisieme.interval, 21, "le palier haut ne monte pas indefiniment");
});

test("une rechute ramene au lendemain, meme depuis vingt-et-un jours", () => {
  assert.equal(noter(0, 21, MIDI).interval, 1);
});

test("l'echeance tombe toujours a minuit, jamais a l'heure de la revision", () => {
  const tard = new Date(2026, 7, 18, 22, 30).getTime();
  assert.equal(noter(0, 1, tard).due, MINUIT + enJours(1));
});

test("une note hors de 0, 1, 2 retombe sur A revoir", () => {
  assert.deepEqual([noter(9, 1, MIDI).box, noter(9, 1, MIDI).interval], [0, 1]);
});

/* ------------------------------------------------------------------ */
/*  Echeance                                                           */
/* ------------------------------------------------------------------ */

test("une fiche est due quand son echeance est passee", () => {
  assert.equal(estDue(fiche("a", 0, MIDI - 1000, 1), MIDI), true);
  assert.equal(estDue(fiche("a", 0, MIDI, 1), MIDI), true);
  assert.equal(estDue(fiche("a", 0, MIDI + 1000, 1), MIDI), false);
});

test("une fiche sans echeance est due, c'est le cas des paquets d'avant", () => {
  assert.equal(estDue({ id: "a", box: 2 }, MIDI), true);
});

/* ------------------------------------------------------------------ */
/*  Migration des paquets existants                                    */
/* ------------------------------------------------------------------ */

test("une fiche sans date devient due aujourd'hui, avec l'intervalle de sa boite", () => {
  assert.deepEqual(migrerFiche({ id: "a", q: "q", a: "a", box: 0 }, MIDI),
    { id: "a", q: "q", a: "a", box: 0, interval: 1, due: MINUIT });
  assert.equal(migrerFiche({ id: "b", q: "q", a: "a", box: 1 }, MIDI).interval, 3);
  assert.equal(migrerFiche({ id: "c", q: "q", a: "a", box: 2 }, MIDI).interval, 7);
});

test("une fiche sans boite du tout part de zero", () => {
  const m = migrerFiche({ id: "a", q: "q", a: "a" }, MIDI);
  assert.deepEqual([m.box, m.interval], [0, 1]);
});

test("une fiche deja datee n'est pas retouchee", () => {
  const deja = fiche("a", 2, MIDI + enJours(5), 7);
  assert.equal(migrerFiche(deja, MIDI), deja, "le meme objet doit etre rendu");
});

test("migrerPaquets signale s'il a fallu migrer", () => {
  const avant = [{ id: "p1", name: "P", cards: [{ id: "a", q: "q", a: "a", box: 0 }] }];
  const r = migrerPaquets(avant, MIDI);
  assert.equal(r.touche, true);
  assert.equal(r.paquets[0].cards[0].due, MINUIT);
});

test("une base deja migree n'est pas reecrite", () => {
  const base = [{ id: "p1", name: "P", cards: [fiche("a", 1, MIDI, 3)] }];
  const r = migrerPaquets(base, MIDI);
  assert.equal(r.touche, false);
  assert.equal(r.paquets[0], base[0], "le paquet doit etre rendu tel quel");
});

test("un paquet vide ne provoque pas de migration", () => {
  assert.equal(migrerPaquets([{ id: "p", name: "vide", cards: [] }], MIDI).touche, false);
});

/* ------------------------------------------------------------------ */
/*  Files                                                              */
/* ------------------------------------------------------------------ */

const P1 = {
  id: "p1", name: "Java",
  cards: [
    fiche("a", 0, MIDI - enJours(1), 1),   // due
    fiche("b", 2, MIDI + enJours(6), 7),   // pas due
    fiche("c", 1, MIDI, 3),                // due, pile a l'instant
  ],
};
const P2 = {
  id: "p2", name: "Reseaux",
  cards: [
    fiche("d", 2, MIDI + enJours(20), 21), // pas due
    fiche("e", 0, MIDI - enJours(3), 1),   // due
  ],
};

test("la file du jour ne retient que les fiches echues, tous paquets confondus", () => {
  const file = fileDuJour([P1, P2], MIDI);
  assert.deepEqual(file.map((r) => r.ficheId).sort(), ["a", "c", "e"]);
});

test("la file du jour porte le paquet d'origine de chaque fiche", () => {
  const file = fileDuJour([P1, P2], MIDI);
  assert.equal(file.find((r) => r.ficheId === "e").paquetId, "p2");
  assert.equal(file.find((r) => r.ficheId === "a").paquetId, "p1");
});

test("les fiches les plus faibles passent en premier", () => {
  const file = fileDuJour([P1, P2], MIDI);
  assert.deepEqual(file.map((r) => r.box), [0, 0, 1]);
});

test("filePaquet en mode all prend tout, meme ce qui n'est pas echu", () => {
  assert.equal(filePaquet(P1, "all", MIDI).length, 3);
});

test("filePaquet en mode todo laisse les acquis de cote", () => {
  assert.deepEqual(filePaquet(P1, "todo", MIDI).map((r) => r.ficheId).sort(), ["a", "c"]);
});

test("filePaquet en mode jour ne prend que les echues du paquet", () => {
  assert.deepEqual(filePaquet(P1, "jour", MIDI).map((r) => r.ficheId).sort(), ["a", "c"]);
});

test("compterDues additionne sur toute la base", () => {
  assert.equal(compterDues([P1, P2], MIDI), 3);
  assert.equal(compterDues([], MIDI), 0);
});

/* ------------------------------------------------------------------ */
/*  Prochaine echeance                                                 */
/* ------------------------------------------------------------------ */

test("prochaineEcheance rend la plus proche des fiches non echues", () => {
  assert.equal(prochaineEcheance([P1, P2], MIDI), MIDI + enJours(6));
});

test("prochaineEcheance rend null quand tout est deja du", () => {
  const tout = { id: "p", name: "P", cards: [fiche("a", 0, MIDI - 1, 1)] };
  assert.equal(prochaineEcheance([tout], MIDI), null);
});

test("dansCombien parle en francais et compte en journees", () => {
  assert.equal(dansCombien(MIDI, MIDI), "aujourd'hui");
  assert.equal(dansCombien(MINUIT + enJours(1), MIDI), "demain");
  assert.equal(dansCombien(MINUIT + enJours(4), MIDI), "dans 4 jours");
  // 23 h ce soir reste aujourd'hui, 1 h demain matin est bien demain
  assert.equal(dansCombien(new Date(2026, 7, 18, 23, 0).getTime(), MIDI), "aujourd'hui");
  assert.equal(dansCombien(new Date(2026, 7, 19, 1, 0).getTime(), MIDI), "demain");
});
