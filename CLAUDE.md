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
src/revision.js         échéances, files du jour, migration — pur, testable
src/partage.js          réception d'un partage Android — pur, testable
src/cours.js            markdown : sections, blocs, styles — pur, testable
src/astuces.js          documentation intégrée et prompts de génération — pur
src/fichier.js          seul module qui lit et écrit des fichiers (FileReader, Blob)
src/components/         Icons, Segments, Install, Home, DeckView, Study,
                        NewDeckSheet, ImportSheet, MenuSheet, BackupSheet,
                        Cours, CoursSheet, SectionSheet, AstucesSheet,
                        CoursMenuSheet, FicheDepuisCoursSheet, RattacherSheet,
                        LotSheet
tests/                  parse, sauvegarde, revision, partage, cours, astuces — 151 tests
src/main.jsx            point d'entrée : montage React + enregistrement du SW
package.json            dépendances de build + script `npm run build`
sw.js                   cache-first ; constante CACHE = "bristol-vN"
manifest.webmanifest    PWA : nom, icônes, standalone, thème #2A0F4C
icon-{192,512}.png      fiche crème, marge orange, B en Archivo Black Italic sur violet
icon-maskable-512.png   même dessin, contenu resserré dans la zone sûre d’Android
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
  cours: "# La JVM\n…",         // markdown, absent tant qu'aucun cours n'est importé
  cards: [
    {
      id: "e5f6g7h8", q: "…", a: "…",
      box: 0,                  // niveau Leitner, porte aussi la couleur
      interval: 1,             // délai en jours qui vient d'être appliqué
      due: 1755302400000,      // minuit du jour où la fiche redevient à réviser
      section: "le-bytecode",  // ancre d'une section du cours, absent si non rattachée
      suspendue: true          // absent si la fiche est active — voir ci-dessous
    }
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

### Le cours d'un paquet (`cours.js`)

Un paquet peut porter **un cours en markdown**, découpé en sections par ses titres
`#` et `##`. Une fiche peut pointer une section par son ancre ; pendant la révision,
une icône ouvre alors ce passage **en feuille**, sans démonter la session.

**Pourquoi markdown et pas PDF** : lire un PDF dans le navigateur impose `pdf.js`,
environ 1 Mo — cinq fois le bundle entier — pour n'en tirer qu'un texte au découpage
incertain. Le markdown est du texte : il se stocke tel quel et ses titres donnent
gratuitement le découpage dont les fiches ont besoin.

L'ancre est calculée depuis le titre (`Le bytecode` → `le-bytecode`), pas depuis un
numéro d'ordre : elle survit ainsi à une réimportation du cours où l'ordre change.
Deux sections de même titre reçoivent un suffixe (`exercices`, `exercices-2`).

Le rendu est **volontairement partiel** : titres, listes, code, gras, italique,
citations. Ni tableaux, ni images, ni liens — la règle du projet reste : aucune
dépendance. Le markdown est transformé en éléments React, **jamais** injecté en HTML.

### Astuces (`astuces.js`)

Seule documentation intégrée à l’app : un bloc sur l’accueil, au-dessus des deux
boutons du pied, qui ouvre une liste dépliable. Elle contient deux **prompts de
génération** prêts à copier.

Ces prompts sont **une pièce du parseur autant qu’un texte** : s’ils cessent
d’exiger l’espace autour du point-virgule, les paquets générés seront coupés au
mauvais endroit, en silence. `tests/astuces.test.js` monte la garde dessus, et
va jusqu’à importer l’exemple contenu dans le prompt pour vérifier que prompt et
parseur ne divergent pas.

La copie passe par le presse-papiers ; en cas de refus (hors HTTPS, fenêtre sans
focus) le prompt est **sélectionné automatiquement**, pour qu’un appui long suffise.

### Fiches en pause

`suspendue: true` sort une fiche de **tout** : file du jour, révision d'un paquet,
révision des non acquis, compteurs de l'accueil, barre de progression, prochaine
échéance annoncée. Elle reste visible dans la liste du paquet, grisée. Le champ est
**absent** quand la fiche est active, jamais `false`.

Sert aux fiches mal tournées d'un paquet généré, qu'on ne veut ni réviser ni
supprimer. La bascule est dans l'éditeur de fiche et dans la feuille de correction
de la révision — c'est là qu'on les rencontre.

### Un cours et ses fiches dans un seul fichier

Un markdown peut porter ses fiches, dans des blocs de code marqués `fiches`,
placés sous la section concernée :

    ## Le bytecode

    Le fichier .class contient du bytecode.

    ```fiches
    Que produit javac ? ; Du bytecode dans un .class
    ```

Un seul import suffit alors : les fiches arrivent déjà rattachées. Le marqueur est
un bloc de code, il ne gêne aucun autre lecteur de markdown, et `blocs()` savait
déjà le repérer. À l'import, `extraireFiches` sort les fiches et **retire les blocs
du cours affiché**. Une fusion dans un paquet existant n'écrase jamais son cours.

C'est ce format que produit le prompt des astuces, et `tests/astuces.test.js`
rejoue l'exemple exact contenu dans le prompt pour vérifier qu'il s'importe.

### Sélection multiple dans un paquet

Un bouton de la barre du haut bascule la liste en mode sélection : cases à cocher,
« Toutes / Aucune », puis une feuille qui applique au lot un rattachement de section,
une mise en pause, une réactivation ou une suppression. Sans cela, rattacher 76 fiches
demandait 76 allers-retours.

Le mode est **explicite** et non déclenché par un appui long, qui entre en conflit avec
la sélection de texte du système. Les bascules passent par la **forme fonctionnelle** de
`setState` : deux appuis rapprochés liraient sinon le même état, et le second effacerait
la sélection du premier — vu à l'essai, trois appuis ne cochaient qu'une fiche.

### Rattachement assisté (`proposerSection`)

Rattacher 24 fiches une par une, personne ne le fait. `cours.js` propose une section
par fiche en comparant les mots : on écarte accents, ponctuation, mots vides et mots
de moins de trois lettres, puis on mesure la part des mots de la fiche retrouvés dans
la section. **Le titre de section compte double**, c'est lui qui porte le sujet. En
dessous de 20 % de mots partagés, aucune proposition n'est faite : mieux vaut laisser
sans section qu'imposer un lien douteux.

### Règles de révision (déjà corrigées une fois, ne pas régresser)

- Une session = une liste **figée** au démarrage. Chaque fiche est vue **une seule fois**.
- Noter « À revoir » **ne remet pas** la fiche en fin de file : cela gonflait le
  compteur (24 fiches affichaient « 77 fiches passées en revue »).
- Les ratées sont proposées à l'écran de fin, dans une **nouvelle session explicite**.
- Ordre : mélange aléatoire puis tri stable par `box` croissant (le plus faible d'abord).
- Une session porte sur une file de références `{ paquetId, ficheId }` construite
  par `revision.js`. Elle peut donc traverser plusieurs paquets : c'est ce qui permet
  la file du jour. `Study` ne connaît plus un paquet, mais une file.

### Échéances (`revision.js`)

Échelle **1 / 3 / 7 / 21 jours** sur trois boîtes : « Acquis » monte d'un cran quand
il est répété, 7 jours la première fois, 21 ensuite. Une rechute ramène à 1 jour,
même depuis 21.

| Note | `box` | Délai |
|---|---|---|
| À revoir | 0 | 1 jour |
| Presque | 1 | 3 jours |
| Acquis | 2 | 7 jours, puis 21 si l'intervalle précédent valait déjà 7 |

Les échéances tombent **à minuit**, jamais à l'heure de la révision : une fiche notée
à 22 h avec un jour de délai revient le lendemain matin, pas le lendemain soir.

La migration des paquets d'avant se fait dans `loadDecks`, seule porte d'entrée des
données : `box` connu et `due` absent → dû aujourd'hui, intervalle déduit de la boîte.
Elle réécrit aussitôt, pour ne pas être refaite à chaque ouverture.

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

### Partage Android (`share_target`)

Déclaré en **POST multipart** dans le manifeste, la seule forme qui permette de
recevoir des fichiers. Le chemin est en trois temps :

1. Android poste le partage sur `./partage`.
2. `sw.js` intercepte ce POST, vide le formulaire dans un cache dédié
   (`bristol-partage`), et redirige vers `./index.html?partage=recu`.
3. `partage.js` relève cette boîte au démarrage, **la vide**, et ouvre la feuille
   d'import déjà remplie.

Trois précautions à ne pas défaire :

- Le cache `bristol-partage` **doit être épargné** par le ménage de l'événement
  `activate`, qui efface tous les caches sauf `CACHE`. Le POST arrive avant que la
  page ne soit ouverte : effacer ce cache perdrait le partage.
- `recevoirPartage` est entièrement enveloppée dans un `try` et redirige **quoi
  qu'il arrive**. Sans cela, un partage mal formé laisserait l'utilisateur sur une
  page d'erreur du serveur au lieu de l'app.
- Le contenu reçu **n'est jamais importé tout seul** : il ouvre la feuille d'import
  pré-remplie. On partage vite une phrase ou un lien par mégarde, et le parseur en
  tirerait une fiche parasite sans rien dire — vu à l'essai, une phrase contenant
  une virgule suffisait.

**Le POST ne se vérifie que sur un téléphone** : le service worker ne s'enregistre
pas dans l'environnement de vérification local. Ce qui a été vérifié ici, c'est la
relève de la boîte et tout ce qui suit, en y déposant un partage à la main.

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
- **Les icônes doivent tenir dans la zone sûre d’Android** : un cercle centré de
  80 % du côté. Une icône carrée pleine est traitée comme une icône ancienne par le
  lanceur Samsung, qui lui fabrique un fond bleu marine — c’est ce qui donnait un
  logo et un écran de chargement hors charte, alors que le manifeste annonçait
  pourtant le bon violet. Après changement d’icône, il faut **désinstaller et
  réinstaller** la PWA : Android garde son paquet généré plusieurs heures.
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
