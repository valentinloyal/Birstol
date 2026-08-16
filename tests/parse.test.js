import test from "node:test";
import assert from "node:assert/strict";
import { parseText, cleanName, SEPS } from "../src/parse.js";

/* parseText rend { name, cards } ou null. Les identifiants sont aleatoires :
   on ne compare donc jamais que les paires question/reponse. */
const paires = (r) => {
  assert.ok(r, "parseText a rendu null alors qu'on attendait des fiches");
  return r.cards.map((c) => [c.q, c.a]);
};

/* ------------------------------------------------------------------ */
/*  Format 1 : JSON                                                    */
/* ------------------------------------------------------------------ */

test("JSON : tableau d'objets q/a", () => {
  const r = parseText('[{"q":"Capitale du Japon","a":"Tokyo"},{"q":"2+2","a":"4"}]', "Secours");
  assert.deepEqual(paires(r), [["Capitale du Japon", "Tokyo"], ["2+2", "4"]]);
});

test("JSON : les clefs francaises sont acceptees", () => {
  const r = parseText('[{"question":"Role de javac","reponse":"Compiler"},{"recto":"JVM","verso":"Machine virtuelle"}]', "Secours");
  assert.deepEqual(paires(r), [["Role de javac", "Compiler"], ["JVM", "Machine virtuelle"]]);
});

test("JSON : objet enveloppe, le nom du paquet vient du fichier", () => {
  const r = parseText('{"nom":"Java socle","cards":[{"q":"Bytecode ?","a":"Le .class"}]}', "Secours");
  assert.equal(r.name, "Java socle");
  assert.deepEqual(paires(r), [["Bytecode ?", "Le .class"]]);
});

test("JSON : les fiches sans question ou sans reponse sont ecartees", () => {
  const r = parseText('[{"q":"Gardee","a":"oui"},{"q":"","a":"orpheline"},{"q":"sans reponse","a":""}]', "Secours");
  assert.deepEqual(paires(r), [["Gardee", "oui"]]);
});

test("JSON invalide : on retombe sur l'analyse texte, sans planter", () => {
  const r = parseText('[{"q":"casse"', "Secours");
  assert.equal(r, null);
});

/* ------------------------------------------------------------------ */
/*  Format 2 : blocs Q: / R:                                           */
/* ------------------------------------------------------------------ */

test("Q/R : reconnu quand les deux prefixes coexistent", () => {
  const r = parseText("Q: Role de main ?\nR: Point d'entree du programme", "Secours");
  assert.deepEqual(paires(r), [["Role de main ?", "Point d'entree du programme"]]);
});

test("Q/R : la reponse peut tenir sur plusieurs lignes", () => {
  const r = parseText("Q: Encapsulation ?\nR: Regrouper les donnees\net les methodes\n\nQ: Heritage ?\nR: Reutiliser une classe", "Secours");
  assert.deepEqual(paires(r), [
    ["Encapsulation ?", "Regrouper les donnees\net les methodes"],
    ["Heritage ?", "Reutiliser une classe"],
  ]);
});

test("Q/R : les variantes de ponctuation et d'etiquette sont acceptees", () => {
  const r = parseText("question. Un paquet ?\nreponse. Un espace de noms", "Secours");
  assert.deepEqual(paires(r), [["Un paquet ?", "Un espace de noms"]]);
});

/* ------------------------------------------------------------------ */
/*  Format 3 : une fiche par ligne, separateur elu                     */
/* ------------------------------------------------------------------ */

test("ligne a ligne : le point-virgule, format produit par les LLM", () => {
  const r = parseText("Que fait la JVM ; Elle execute le bytecode\nRole de main ; Point d'entree", "Secours");
  assert.deepEqual(paires(r), [
    ["Que fait la JVM", "Elle execute le bytecode"],
    ["Role de main", "Point d'entree"],
  ]);
});

test("ligne a ligne : les autres separateurs de la liste", () => {
  const cas = [
    ["Capitale du Japon::Tokyo", "::"],
    ["Capitale du Japon\tTokyo", "tabulation"],
    ["Capitale du Japon | Tokyo", " | "],
    ["Capitale du Japon,Tokyo", "virgule"],
    ["Capitale du Japon — Tokyo", "tiret cadratin"],
    ["Capitale du Japon - Tokyo", "tiret"],
  ];
  for (const [texte, quoi] of cas) {
    assert.deepEqual(paires(parseText(texte, "Secours")), [["Capitale du Japon", "Tokyo"]], "separateur : " + quoi);
  }
});

test("election : le separateur majoritaire l'emporte sur un intrus", () => {
  const r = parseText("Un ; deux\nTrois ; quatre, cinq\nCinq ; six", "Secours");
  assert.deepEqual(paires(r), [["Un", "deux"], ["Trois", "quatre, cinq"], ["Cinq", "six"]]);
});

test("election : sous 60 % des lignes, le separateur est rejete", () => {
  // 2 lignes sur 5 seulement portent un point-virgule : on bascule sur les blocs
  const texte = "Un ; deux\nTrois ; quatre\nligne sans separateur\nautre ligne sans\nencore une";
  const r = parseText(texte, "Secours");
  assert.deepEqual(paires(r), [["Un ; deux", "Trois ; quatre\nligne sans separateur\nautre ligne sans\nencore une"]]);
});

test("la coupure se fait a la premiere occurrence du separateur", () => {
  const r = parseText("Definir :: c'est :: preciser", "Secours");
  assert.deepEqual(paires(r), [["Definir", "c'est :: preciser"]]);
});

