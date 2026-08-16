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
src/outils.js           uid, mkCard, shuffle, counts, BOX_COLOR, relative, fitSize
src/parse.js            parseText et cleanName — pur, sans DOM, donc testable
src/sauvegarde.js       format de sauvegarde complète — pur, testable
src/fichier.js          seul module qui lit et écrit des fichiers (FileReader, Blob)
src/components/         Icons, Segments, Install, Home, DeckView, Study,
                        NewDeckSheet, ImportSheet, MenuSheet, BackupSheet
tests/                  parse.test.js, sauvegarde.test.js — npm test
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

### Sauvegarde et export : deux formats distincts, à ne pas confondre

| Geste | Où | Contenu | Sert à |
|---|---|---|---|
| **Exporter toutes mes fiches** | accueil, bouton ⋮ | `{ bristol: 1, exporte, paquets: [...] }` — tout, identifiants, `box` et dates compris | remonter la base à l'identique après un nettoyage du navigateur |
| **Exporter en JSON** | menu d'un paquet | `[{ q, a }, ...]` — les seules questions et réponses | ressortir un paquet, le réimporter, le partager |

« Restaurer » **remplace** toute la base, après un écran de confirmation qui annonce
ce qui sera écrasé. Il refuse explicitement l'export d'un seul paquet et oriente
vers Importer, parce que les deux fichiers se ressemblent assez pour être confondus.

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

Cœur fragile du projet, couvert par `tests/parse.test.js` (`npm test`, 46 tests avec ceux de la sauvegarde).
Toute modification passe par un test d'abord. Essaie dans l'ordre :

1. **JSON** — tableau d'objets, clés acceptées : `q|question|recto`, `a|r|answer|reponse|réponse|verso`.
2. **Blocs `Q:` / `R:`** — détectés si les deux préfixes coexistent ; réponses multilignes possibles.
3. **Une fiche par ligne** — séparateur élu par score parmi
   `["::", "\t", " | ", "|", ";", " — ", " - ", ","]`, retenu si ≥ 60 % des lignes
   l'utilisent. La coupure se fait à la première occurrence **entourée d'espaces**
   s'il en existe une sur la ligne, sinon à la première occurrence tout court.
   C'est ce qui permet à `Que fait int x = 5; ? ; Déclare un entier` d'être coupé
   au bon endroit : le point-virgule du code Java n'est pas un séparateur.
4. **Blocs séparés par une ligne vide** — 1re ligne = question, le reste = réponse.

Un fichier = un paquet ; le nom du fichier (sans extension, `_`/`-` → espaces) devient
le nom du paquet. Les lignes commençant par `#` sont ignorées, ce qui sert de commentaire.

Deux garde-fous : une **ligne d'en-tête de CSV** (`question;réponse`) est retirée si
elle est en tête et qu'il reste des fiches derrière ; un **fichier binaire** (présence
d'un NUL, ou plus de 1 % de caractères de contrôle) est refusé au lieu de produire
une fiche de charabia.

Le format attendu des LLM est documenté dans `bristol-format-fiches.md`, hors dépôt,
utilisé comme connaissance de projet côté Claude.

---

## 3. Pièges connus — lire avant de toucher au CSS

- **Le reset des boutons s'écrit `:where(.bx button)`, et le `:where()` n'est pas
  décoratif.** Sans lui, le sélecteur vaut (0,1,1) et bat toutes les classes de fond,
  qui valent (0,1,0) : Réviser, Importer, les pastilles d'icônes et les lignes de
  liste redeviennent invisibles — c'est le bogue qui a coûté plusieurs jours.
  `:where()` ramène la spécificité à zéro, donc n'importe quelle classe l'emporte.
  Ne jamais y écrire le raccourci `background`, qui effacerait aussi `background-image`.
- Les fonds sont écrits en `background-color` depuis le 16 août 2026. Les
  `background-image: linear-gradient(c, c)` d'avant étaient une parade à un
  diagnostic erroné (mode sombre forcé de Chrome) ; ils ont tous été convertis.
  Les deux seuls `linear-gradient` restants sont de vrais dégradés : le fondu du
  pied de page et les lignes réglées de la fiche.
- Trois éléments n'ont **volontairement** pas de fond, ce n'est pas une régression :
  `.pill` (contour en `box-shadow`), `.drop` (bordure pointillée) et `.menu button`
  (simple filet de séparation).
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
