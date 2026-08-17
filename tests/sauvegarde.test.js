import test from "node:test";
import assert from "node:assert/strict";
import { construireSauvegarde, lireSauvegarde, nomSauvegarde, compterFiches, VERSION } from "../src/sauvegarde.js";

const paquet = (nom, fiches) => ({
  id: "p" + nom.length,
  name: nom,
  created: 1755300000000,
  lastStudied: 1755330000000,
  cards: fiches.map((f, i) => ({
    id: "c" + i, q: f[0], a: f[1], box: f[2] ?? 0,
    interval: [1, 3, 7][f[2] ?? 0],
    due: 1755400000000 + i,
  })),
});

const BASE = [
  paquet("Java socle", [["Que fait javac ?", "Il compile", 0], ["Encapsulation ?", "Regrouper", 2]]),
  paquet("Reseaux", [["TCP ?", "Transport fiable", 1]]),
];

/* ------------------------------------------------------------------ */
/*  Fabrication                                                        */
/* ------------------------------------------------------------------ */

test("la sauvegarde porte sa version, sa date et les paquets", () => {
  const s = construireSauvegarde(BASE);
  assert.equal(s.memento, VERSION);
  assert.equal(s.paquets.length, 2);
  assert.ok(!Number.isNaN(Date.parse(s.exporte)), "la date doit etre lisible");
});

test("la progression est conservee, contrairement a l'export d'un paquet", () => {
  const s = construireSauvegarde(BASE);
  assert.deepEqual(s.paquets[0].cards.map((c) => c.box), [0, 2]);
  assert.equal(s.paquets[0].lastStudied, 1755330000000);
});

test("nomSauvegarde date le fichier", () => {
  assert.equal(nomSauvegarde(new Date(2026, 7, 16)), "memento-sauvegarde-2026-08-16.json");
  assert.equal(nomSauvegarde(new Date(2026, 0, 3)), "memento-sauvegarde-2026-01-03.json");
});

test("compterFiches additionne tous les paquets", () => {
  assert.equal(compterFiches(BASE), 3);
  assert.equal(compterFiches([]), 0);
});

/* ------------------------------------------------------------------ */
/*  Aller-retour                                                       */
/* ------------------------------------------------------------------ */

test("exporter puis restaurer rend exactement la meme base", () => {
  const relu = lireSauvegarde(JSON.stringify(construireSauvegarde(BASE)));
  assert.deepEqual(relu, BASE);
});

test("le tableau nu de localStorage est accepte tel quel", () => {
  assert.deepEqual(lireSauvegarde(JSON.stringify(BASE)), BASE);
});

test("la programmation des revisions survit a l'aller-retour", () => {
  // La perdre remettrait toute la base a reviser aujourd'hui, en silence.
  const relu = lireSauvegarde(JSON.stringify(construireSauvegarde(BASE)));
  assert.deepEqual(relu[0].cards.map((c) => [c.interval, c.due]),
                   BASE[0].cards.map((c) => [c.interval, c.due]));
});

test("le cours et les liens de section survivent a l'aller-retour", () => {
  // Les perdre viderait la moitie du travail : le cours et ce qui l'attache aux fiches.
  const avec = [{
    id: "p", name: "Java", created: 1, cours: "# La JVM\n\nDeux temps.",
    cards: [{ id: "a", q: "q", a: "r", box: 0, interval: 1, due: 2, section: "la-jvm" }],
  }];
  const relu = lireSauvegarde(JSON.stringify(construireSauvegarde(avec)));
  assert.equal(relu[0].cours, "# La JVM\n\nDeux temps.");
  assert.equal(relu[0].cards[0].section, "la-jvm");
});

test("un paquet sans cours ne se voit pas ajouter un champ vide", () => {
  const relu = lireSauvegarde(JSON.stringify([{ name: "P", cards: [{ q: "a", a: "b" }] }]));
  assert.equal("cours" in relu[0], false);
  assert.equal("section" in relu[0].cards[0], false);
});

test("une sauvegarde d'avant les dates ne s'invente pas d'echeance", () => {
  // Sans due ni interval, c'est la migration au chargement qui completera.
  const paquets = lireSauvegarde(JSON.stringify([{ name: "Ancien", cards: [{ q: "a", a: "b", box: 2 }] }]));
  assert.equal("due" in paquets[0].cards[0], false);
  assert.equal("interval" in paquets[0].cards[0], false);
});

/* ------------------------------------------------------------------ */
/*  Relecture defensive                                                */
/* ------------------------------------------------------------------ */

test("un paquet sans identifiant ni date en recoit", () => {
  const paquets = lireSauvegarde(JSON.stringify([{ name: "Nu", cards: [{ q: "a", a: "b" }] }]));
  assert.equal(paquets[0].name, "Nu");
  assert.ok(paquets[0].id, "un identifiant doit etre attribue");
  assert.ok(Number.isFinite(paquets[0].created));
  assert.ok(paquets[0].cards[0].id);
  assert.equal(paquets[0].cards[0].box, 0);
});

test("un paquet jamais revise ne se voit pas inventer de date de revision", () => {
  const paquets = lireSauvegarde(JSON.stringify([{ name: "Neuf", cards: [{ q: "a", a: "b" }] }]));
  assert.equal("lastStudied" in paquets[0], false);
});

test("une boite hors de 0, 1, 2 retombe a 0", () => {
  const paquets = lireSauvegarde(JSON.stringify([{ name: "P", cards: [{ q: "a", a: "b", box: 7 }, { q: "c", a: "d", box: 2 }] }]));
  assert.deepEqual(paquets[0].cards.map((c) => c.box), [0, 2]);
});

test("les fiches vides ou mal formees sont ecartees", () => {
  const paquets = lireSauvegarde(JSON.stringify([{
    name: "P",
    cards: [{ q: "gardee", a: "oui" }, { q: "  ", a: "vide" }, { q: "sans reponse", a: "" }, null, { q: 12, a: 13 }],
  }]));
  assert.deepEqual(paquets[0].cards.map((c) => [c.q, c.a]), [["gardee", "oui"]]);
});

test("les espaces autour des noms et des fiches sont retires", () => {
  const paquets = lireSauvegarde(JSON.stringify([{ name: "  Java  ", cards: [{ q: "  q  ", a: "  a  " }] }]));
  assert.equal(paquets[0].name, "Java");
  assert.deepEqual([paquets[0].cards[0].q, paquets[0].cards[0].a], ["q", "a"]);
});

/* ------------------------------------------------------------------ */
/*  Refus, avec un message lisible a l'ecran                           */
/* ------------------------------------------------------------------ */

const refuse = (texte, extrait) =>
  assert.throws(() => lireSauvegarde(texte), (e) => {
    assert.match(e.message, extrait);
    return true;
  });

test("un fichier qui n'est pas du JSON est refuse", () => {
  refuse("ceci n'est pas du json", /pas du JSON/);
});

test("un JSON qui n'est pas une sauvegarde est refuse", () => {
  refuse('{"autre":"chose"}', /pas une sauvegarde/);
});

test("l'export d'un seul paquet est refuse, et oriente vers Importer", () => {
  // C'est ce que produit « Exporter en JSON » depuis le menu d'un paquet.
  refuse('[{"q":"Que fait javac ?","a":"Il compile"}]', /Importer/);
});

test("une sauvegarde vide est refusee", () => {
  refuse('{"memento":1,"paquets":[]}', /aucun paquet/);
});

test("une sauvegarde dont aucun paquet n'est lisible est refusee", () => {
  refuse('{"memento":1,"paquets":[{"name":"P"},{"name":"Q"}]}', /aucun paquet lisible/);
});
