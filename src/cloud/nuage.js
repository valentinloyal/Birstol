/* Traduction entre la forme locale d'un paquet/fiche (celle que connaissent
   Home, DeckView, Study, Cours…) et les colonnes de la base Postgres.

   Les identifiants restent ceux générés côté client par uid() (outils.js) :
   les colonnes id ne portent pas de valeur par défaut, on les fournit
   toujours nous-mêmes. Ça évite d'avoir à faire un aller-retour réseau avant
   de savoir sous quel identifiant une fiche neuve va vivre. */

import { client } from "./client.js";

const versLigneCarte = (c, deckId) => ({
  id: c.id,
  deck_id: deckId,
  q: c.q,
  a: c.a,
  box: c.box || 0,
  interval_days: c.interval ?? null,
  due: c.due ? new Date(c.due).toISOString() : null,
  section: c.section || null,
  suspended: !!c.suspendue,
});

const versChampsCarte = (c) => {
  const { id, deck_id, ...reste } = versLigneCarte(c, null);
  return reste;
};

/* Traduit une mise à jour partielle (celle que noterFiche/corrigerFiche
   reçoivent) sans toucher aux champs absents. */
export function versChampsCartePartiels(maj) {
  const out = {};
  if ("box" in maj) out.box = maj.box;
  if ("interval" in maj) out.interval_days = maj.interval;
  if ("due" in maj) out.due = maj.due ? new Date(maj.due).toISOString() : null;
  if ("section" in maj) out.section = maj.section || null;
  if ("suspendue" in maj) out.suspended = !!maj.suspendue;
  if ("q" in maj) out.q = maj.q;
  if ("a" in maj) out.a = maj.a;
  return out;
}

const depuisLigneCarte = (row) => ({
  id: row.id,
  q: row.q,
  a: row.a,
  box: row.box || 0,
  ...(row.interval_days != null ? { interval: row.interval_days } : {}),
  ...(row.due ? { due: +new Date(row.due) } : {}),
  ...(row.section ? { section: row.section } : {}),
  ...(row.suspended ? { suspendue: true } : {}),
});

const depuisLigneDeck = (row, cards) => ({
  id: row.id,
  name: row.name,
  cards,
  created: +new Date(row.created_at),
  ...(row.last_studied ? { lastStudied: +new Date(row.last_studied) } : {}),
  ...(row.cours ? { cours: row.cours } : {}),
  ...(row.published ? { published: true } : {}),
});

export async function chargerDecks() {
  const [{ data: deckRows, error: e1 }, { data: cardRows, error: e2 }] = await Promise.all([
    client.from("decks").select("*").order("created_at", { ascending: false }),
    client.from("cards").select("*"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const parDeck = new Map();
  for (const row of cardRows || []) {
    if (!parDeck.has(row.deck_id)) parDeck.set(row.deck_id, []);
    parDeck.get(row.deck_id).push(depuisLigneCarte(row));
  }
  return (deckRows || []).map((row) => depuisLigneDeck(row, parDeck.get(row.id) || []));
}

export async function creerDeck(deck) {
  const { error } = await client.from("decks").insert({
    id: deck.id,
    name: deck.name,
    cours: deck.cours || null,
    created_at: new Date(deck.created).toISOString(),
  });
  if (error) throw error;
  if (deck.cards.length) await ajouterCartes(deck.id, deck.cards);
}

export async function supprimerDeck(id) {
  const { error } = await client.from("decks").delete().eq("id", id);
  if (error) throw error;
}

export async function majDeckChamps(id, champs) {
  const dbChamps = {};
  if ("name" in champs) dbChamps.name = champs.name;
  if ("cours" in champs) dbChamps.cours = champs.cours || null;
  if ("lastStudied" in champs) dbChamps.last_studied = new Date(champs.lastStudied).toISOString();
  if ("published" in champs) dbChamps.published = champs.published;
  if (!Object.keys(dbChamps).length) return;
  const { error } = await client.from("decks").update(dbChamps).eq("id", id);
  if (error) throw error;
}

/* Le paquet manipule toujours son tableau de fiches en bloc (ajout, retrait,
   remise en pause, rattachement au cours…) : on compare avant/après pour
   n'envoyer que ce qui a vraiment changé, plutôt que de tout renvoyer. */
export async function synchroniserCartes(deckId, avant, apres) {
  const avantParId = new Map(avant.map((c) => [c.id, c]));
  const apresIds = new Set(apres.map((c) => c.id));

  const aSupprimer = avant.filter((c) => !apresIds.has(c.id));
  const aAjouter = apres.filter((c) => !avantParId.has(c.id));
  const aModifier = apres.filter((c) => {
    const anc = avantParId.get(c.id);
    return anc && JSON.stringify(anc) !== JSON.stringify(c);
  });

  const taches = [
    ...aSupprimer.map((c) => client.from("cards").delete().eq("id", c.id)),
    ...(aAjouter.length ? [client.from("cards").insert(aAjouter.map((c) => versLigneCarte(c, deckId)))] : []),
    ...aModifier.map((c) => client.from("cards").update(versChampsCarte(c)).eq("id", c.id)),
  ];
  const resultats = await Promise.all(taches);
  const echec = resultats.find((r) => r.error);
  if (echec) throw echec.error;
}

export async function ajouterCartes(deckId, cartes) {
  const { error } = await client.from("cards").insert(cartes.map((c) => versLigneCarte(c, deckId)));
  if (error) throw error;
}

export async function majCarte(id, champs) {
  if (!Object.keys(champs).length) return;
  const { error } = await client.from("cards").update(champs).eq("id", id);
  if (error) throw error;
}
