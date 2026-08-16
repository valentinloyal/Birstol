/* Les astuces de l'accueil : la seule documentation intégrée à l'app.
   Pur, sans DOM, pour que les tests puissent monter la garde sur le prompt.

   Le prompt ci-dessous encode les contraintes réelles du parseur. Toute
   modification qui en retirerait une casserait des imports en silence :
   tests/astuces.test.js vérifie que les règles critiques y figurent encore. */

export const PROMPT_PAQUET = `Tu produis du matériel de révision pour Bristol, une app de fiches.
Sujet : [SUJET]
Niveau : [NIVEAU]
Volume : [NOMBRE] fiches.

Rends UN SEUL fichier markdown, nommé sujet-en-minuscules.md, contenant le cours
ET ses fiches. Bristol importe les deux d'un coup, déjà reliés.

STRUCTURE
- « # » pour le titre général, « ## » pour chaque section. Ces titres découpent
  le cours dans l'app : garde-les COURTS (2 à 4 mots) et DISTINCTS.
- « ### » pour les sous-parties, elles restent dans la section.
- Vise 4 à 7 sections.
- Après le texte de CHAQUE section « ## », place ses fiches dans un bloc de code
  marqué \`fiches\` :

## Le bytecode

Le fichier .class contient du bytecode, jamais du code machine.

\`\`\`fiches
Que produit javac ? ; Du bytecode dans un .class, jamais du code machine
Que fait int x = 5; ? ; Elle déclare un entier x valant 5
\`\`\`

LE COURS
- Rendu par l'app : paragraphes, listes « - » ou « 1. », blocs de code avec le
  langage indiqué, **gras**, *italique*, \`code en ligne\`, citations « > ».
- NON rendu, à proscrire : tableaux, images, liens, HTML, LaTeX.
- Un vrai cours explicatif : chaque section répond à « pourquoi c'est comme ça »,
  pas seulement « c'est quoi ».

LES FICHES, règles impératives, l'import échoue sinon
- Format exact : question ; réponse
- Le point-virgule est ENTOURÉ D'UNE ESPACE de chaque côté. C'est ce qui permet
  à une question contenant du code (« Que fait int x = 5; ? ») de ne pas être
  coupée sur le ; du code.
- Une fiche = UNE seule ligne. Jamais de retour à la ligne dans une question ni
  dans une réponse.
- AUCUNE ligne d'en-tête. Ni « :: », ni « | », ni tabulation.
- Ne pose aucune question dont la réponse n'est pas dans la section juste au-dessus.
- Une seule idée par fiche. Réponses autonomes, une à deux lignes.
- Pas de doublons, même reformulés : jamais deux fiches de même réponse.`;

export const PROMPT_FICHES_SEULES = `J'ai déjà ce cours. Produis-en [NOMBRE] fiches de révision.

Une fiche par ligne, format exact : question ; réponse
- Le point-virgule est ENTOURÉ D'UNE ESPACE de chaque côté, toujours.
- Une fiche = UNE seule ligne, jamais de retour à la ligne dedans.
- Aucune ligne d'en-tête. Ni « :: », ni « | », ni tabulation.
- Une ligne « # Section : <titre exact> » avant chaque groupe de fiches.
- Une seule idée par fiche, pas de doublons même reformulés.
- Ne pose aucune question dont la réponse n'est pas dans le cours.

Le cours :
[COLLER LE COURS ICI]`;

export const ASTUCES = [
  {
    id: "prompt",
    titre: "Faire écrire un paquet par une IA",
    texte:
      "Copiez ce prompt, remplacez le sujet et le volume, et donnez-le à votre assistant. " +
      "Il rend UN SEUL fichier markdown contenant le cours et ses fiches, que vous importez " +
      "d'un coup par Importer : les fiches arrivent déjà rattachées à leur section. " +
      "Le nom du fichier devient le nom du paquet.",
    prompt: PROMPT_PAQUET,
  },
  {
    id: "prompt-fiches",
    titre: "Tirer des fiches d'un cours existant",
    texte:
      "Vous avez déjà le cours et il vous manque les fiches : ce prompt-là ne demande que les fiches, " +
      "et les regroupe par section pour que le rattachement soit rapide.",
    prompt: PROMPT_FICHES_SEULES,
  },
  {
    id: "format",
    titre: "Le format d'import en une ligne",
    texte:
      "question ; réponse — une fiche par ligne, avec une espace de chaque côté du point-virgule. " +
      "Ces espaces comptent : sans elles, une question contenant du code Java serait coupée sur le " +
      "point-virgule du code. Les lignes commençant par # sont ignorées, servez-vous-en comme commentaires. " +
      "L'app lit aussi le JSON, les blocs Q: / R:, les tabulations et les blocs séparés par une ligne vide.",
  },
  {
    id: "gestes",
    titre: "Noter au pouce",
    texte:
      "Pendant la révision, une fois la réponse visible : glissez la fiche vers la droite pour « acquis », " +
      "vers la gauche pour « à revoir ». Un appui simple la retourne.",
  },
  {
    id: "erreur",
    titre: "Rattraper un mauvais appui",
    texte:
      "Une note posée par erreur fait disparaître la fiche jusqu'à trois semaines. La flèche de retour, " +
      "en haut à droite pendant la révision, annule la dernière note et remet l'échéance telle qu'elle était.",
  },
  {
    id: "corriger",
    titre: "Corriger une fiche sans quitter la session",
    texte:
      "Le crayon, en haut à droite pendant la révision, ouvre la fiche en cours. Les paquets écrits par une IA " +
      "ont toujours quelques coquilles, et c'est en révisant qu'on les trouve. Corriger ne change ni le niveau " +
      "ni la date de la fiche.",
  },
  {
    id: "cours",
    titre: "Relier les fiches au cours",
    texte:
      "L'icône cours, en haut d'un paquet, permet d'importer un fichier markdown. Ses titres # et ## le découpent " +
      "en sections. Ouvrez ensuite une fiche pour lui choisir une section : pendant la révision, une icône ouvrira " +
      "le passage correspondant sans faire perdre votre place.",
  },
  {
    id: "rythme",
    titre: "Le rythme des révisions",
    texte:
      "« À revoir » repose la fiche au lendemain, « Presque » à trois jours, « Acquis » à sept jours puis à " +
      "vingt-et-un si elle est réussie deux fois de suite. Les échéances tombent à minuit : une fiche notée à " +
      "22 h revient le lendemain matin, pas le lendemain soir.",
  },
  {
    id: "fusion",
    titre: "Éviter d'empiler les paquets",
    texte:
      "À l'import, le menu « Destination » permet de verser les fiches dans un paquet existant au lieu d'en créer " +
      "un de plus. Pratique quand on génère un paquet par jour sur le même sujet.",
  },
  {
    id: "sauvegarde",
    titre: "Vos fiches ne vivent que dans ce navigateur",
    texte:
      "Un nettoyage de Chrome les efface sans recours. Le bouton ⋮ de l'accueil exporte tout dans un seul fichier, " +
      "progression comprise, et sait le relire. Prenez le réflexe après chaque gros import.",
  },
];
