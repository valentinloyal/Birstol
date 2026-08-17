# Memento — feuille de route

État au 16 août 2026 : l'app est en production, utilisée quotidiennement, un paquet
de 24 fiches Java en circulation. Les trois bogues bloquants (compteur gonflé, fonds
de boutons invisibles, boutons d'accueil redondants) sont corrigés.

Ordre proposé : la dette d'abord, elle rend tout le reste moins coûteux.

---

## Étape 0 — Assainir avant d'ajouter — **faite le 16 août 2026**

Rien de visible pour l'utilisateur, tout de visible pour la suite.

1. ~~**Découper `source-App.jsx`**~~ — 13 modules, aucun au-dessus de 161 lignes.
2. ~~**Tests sur `parseText`**~~ — 46 tests avec `node --test`, sans framework.
   Trois défauts corrigés au passage : la fiche parasite du CSV à en-tête est
   filtrée, une question contenant du code Java n'est plus coupée sur ses `;`,
   un fichier binaire est refusé au lieu de produire du charabia.
3. ~~**Rapatrier le build dans le dépôt**~~ — `npm install` puis `npm run build`,
   React 18.3.1 et esbuild épinglés, `package-lock.json` versionné.
4. ~~**Repasser les fonds en `background-color`**~~ — 28 fonds convertis. Le reset
   des boutons est passé en `:where(.bx button)` : sans cela la conversion
   rejouait le bogue des boutons invisibles.
5. ~~**Sauvegarde manuelle de la base**~~ — bouton ⋮ sur l'accueil, export complet
   daté et restauration avec confirmation.

## Étape 1 — La révision devient sérieuse

6. ~~**Dates de révision**~~ — **fait le 18 août 2026.** `due` et `interval` sur chaque
   fiche, échelle 1 / 3 / 7 / 21 jours, `box` conservé. Migration automatique des
   paquets existants au chargement.
7. ~~**File du jour sur l'accueil**~~ — **fait le 18 août 2026.** Un bouton unique
   « N fiches à réviser aujourd'hui », tous paquets confondus. Quand il n'y a rien :
   « À jour. Prochaine fiche demain. »
8. **Notification quotidienne** — `Notification` + `showTrigger` si disponible, sinon
   un simple rappel à l'ouverture. Rester sobre : une par jour, désactivable.

## Étape 2 — Confort de saisie (1 jour)

9. ~~**Web Share Target**~~ — fait le 18 août 2026, texte et fichiers, en POST
   multipart intercepté par le service worker. **À confirmer sur le téléphone** :
   le service worker ne s'enregistre pas dans l'environnement de vérification.
10. ~~**Fusionner dans un paquet existant** à l'import~~ — fait le 18 août 2026.
11. **Détection des doublons et des quasi-doublons** à l'import — utile : le paquet Java
    contient déjà deux fiches dont la réponse est la même paire bytecode/`.class`.
    Comparaison sur la réponse normalisée, proposition de fusion.
12. **Recherche** ~~et réorganisation~~ dans la liste des fiches d'un paquet — la
    recherche est faite le 18 août 2026, la réorganisation reste à faire.
13. ~~**Gestes** — glisser à droite pour « acquis », à gauche pour « à revoir »~~ —
    fait le 18 août 2026, après les dates de révision comme prévu.

### Ajouts hors feuille de route initiale, faits le 18 août 2026

- **Annuler la dernière note** en révision. Depuis les échéances, un mauvais appui
  coûte jusqu'à 21 jours d'absence de la fiche.
- **Corriger une fiche pendant la révision**, sans quitter la session.
- **Un cours en markdown par paquet**, découpé en sections, auquel les fiches se
  rattachent. Consultable pendant la révision, exportable en `.md`.
- **Réviser une section du cours** depuis l'écran de lecture.
- **Créer une fiche depuis une sélection** dans le cours : le passage devient la
  réponse, la question reste à écrire, la section est déjà rattachée.
- **Rattachement assisté** des fiches aux sections, par comparaison des mots.
- **Mettre une fiche en pause** : elle sort des révisions et des compteurs sans
  être supprimée.
- **Un bloc Astuces sur l'accueil**, seule documentation intégrée, avec deux
  prompts de génération prêts à copier.

## Étape 3 — Au-delà (à arbitrer)

14. **Synchronisation** — un JSON dans un dépôt privé ou un Gist, poussé via un token
    stocké localement. Permet de réviser sur deux appareils sans serveur.
15. **Statistiques** — courbe de rétention par paquet, fiches chroniquement ratées.
16. **APK** — Capacitor (autonome) ou PWABuilder (TWA). Le nécessaire est déjà en place ;
    ne le faire que si l'installation PWA montre ses limites.
17. **Mode examen** — série chronométrée, sans révélation immédiate, score final.

---

## Non-objectifs assumés

- Pas de compte utilisateur, pas de backend, pas d'analytics.
- Pas de partage social ni de paquets publics.
- Pas de rendu Markdown ni LaTeX dans les fiches tant qu'un besoin réel n'apparaît pas.
- Pas de mode clair : l'identité visuelle est sombre, un thème clair doublerait la
  surface CSS pour un usage nocturne majoritaire.
