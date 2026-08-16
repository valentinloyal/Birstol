# Bristol — fiches de révision

Application de révision par fiches. Import d'un dossier de questions-réponses,
création de fiches à la main, révision espacée à 3 boîtes (Leitner).
Tout est stocké sur l'appareil, aucun serveur.

## Publier

**Automatique** — double-cliquez `publier.bat`. Le script crée le dépôt,
pousse le code, active Pages et ouvre l'URL.

**À la main** :

```bat
git init -b main
git add -A
git commit -m "Bristol"
gh repo create bristol --public --source=. --push
```

puis sur github.com : *Settings* → *Pages* → **Source: Deploy from a branch**,
branche `main`, dossier `/ (root)` → *Save*.

L'adresse sera `https://<compte>.github.io/bristol/`, en ligne après 1 à 2 minutes.

## Installer sur le téléphone

Ouvrir l'URL dans **Chrome** sur Android → menu ⋮ → **Installer l'application**.
Sur iPhone : Safari → Partager → **Sur l'écran d'accueil**.

L'app fonctionne ensuite hors connexion (service worker).

## Formats d'import

Un fichier = un paquet, le nom du fichier devient le nom du paquet.

```
question ; réponse
question :: réponse
question<TAB>réponse
Q: question
R: réponse
```

Blocs séparés par une ligne vide (1re ligne = question), ou JSON :

```json
[{ "q": "Encapsulation ?", "a": "Regrouper données et méthodes" }]
```

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | page d'entrée |
| `app.js` | application compilée (React, bundle minifié) |
| `sw.js` | cache hors-ligne |
| `manifest.webmanifest` | installation PWA |
| `src/App.jsx` | code source lisible, pour modifier |
| `src/main.jsx` | point d'entrée React |
| `package.json` | dépendances et script de compilation |
| `.nojekyll` | désactive Jekyll sur Pages |

Après modification du source, recompiler (une seule fois d'abord : `npm install`) :

```bat
npm run build
```

(en pensant à bumper `CACHE` dans `sw.js` pour forcer la mise à jour côté téléphone).
