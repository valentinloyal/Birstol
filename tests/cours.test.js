import test from "node:test";
import assert from "node:assert/strict";
import { ancre, sections, trouverSection, blocs, fragments, fichesParSection } from "../src/cours.js";

/* ------------------------------------------------------------------ */
/*  Ancres                                                             */
/* ------------------------------------------------------------------ */

test("l'ancre est stable, sans accent ni ponctuation", () => {
  assert.equal(ancre("La JVM et le bytecode"), "la-jvm-et-le-bytecode");
  assert.equal(ancre("Héritage & polymorphisme"), "heritage-polymorphisme");
  assert.equal(ancre("  Espaces  autour  "), "espaces-autour");
});

test("un titre sans lettre ni chiffre reste une ancre valable", () => {
  assert.equal(ancre("???"), "section");
  assert.equal(ancre(""), "section");
});

/* ------------------------------------------------------------------ */
/*  Decoupage en sections                                              */
/* ------------------------------------------------------------------ */

const COURS = `# La JVM

Java compile en deux temps.

## Le bytecode

Le fichier .class contient du bytecode.

## Le JIT

Il compile a la volee.`;

test("un cours se decoupe sur ses titres de niveau 1 et 2", () => {
  assert.deepEqual(sections(COURS).map((s) => s.titre), ["La JVM", "Le bytecode", "Le JIT"]);
});

test("chaque section porte son corps, sans son titre", () => {
  const s = sections(COURS);
  assert.equal(s[1].corps, "Le fichier .class contient du bytecode.");
  assert.equal(s[0].corps, "Java compile en deux temps.");
});

test("le texte place avant le premier titre forme une introduction", () => {
  const s = sections("Quelques mots d'abord.\n\n# Vrai titre\n\nSuite.");
  assert.deepEqual(s.map((x) => x.titre), ["Introduction", "Vrai titre"]);
  assert.equal(s[0].corps, "Quelques mots d'abord.");
});

test("les titres de niveau 3 restent dans le corps, ils ne coupent pas", () => {
  const s = sections("# Un\n\n### Sous-partie\n\ntexte");
  assert.equal(s.length, 1);
  assert.ok(s[0].corps.includes("### Sous-partie"));
});

test("deux sections de meme titre gardent des ancres distinctes", () => {
  // Sans cela, une fiche pointerait la mauvaise section.
  const s = sections("# Exercices\n\na\n\n# Exercices\n\nb");
  assert.deepEqual(s.map((x) => x.id), ["exercices", "exercices-2"]);
});

test("un cours vide ne donne aucune section", () => {
  assert.deepEqual(sections(""), []);
  assert.deepEqual(sections("   \n\n  "), []);
});

test("les retours chariot Windows ne polluent pas le decoupage", () => {
  const s = sections("# Titre" + String.fromCharCode(13) + "\n\ncorps");
  assert.equal(s[0].titre, "Titre");
});

test("trouverSection retrouve par ancre, et rend null sinon", () => {
  assert.equal(trouverSection(COURS, "le-jit").titre, "Le JIT");
  assert.equal(trouverSection(COURS, "inexistante"), null);
});

/* ------------------------------------------------------------------ */
/*  Blocs                                                              */
/* ------------------------------------------------------------------ */

test("un paragraphe sur plusieurs lignes est recolle", () => {
  assert.deepEqual(blocs("une phrase\nqui continue"), [{ type: "paragraphe", texte: "une phrase qui continue" }]);
});

test("une ligne vide separe deux paragraphes", () => {
  assert.deepEqual(blocs("un\n\ndeux").map((b) => b.texte), ["un", "deux"]);
});

test("un bloc de code garde ses sauts de ligne et son langage", () => {
  const b = blocs("```java\nint x = 5;\nSystem.out.println(x);\n```");
  assert.deepEqual(b, [{ type: "code", langue: "java", texte: "int x = 5;\nSystem.out.println(x);" }]);
});

test("le contenu d'un bloc de code n'est pas interprete comme du markdown", () => {
  const b = blocs("```\n# pas un titre\n- pas une liste\n```");
  assert.equal(b.length, 1);
  assert.equal(b[0].type, "code");
});

test("les listes a puces et numerotees sont reconnues", () => {
  assert.deepEqual(blocs("- un\n- deux"), [{ type: "liste", numerotee: false, points: ["un", "deux"] }]);
  assert.deepEqual(blocs("1. un\n2. deux"), [{ type: "liste", numerotee: true, points: ["un", "deux"] }]);
});

test("un sous-titre de niveau 3 devient un bloc a part", () => {
  assert.deepEqual(blocs("### Detail"), [{ type: "sous-titre", texte: "Detail" }]);
});

test("une citation est regroupee sur une ligne", () => {
  assert.deepEqual(blocs("> une\n> citation"), [{ type: "citation", texte: "une citation" }]);
});

test("un enchainement realiste garde l'ordre des blocs", () => {
  const b = blocs("Intro.\n\n- a\n- b\n\n```java\nx\n```\n\nFin.");
  assert.deepEqual(b.map((x) => x.type), ["paragraphe", "liste", "code", "paragraphe"]);
});

/* ------------------------------------------------------------------ */
/*  Fragments de style                                                 */
/* ------------------------------------------------------------------ */

test("le gras, l'italique et le code sont reperes", () => {
  assert.deepEqual(fragments("du **gras** ici"),
    [{ style: "normal", texte: "du " }, { style: "gras", texte: "gras" }, { style: "normal", texte: " ici" }]);
  assert.deepEqual(fragments("*penche*"), [{ style: "italique", texte: "penche" }]);
  assert.deepEqual(fragments("_aussi_"), [{ style: "italique", texte: "aussi" }]);
  assert.deepEqual(fragments("`javac`"), [{ style: "code", texte: "javac" }]);
});

test("le code l'emporte : les etoiles a l'interieur restent du texte", () => {
  assert.deepEqual(fragments("`a ** b`"), [{ style: "code", texte: "a ** b" }]);
});

test("une ligne sans balisage donne un seul fragment", () => {
  assert.deepEqual(fragments("rien de special"), [{ style: "normal", texte: "rien de special" }]);
});

test("une ligne vide ne donne aucun fragment", () => {
  assert.deepEqual(fragments(""), []);
});

/* ------------------------------------------------------------------ */
/*  Lien entre fiches et sections                                      */
/* ------------------------------------------------------------------ */

test("on compte les fiches rattachees a chaque section", () => {
  const paquet = { cards: [
    { id: "a", section: "le-jit" }, { id: "b", section: "le-jit" },
    { id: "c", section: "le-bytecode" }, { id: "d" },
  ]};
  const compte = fichesParSection(paquet);
  assert.equal(compte.get("le-jit"), 2);
  assert.equal(compte.get("le-bytecode"), 1);
  assert.equal(compte.size, 2, "une fiche sans section ne compte nulle part");
});
