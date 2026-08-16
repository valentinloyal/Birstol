# Bristol — contexte projet

Application web de fiches de révision, installable en PWA, utilisée quotidiennement
sur un Samsung Android par son unique utilisateur (Valentin, étudiant Epitech Nancy).
Sert principalement à réviser un programme Java intensif, les paquets étant générés
par un LLM au format `question ; réponse` puis importés.

**En ligne :** https://valentinloyal.github.io/Birstol/
**Dépôt :** https://github.com/valentinloyal/Birstol (branche `main`, GitHub Pages à la racine)

---

## 1. Principes de conception

- **Zéro serveur, zéro compte, zéro dépendance à l'exécution.** Tout vit dans le navigateur.
- **Hors-ligne d'abord.** Un service worker en cache-first sert l'app dans le métro.
- **Mobile d'abord.** Cible unique : un pouce, écran ~400 px de large, en portrait.
- **Un seul geste par écran.** L'app doit s'utiliser sans réfléchir à l'interface.
- **Identité visuelle assumée** : fiche bristol réglée sur fond violet profond, titres
  en italique noir orange. Pas de gris neutre, pas de Material par défaut.

---

## 2. Résumé technique

### Pile

| Élément | Choix | Pourquoi |
|---|---|---|
| UI | React 18 | déjà maîtrisé, pas de router ni de state manager |
| Build | esbuild, un seul bundle IIFE minifié | pas de config, build en 100 ms |
| Styles | une constante `CSS` injectée dans un `<style>` | pas de Tailwind, pas de post-traitement |
| Stockage | `localStorage` | suffisant pour quelques milliers de fiches |
| Distribution | GitHub Pages + service worker | gratuit, installable, hors-ligne |

Aucune dépendance runtime : React est bundlé dans `app.js`.

### Fichiers du dépôt

```
index.html              page d'entrée ; capture beforeinstallprompt dans window.__bip
app.js                  bundle compilé (~176 Ko) — NE JAMAIS ÉDITER À LA MAIN
src/App.jsx             composant racine : état, vues, feuilles (~100 l.)
src/styles.js           la constante CSS
src/storage.js          localStorage : loadDecks, saveDecks
src/outils.js           uid, mkCard, shuffle, counts, BOX_COLOR, flat, relative, fitSize
src/parse.js            parseText et cleanName — pur, sans DOM, donc testable
src/components/         Icons, Segments, Install, Home, DeckView, Study,
                        NewDeckSheet, ImportSheet, MenuSheet
src/main.jsx            point d'entrée : montage React + enregistrement du SW
package.json            dépendances de build + script `npm run build`
sw.js                   cache-first ; constante CACHE = "bristol-vN"
manifest.webmanifest    PWA : nom, icônes, standalone, thème #2A0F4C
icon-{192,512}.png      icônes générées (Pillow)
icon-maskable-512.png   variante à marge large pour Android
publier.bat             crée le dépôt GitHub + active Pages (première fois)
maj.bat                 git add / commit / push (usage courant)
.nojekyll               désactive Jekyll sur Pages
.gitignore              ignore node_modules/
```

`node_modules/` n'est pas versionné ; `package-lock.json` l'est, pour que la
reconstruction donne le même bundle d'une machine à l'autre.

### Modèle de données

```js
// localStorage["bristol:v1"] = JSON d'un tableau de paquets
{
  id: "a1b2c3d4",           // uid() = base36 aléatoire
  name: "Java-socle-jour0",
  created: 1755300000000,
  lastStudied: 1755330000000,   // absent tant que jamais révisé
  cards: [
    { id: "e5f6g7h8", q: "…", a: "…", box: 0 }   // box ∈ {0,1,2}
  ]
}
```

`box` encode le niveau Leitner : **0 = à revoir (rouge), 1 = presque (orange),
2 = acquis (vert)**. Il n'y a volontairement **pas** de date de prochaine révision
pour l'instant — voir la feuille de route.

### Règles de révision (déjà corrigées une fois, ne pas régresser)

- Une session = une liste **figée** au démarrage. Chaque fiche est vue **une seule fois**.
- Noter « À revoir » **ne remet pas** la fiche en fin de file : cela gonflait le
  compteur (24 fiches affichaient « 77 fiches passées en revue »).
