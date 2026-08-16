import test from "node:test";
import assert from "node:assert/strict";
import { lirePartage, nomDuPartage } from "../src/partage.js";

const LE_18_AOUT = new Date(2026, 7, 18);

test("un partage sans texte n'est pas un partage", () => {
  assert.equal(lirePartage(""), null);
  assert.equal(lirePartage("?titre=Java"), null);
  assert.equal(lirePartage("?texte=" + encodeURIComponent("   ")), null);
});

test("le texte partage est rendu tel quel, sauts de ligne compris", () => {
  const texte = "Que fait javac ; Il compile\nRole de main ; Point d'entree";
  const r = lirePartage("?texte=" + encodeURIComponent(texte));
  assert.equal(r.texte, texte);
});

test("le titre accompagne le texte quand Android en fournit un", () => {
  const r = lirePartage("?titre=" + encodeURIComponent("Java socle") + "&texte=" + encodeURIComponent("a ; b"));
  assert.equal(r.titre, "Java socle");
});

test("les accents et les points-virgules survivent au passage par l'URL", () => {
  const texte = "Qu'est-ce que l'héritage ? ; Réutiliser une classe — sans la copier";
  assert.equal(lirePartage("?texte=" + encodeURIComponent(texte)).texte, texte);
});

test("le nom du paquet reprend le titre partage", () => {
  assert.equal(nomDuPartage("Java socle jour0", LE_18_AOUT), "Java socle jour0");
  assert.equal(nomDuPartage("  Java   socle  ", LE_18_AOUT), "Java socle");
});

test("sans titre, le paquet porte une date lisible", () => {
  assert.equal(nomDuPartage("", LE_18_AOUT), "Partage du 18 août");
  assert.equal(nomDuPartage(null, LE_18_AOUT), "Partage du 18 août");
  assert.equal(nomDuPartage("   ", new Date(2026, 0, 3)), "Partage du 3 janvier");
});

test("un titre a rallonge est ecarte au profit de la date", () => {
  // Certaines applications partagent le premier paragraphe entier comme titre.
  assert.equal(nomDuPartage("x".repeat(61), LE_18_AOUT), "Partage du 18 août");
});
