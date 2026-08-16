const CACHE = "bristol-v27";
const FILES = ["./", "./index.html", "./app.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

/* Boite aux lettres du partage Android. Android envoie les fichiers partages
   en POST ; le service worker les depose ici, et la page vient les chercher au
   demarrage. Ce cache ne doit PAS etre efface a l'activation : le POST arrive
   avant que la page ne soit ouverte. */
const PARTAGE = "bristol-partage";
const CLE_PARTAGE = "./partage-recu";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE && n !== PARTAGE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.pathname.endsWith("/partage")) {
    e.respondWith(recevoirPartage(e.request));
    return;
  }
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});

/* Vide le formulaire de partage dans la boite aux lettres, puis renvoie vers
   l'app. Tout est enveloppe : quoi qu'il arrive on redirige, sinon l'utilisateur
   resterait sur une page d'erreur du serveur. L'app dira qu'elle n'a rien trouve. */
async function recevoirPartage(requete) {
  const recu = [];
  try {
    const form = await requete.formData();

    for (const f of form.getAll("fichiers")) {
      if (!f || typeof f === "string") continue;
      if (f.size > 2000000) continue; // meme garde-fou qu'a l'import de fichiers
      recu.push({ nom: f.name || "Partage", texte: await f.text() });
    }

    // Certaines applications partagent le contenu comme texte et non comme fichier.
    if (!recu.length) {
      const texte = form.get("texte");
      if (typeof texte === "string" && texte.trim()) {
        recu.push({ nom: String(form.get("titre") || "").trim(), texte });
      }
    }

    const boite = await caches.open(PARTAGE);
    await boite.put(
      CLE_PARTAGE,
      new Response(JSON.stringify(recu), { headers: { "Content-Type": "application/json" } })
    );
  } catch (err) {
    // on redirige quand meme
  }
  return Response.redirect(new URL("./index.html?partage=recu", self.location).href, 303);
}
