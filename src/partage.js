/* Réception d'un partage Android.

   Déclaré en GET dans le manifeste : Android rouvre simplement l'app avec le
   texte partagé en paramètre d'URL. Aucun service worker n'intervient, ce qui
   laisse le fonctionnement hors-ligne intact.

   Le partage de fichiers, lui, impose un POST intercepté par le service worker.
   Il n'est pas ici : il ne peut se vérifier que sur un téléphone. */

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/* Rend { titre, texte } ou null. Prend la chaîne de recherche en argument
   plutôt que de lire location : c'est ce qui rend la fonction testable. */
export function lirePartage(recherche) {
  const p = new URLSearchParams(recherche || "");
  const texte = p.get("texte");
  if (!texte || !texte.trim()) return null;
  return { titre: (p.get("titre") || "").trim(), texte };
}

/* Le titre d'un partage Android est souvent vide, ou porte le nom de l'app
   d'origine. À défaut, une date lisible vaut mieux qu'un « Sans titre ». */
export function nomDuPartage(titre, date = new Date()) {
  const propre = (titre || "").replace(/\s+/g, " ").trim();
  if (propre && propre.length <= 60) return propre;
  return "Partage du " + date.getDate() + " " + MOIS[date.getMonth()];
}

export const nettoyerURL = () => history.replaceState(null, "", location.pathname);

/* ------------------------------------------------------------------ */
/*  Partage de fichiers                                                */
/* ------------------------------------------------------------------ */

/* Android envoie les fichiers partagés en POST. Le service worker les dépose
   dans un cache dédié et redirige vers l'app avec ?partage=recu ; c'est ici
   qu'on vient relever la boîte. Le cache est effacé après lecture, pour qu'un
   simple rechargement ne réimporte pas le même partage. */
const PARTAGE = "bristol-partage";
const CLE_PARTAGE = "./partage-recu";

export const partageEnBoite = (recherche) =>
  new URLSearchParams(recherche || "").get("partage") === "recu";

export async function releverPartage() {
  try {
    const boite = await caches.open(PARTAGE);
    const reponse = await boite.match(CLE_PARTAGE);
    if (!reponse) return [];
    const recu = await reponse.json();
    await boite.delete(CLE_PARTAGE);
    return Array.isArray(recu) ? recu.filter((f) => f && typeof f.texte === "string" && f.texte.trim()) : [];
  } catch {
    return [];
  }
}