- Les ratées sont proposées à l'écran de fin, dans une **nouvelle session explicite**.
- Ordre : mélange aléatoire puis tri stable par `box` croissant (le plus faible d'abord).

### Parseur d'import (`parseText`)

Cœur fragile du projet, à couvrir de tests en priorité. Essaie dans l'ordre :

1. **JSON** — tableau d'objets, clés acceptées : `q|question|recto`, `a|r|answer|reponse|réponse|verso`.
2. **Blocs `Q:` / `R:`** — détectés si les deux préfixes coexistent ; réponses multilignes possibles.
3. **Une fiche par ligne** — séparateur élu par score parmi
   `["::", "\t", " | ", "|", ";", " — ", " - ", ","]`, retenu si ≥ 60 % des lignes
   l'utilisent. La coupure se fait à la **première** occurrence.
4. **Blocs séparés par une ligne vide** — 1re ligne = question, le reste = réponse.

Un fichier = un paquet ; le nom du fichier (sans extension, `_`/`-` → espaces) devient
le nom du paquet. Les lignes commençant par `#` sont ignorées, ce qui sert de commentaire.

Le format attendu des LLM est documenté dans `bristol-format-fiches.md`, hors dépôt,
utilisé comme connaissance de projet côté Claude.

---

## 3. Pièges connus — lire avant de toucher au CSS

- **Ne jamais écrire `background: none` (ni le raccourci `background`) dans
  `.bx button`.** La règle a une spécificité (0,1,1) qui bat toutes les classes
  utilitaires (0,1,0), et le raccourci efface aussi `background-image`. Résultat vécu :
  Réviser, Importer, les pastilles d'icônes et les lignes de liste sont restés
  invisibles pendant plusieurs jours. Le reset autorisé est `background-color: transparent`.
- Les fonds sont actuellement écrits en `background-image: linear-gradient(c, c)`.
  C'était une parade à un diagnostic erroné (mode sombre forcé de Chrome) ; ce n'est
  **plus nécessaire** depuis la correction ci-dessus, et on peut revenir à
  `background-color` pour la lisibilité. Ne pas le faire à moitié.
- **Tous les chemins doivent rester relatifs** (`./app.js`), le site est servi depuis
  un sous-dossier `/Birstol/`.
- **Toujours incrémenter `CACHE` dans `sw.js`** à chaque déploiement, sinon le
  téléphone continue de servir l'ancienne version. Il faut ensuite recharger deux fois :
  le premier chargement active le nouveau service worker, le second sert les fichiers neufs.
- Les polices (Archivo, Newsreader, JetBrains Mono) viennent de Google Fonts au premier
  chargement. Hors-ligne dès le départ, on retombe sur les polices système.
- **Archivo Black Italic** remplace *NaN Jaune Maxi*, la fonte voulue, qui est
  commerciale. Si le `.woff2` est acheté un jour : le déposer dans le dépôt et changer
  la seule variable `--ui`.
- Pas de `localStorage` dans les artefacts Claude.ai — mais ici, en production, c'est
  le stockage normal et voulu.

---

## 4. Reconstruire et déployer

Le build est dans le dépôt depuis le 16 août 2026. Une seule fois, après un clone :

```bash
npm install
```

Puis, à chaque modification du source :

```bash
npm run build
```

Le script est figé dans `package.json` : il compile `src/main.jsx` vers `app.js`
(bundle IIFE minifié, React 18.3.1 épinglé, mode production). Ne pas le relancer à la
main avec une autre ligne de commande, c'est ce qui garantit un bundle reproductible.

Puis : incrémenter `CACHE` dans `sw.js`, `git add -A && git commit && git push`
(ou double-clic sur `maj.bat` sous Windows). GitHub Pages reconstruit en 1 à 2 minutes.

---

## 5. Conventions

- **Langue : tout en français**, interface comme commentaires. Pas d'anglicismes
  dans l'UI (« paquet » pas « deck », « fiche » pas « carte »).
- Nommage des variables CSS en français (`--violet`, `--or`, `--papier`, `--encre`).
- Composants React nommés en anglais (`DeckView`, `Study`) — héritage assumé, ne pas
  renommer sans raison.
- Pas de commentaire qui paraphrase le code ; on commente le **pourquoi**, surtout
  les contournements.
- Aucun ajout de dépendance sans nécessité démontrée. Le poids du bundle est un
  critère de revue.
