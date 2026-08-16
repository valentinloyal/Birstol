/* Le cours d'un paquet : un texte markdown, découpé en sections par ses titres.
   Volontairement pur — aucun accès au DOM — pour rester testable avec node --test.

   Pourquoi markdown et pas PDF : lire un PDF dans le navigateur impose pdf.js,
   environ 1 Mo, soit cinq fois le bundle entier, pour n'en tirer qu'un texte au
   découpage incertain. Le markdown est du texte : il se stocke tel quel, et ses
   titres donnent gratuitement le découpage dont les fiches ont besoin.

   Le rendu est volontairement partiel. On couvre ce qu'un cours de programmation
   utilise vraiment : titres, listes, code, gras, italique. Pas de tableaux, pas
   d'images, pas de liens — la règle du projet reste : aucune dépendance. */

/* Identifiant stable d'une section, calculé depuis son titre. Il est stocké
   dans la fiche : il doit survivre à une réimportation du cours, donc il ne
   peut pas être un simple numéro d'ordre. */
export function ancre(titre) {
  // NFD détache les accents de leur lettre. Il faut jeter ces marques avant de
  // remplacer le reste par des tirets, sinon « héritage » donne « he-ritage ».
  const sansMarques = [...(titre || "").normalize("NFD")]
    .filter((c) => { const n = c.charCodeAt(0); return n < 0x300 || n > 0x36f; })
    .join("");
  const nu = sansMarques.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return nu.replace(/^-+|-+$/g, "") || "section";
}

/* Découpe un cours en sections. Tout ce qui précède le premier titre forme une
   section d'introduction. Les titres de niveau 1 et 2 ouvrent une section ;
   les niveaux plus profonds restent dans le corps, comme du texte. */
export function sections(markdown) {
  const texte = (markdown || "").replace(/\r/g, "").trim();
  if (!texte) return [];

  const sortie = [];
  let courante = null;
  const vues = new Map();

  const ouvrir = (titre, niveau) => {
    const base = ancre(titre);
    // Deux sections peuvent porter le même titre : on suffixe pour garder
    // des ancres uniques, sans quoi une fiche pointerait la mauvaise.
    const n = (vues.get(base) || 0) + 1;
    vues.set(base, n);
    courante = { id: n === 1 ? base : base + "-" + n, titre, niveau, corps: [] };
    sortie.push(courante);
  };

  for (const ligne of texte.split("\n")) {
    const t = /^(#{1,2})\s+(.*)$/.exec(ligne);
    if (t) ouvrir(t[2].trim(), t[1].length);
    else if (courante) courante.corps.push(ligne);
    else if (ligne.trim()) { ouvrir("Introduction", 1); courante.corps.push(ligne); }
  }
  return sortie.map((s) => ({ ...s, corps: s.corps.join("\n").trim() }));
}

export const trouverSection = (markdown, id) => sections(markdown).find((s) => s.id === id) || null;

/* Découpe le corps d'une section en blocs affichables. Rend une liste de
   { type, ... } que le composant transforme en éléments React : on ne fabrique
   jamais de HTML à injecter. */
export function blocs(corps) {
  const lignes = (corps || "").split("\n");
  const sortie = [];
  let i = 0;

  while (i < lignes.length) {
    const l = lignes[i];

    if (!l.trim()) { i++; continue; }

    // Bloc de code délimité par ```
    if (/^\s*```/.test(l)) {
      const langue = l.replace(/^\s*```/, "").trim();
      const lignesCode = [];
      i++;
      while (i < lignes.length && !/^\s*```/.test(lignes[i])) lignesCode.push(lignes[i++]);
      i++; // on saute la clôture
      sortie.push({ type: "code", langue, texte: lignesCode.join("\n") });
      continue;
    }

    // Titre de niveau 3 ou plus : sous-titre à l'intérieur d'une section
    const sous = /^(#{3,6})\s+(.*)$/.exec(l);
    if (sous) { sortie.push({ type: "sous-titre", texte: sous[2].trim() }); i++; continue; }

    // Liste à puces ou numérotée
    if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
      const points = [];
      let numerotee = /^\s*\d+[.)]\s+/.test(l);
      while (i < lignes.length && /^\s*([-*+]|\d+[.)])\s+/.test(lignes[i])) {
        points.push(lignes[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ""));
        i++;
      }
      sortie.push({ type: "liste", numerotee, points });
      continue;
    }

    // Citation
    if (/^\s*>\s?/.test(l)) {
      const dedans = [];
      while (i < lignes.length && /^\s*>\s?/.test(lignes[i])) dedans.push(lignes[i++].replace(/^\s*>\s?/, ""));
      sortie.push({ type: "citation", texte: dedans.join(" ").trim() });
      continue;
    }

    // Paragraphe : jusqu'à la ligne vide ou le prochain bloc
    const morceaux = [];
    while (
      i < lignes.length && lignes[i].trim() &&
      !/^\s*```/.test(lignes[i]) && !/^#{1,6}\s/.test(lignes[i]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lignes[i]) && !/^\s*>\s?/.test(lignes[i])
    ) morceaux.push(lignes[i++]);
    sortie.push({ type: "paragraphe", texte: morceaux.join(" ") });
  }
  return sortie;
}

/* Découpe une ligne en fragments de style. `code` l'emporte sur le reste :
   dans `**a**`, écrit à l'intérieur d'un backtick, les étoiles sont du texte. */
export function fragments(ligne) {
  const sortie = [];
  const motif = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/;
  let reste = ligne || "";

  while (reste) {
    const m = motif.exec(reste);
    if (!m) { sortie.push({ style: "normal", texte: reste }); break; }
    if (m.index > 0) sortie.push({ style: "normal", texte: reste.slice(0, m.index) });
    const t = m[0];
    if (t[0] === "`") sortie.push({ style: "code", texte: t.slice(1, -1) });
    else if (t.startsWith("**")) sortie.push({ style: "gras", texte: t.slice(2, -2) });
    else sortie.push({ style: "italique", texte: t.slice(1, -1) });
    reste = reste.slice(m.index + t.length);
  }
  return sortie.filter((f) => f.texte !== "");
}

/* Combien de fiches du paquet renvoient à chaque section. */
export function fichesParSection(paquet) {
  const compte = new Map();
  for (const c of paquet.cards || []) if (c.section) compte.set(c.section, (compte.get(c.section) || 0) + 1);
  return compte;
}
