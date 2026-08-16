import test from "node:test";
import assert from "node:assert/strict";
import { ASTUCES, PROMPT_PAQUET, PROMPT_FICHES_SEULES } from "../src/astuces.js";
import { parseText } from "../src/parse.js";
import { contientFiches, extraireFiches } from "../src/cours.js";

/* Le prompt est une piece du parseur autant qu'un texte : s'il cesse d'exiger
   les espaces autour du point-virgule, les paquets generes seront coupes au
   mauvais endroit, en silence. Ces tests montent la garde dessus. */

for (const [nom, prompt] of [["paquet", PROMPT_PAQUET], ["fiches seules", PROMPT_FICHES_SEULES]]) {
  test("le prompt " + nom + " exige les espaces autour du point-virgule", () => {
    assert.match(prompt, /ENTOURÉ D'UNE ESPACE/);
  });

  test("le prompt " + nom + " interdit les retours a la ligne dans une fiche", () => {
    assert.match(prompt, /UNE seule ligne/);
  });

  test("le prompt " + nom + " interdit la ligne d'en-tete", () => {
    assert.match(prompt, /en-tête/);
  });

  test("le prompt " + nom + " ecarte les separateurs concurrents", () => {
    assert.match(prompt, /::/);
    assert.match(prompt, /tabulation/);
  });

  test("le prompt " + nom + " donne le format exact d'une fiche", () => {
    assert.match(prompt, /question ; réponse/);
  });
}

test("le prompt de paquet interdit ce que le rendu markdown ne sait pas afficher", () => {
  for (const interdit of ["tableaux", "images", "liens"]) {
    assert.ok(PROMPT_PAQUET.includes(interdit), interdit + " doit etre proscrit");
  }
});

test("le prompt de paquet decrit le decoupage en sections", () => {
  assert.match(PROMPT_PAQUET, /##/);
  assert.match(PROMPT_PAQUET, /COURTS/, "les titres doivent rester courts et distincts");
});

test("le prompt de fiches seules garde le regroupement par commentaire", () => {
  // Ce prompt-la ne produit pas de markdown : les sections y sont annoncees
  // par des lignes « # Section : », ignorees a l'import.
  assert.match(PROMPT_FICHES_SEULES, /# Section :/);
});

/* L'exemple donne dans le prompt doit reellement s'importer : c'est le seul
   moyen de garantir que le prompt et le parseur ne divergent pas. */
test("l'exemple du prompt s'importe tel quel, code Java compris", () => {
  const exemple = [
    "# Section : Le bytecode",
    "Que produit javac ? ; Du bytecode dans un .class, jamais du code machine",
    "Que fait int x = 5; ? ; Elle declare un entier x valant 5",
  ].join("\n");
  const lu = parseText(exemple, "Essai");
  assert.deepEqual(lu.cards.map((c) => [c.q, c.a]), [
    ["Que produit javac ?", "Du bytecode dans un .class, jamais du code machine"],
    ["Que fait int x = 5; ?", "Elle declare un entier x valant 5"],
  ]);
});

/* ------------------------------------------------------------------ */
/*  La liste elle-meme                                                 */
/* ------------------------------------------------------------------ */

test("chaque astuce a un identifiant unique, un titre et un texte", () => {
  const ids = new Set();
  for (const a of ASTUCES) {
    assert.ok(a.id && a.titre && a.texte, "astuce incomplete : " + JSON.stringify(a.id));
    assert.ok(!ids.has(a.id), "identifiant en double : " + a.id);
    ids.add(a.id);
  }
  assert.ok(ASTUCES.length >= 8, "la liste doit rester fournie");
});

test("les astuces qui portent un prompt le portent non vide", () => {
  const avecPrompt = ASTUCES.filter((a) => a.prompt);
  assert.equal(avecPrompt.length, 2);
  for (const a of avecPrompt) assert.ok(a.prompt.trim().length > 200);
});

/* ------------------------------------------------------------------ */
/*  Le fichier unique decrit par le prompt doit vraiment s'importer    */
/* ------------------------------------------------------------------ */

test("le prompt de paquet demande un seul fichier, cours et fiches ensemble", () => {
  assert.match(PROMPT_PAQUET, /UN SEUL fichier markdown/);
  assert.match(PROMPT_PAQUET, /```fiches/);
});

test("l'exemple de fichier unique du prompt s'importe reellement", () => {
  // On rejoue l'exemple exact que le prompt donne a l'assistant.
  const exemple = [
    "## Le bytecode",
    "",
    "Le fichier .class contient du bytecode, jamais du code machine.",
    "",
    "```fiches",
    "Que produit javac ? ; Du bytecode dans un .class, jamais du code machine",
    "Que fait int x = 5; ? ; Elle déclare un entier x valant 5",
    "```",
  ].join("\n");

  assert.equal(contientFiches(exemple), true);
  const { cours, fiches } = extraireFiches(exemple);
  assert.deepEqual(fiches.map((f) => [f.q, f.a, f.section]), [
    ["Que produit javac ?", "Du bytecode dans un .class, jamais du code machine", "le-bytecode"],
    ["Que fait int x = 5; ?", "Elle déclare un entier x valant 5", "le-bytecode"],
  ]);
  assert.equal(cours.includes("javac ? ;"), false, "les fiches quittent le cours affiche");
  assert.ok(cours.includes("jamais du code machine"), "le texte du cours reste");
});