test("une ligne dont la reponse est vide est ecartee", () => {
  const r = parseText("Question sans reponse ;\nVraie question ; vraie reponse\nAutre ; autre", "Secours");
  assert.deepEqual(paires(r), [["Vraie question", "vraie reponse"], ["Autre", "autre"]]);
});

/* ------------------------------------------------------------------ */
/*  Format 4 : blocs separes par une ligne vide                        */
/* ------------------------------------------------------------------ */

test("blocs : premiere ligne = question, le reste = reponse", () => {
  const r = parseText("Une interface ?\nUn contrat sans implementation\n\nUne classe abstraite ?\nNon instanciable", "Secours");
  assert.deepEqual(paires(r), [
    ["Une interface ?", "Un contrat sans implementation"],
    ["Une classe abstraite ?", "Non instanciable"],
  ]);
});

/* ------------------------------------------------------------------ */
/*  Regles transverses                                                 */
/* ------------------------------------------------------------------ */

test("les lignes commencant par # servent de commentaires", () => {
  const r = parseText("# fiches Java, generees le 12 aout\nQue fait javac ?;Il compile\n# fin\nRole de main ?;Point d'entree", "Secours");
  assert.deepEqual(paires(r), [["Que fait javac ?", "Il compile"], ["Role de main ?", "Point d'entree"]]);
});

test("le nom de secours est utilise quand le texte n'en porte pas", () => {
  assert.equal(parseText("Un ; deux", "Java socle jour0").name, "Java socle jour0");
});

test("toute fiche neuve part dans la boite 0 avec un identifiant unique", () => {
  const r = parseText("Un ; deux\nTrois ; quatre", "Secours");
  assert.deepEqual(r.cards.map((c) => c.box), [0, 0]);
  assert.equal(new Set(r.cards.map((c) => c.id)).size, 2);
});

test("les espaces autour de la question et de la reponse sont retires", () => {
  const r = parseText("   Question   ;   Reponse   ", "Secours");
  assert.deepEqual(paires(r), [["Question", "Reponse"]]);
});

test("les retours chariot Windows ne polluent pas les fiches", () => {
  const r = parseText("Un ; deux" + String.fromCharCode(13) + "\nTrois ; quatre", "Secours");
  assert.deepEqual(paires(r), [["Un", "deux"], ["Trois", "quatre"]]);
});

/* ------------------------------------------------------------------ */
/*  Entrees degenerees                                                 */
/* ------------------------------------------------------------------ */

test("fichier vide : rien, et surtout pas une erreur", () => {
  assert.equal(parseText("", "Secours"), null);
});

test("fichier fait d'espaces et de sauts de ligne : rien", () => {
  assert.equal(parseText("   \n\n  \t \n", "Secours"), null);
});

test("une seule ligne sans separateur : rien", () => {
  assert.equal(parseText("juste une phrase sans rien", "Secours"), null);
});

/* ------------------------------------------------------------------ */
/*  Cas qui ont ete des defauts, verrouilles ici                       */
/* ------------------------------------------------------------------ */

test("un CSV avec en-tete ne doit pas produire de fiche parasite", () => {
  const r = parseText("question;reponse\nQue fait javac ?;Il compile\nUn paquet ?;Un espace de noms", "Secours");
  assert.deepEqual(paires(r), [["Que fait javac ?", "Il compile"], ["Un paquet ?", "Un espace de noms"]]);
});

test("une question contenant du code Java ne doit pas etre coupee sur ses ;", () => {
  const r = parseText('Que fait int x = 5; ? ; Declare un entier\nQue fait System.out.println("a"); ? ; Affiche a', "Secours");
  assert.deepEqual(paires(r), [
    ["Que fait int x = 5; ?", "Declare un entier"],
    ['Que fait System.out.println("a"); ?', "Affiche a"],
  ]);
});

test("code Java et en-tete de CSV dans le meme fichier", () => {
  // Cas surpris au navigateur : la ligne d'en-tete, ecrite sans espaces, faisait
  // gagner le point-virgule nu au comptage, qui recoupait tout le fichier a tort.
  const r = parseText(
    "question;reponse\nQue fait int x = 5; ? ; Declare un entier x\nRole de javac ; Compiler en bytecode",
    "Secours"
  );
  assert.deepEqual(paires(r), [
    ["Que fait int x = 5; ?", "Declare un entier x"],
    ["Role de javac", "Compiler en bytecode"],
  ]);
});

test("un fichier binaire ne doit produire aucune fiche", () => {
  const png = String.fromCharCode(0x89) + "PNG" + String.fromCharCode(13, 10, 26, 10) + "IHDR" + String.fromCharCode(0, 0, 1, 44);
  assert.equal(parseText(png, "Secours"), null);
});

/* ------------------------------------------------------------------ */
/*  cleanName : nom du fichier -> nom du paquet                        */
/* ------------------------------------------------------------------ */

test("cleanName retire l'extension et remplace tirets et soulignes", () => {
  assert.equal(cleanName("Java-socle-jour0.csv"), "Java socle jour0");
  assert.equal(cleanName("java_socle_jour0.txt"), "java socle jour0");
  // seule la derniere extension saute, les points internes sont conserves
  assert.equal(cleanName("notes.de.cours.md"), "notes.de.cours");
});

test("cleanName rend un nom de secours plutot qu'une chaine vide", () => {
  assert.equal(cleanName(".gitignore"), "Sans titre");
  assert.equal(cleanName("___.txt"), "Sans titre");
});

test("l'ordre des separateurs est significatif : les formes espacees d'abord", () => {
  // " | " doit etre essaye avant "|", sinon une reponse contenant | serait coupee au mauvais endroit
  assert.ok(SEPS.indexOf(" | ") < SEPS.indexOf("|"));
});
