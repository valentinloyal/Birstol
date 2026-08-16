/* Feuille de style unique, injectée dans un <style> par le composant racine.
   Pas de Tailwind, pas de post-traitement : une constante et c'est tout. */

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,900&family=Newsreader:opsz,wght@6..72,300;6..72,500&family=JetBrains+Mono:wght@400;600&display=swap');

.bx * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.bx {
  --violet:#2A0F4C; --violet2:#3A1668; --violet3:#502290;
  --or:#F2A310; --lavande:#A98BE8;
  --papier:#FBF6EE; --papier2:#E7DECF; --encre:#2A0F4C;
  --rouge:#E2506B; --vert:#46B394;
  --clair:#F0E8FA; --sourdine:#AE9BD0;
  --ui:'Archivo', system-ui, sans-serif;
  --serif:'Newsreader', Georgia, serif;
  --mono:'JetBrains Mono', ui-monospace, monospace;
  position:fixed; inset:0; overflow:hidden;
  background:var(--violet); color:var(--clair);
  font-family:var(--ui); font-size:16px; line-height:1.45;
  display:flex; justify-content:center;
}
.bx-shell { width:100%; max-width:520px; height:100%; display:flex; flex-direction:column; position:relative; }
/* :where() met ce reset a specificite zero. Sans lui, « .bx button » vaut (0,1,1)
   et bat toutes les classes de fond, qui valent (0,1,0) : Reviser, Importer, les
   pastilles et les lignes de liste redeviendraient invisibles. Ne jamais retirer
   le :where(), et ne jamais utiliser ici le raccourci « background ». */
:where(.bx button) { font-family:inherit; font-size:inherit; color:inherit; background-color:transparent; border:none; cursor:pointer; }
.bx :focus-visible { outline:2px solid var(--or); outline-offset:3px; border-radius:4px; }
.bx input, .bx textarea { font-family:inherit; font-size:16px; }

.display { font-weight:900; font-style:italic; text-transform:uppercase; letter-spacing:-.015em; line-height:.95; }

/* --- barres --- */
.topbar { display:flex; align-items:center; gap:12px; padding:18px 18px 12px; flex:0 0 auto; }
.topbar h1 { font-size:34px; margin:0; color:var(--or); }
.topbar .sub { font-family:var(--mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--lavande); margin-bottom:3px; }
.iconbtn { width:42px; height:42px; border-radius:13px; display:grid; place-items:center; color:var(--clair); flex:0 0 auto;
  background-color:var(--violet2); transition:transform .12s; }
.iconbtn:active { transform:scale(.92); }
.scroll { flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:0 18px 150px; }

/* --- compteurs --- */
.tally { display:flex; gap:8px; margin:2px 0 20px; }
.tally div { flex:1; border-radius:14px; padding:11px 13px; background-color:var(--violet2); }
.tally b { display:block; font-family:var(--mono); font-size:21px; font-weight:600; letter-spacing:-.03em; }
.tally span { font-size:10px; color:var(--sourdine); letter-spacing:.12em; text-transform:uppercase; font-family:var(--mono); }

/* --- paquet dans la liste --- */
.deck { position:relative; width:100%; text-align:left; color:var(--encre);
  background-color:var(--papier);
  border-radius:12px; padding:15px 16px 15px 32px; margin-bottom:11px; overflow:hidden;
  box-shadow:0 12px 22px -16px #000; transition:transform .12s; }
.deck:active { transform:scale(.985); }
.deck::before { content:""; position:absolute; left:20px; top:0; bottom:0; width:2px;
  background-color:var(--or); opacity:.85; }
.deck h3 { margin:0 0 3px; font-size:19px; font-weight:700; letter-spacing:-.015em; }
.deck .meta { font-family:var(--mono); font-size:11px; color:#7A6B93; }
.seg { display:flex; gap:2px; height:6px; margin-top:12px; border-radius:99px; overflow:hidden;
  background-color:var(--papier2); }
.seg i { display:block; height:100%; }

/* --- boutons --- */
.foot { position:absolute; left:0; right:0; bottom:0; padding:14px 18px calc(18px + env(safe-area-inset-bottom));
  display:flex; gap:10px; align-items:stretch;
  background-image:linear-gradient(to top, var(--violet) 60%, rgba(42,15,76,0)); }
.btn { flex:1; height:54px; border-radius:15px; font-weight:700; font-size:16px; letter-spacing:-.01em;
  display:grid; place-items:center; text-align:center; transition:transform .12s; }
.btn:active { transform:scale(.97); }
.btn-p { background-color:var(--or); color:#2A0F4C; }
.btn-s { background-color:var(--violet2); color:var(--clair); box-shadow:inset 0 0 0 1.5px var(--violet3); }
.btn-n { flex:0 0 auto; padding:0 18px; font-size:14px; }
.btn[disabled] { opacity:.35; pointer-events:none; }
.pill { height:36px; padding:0 14px; border-radius:99px; font-size:13px; font-weight:700; color:var(--or);
  box-shadow:inset 0 0 0 1.5px var(--violet3); display:flex; align-items:center; gap:6px; flex:0 0 auto; transition:transform .12s; }
.pill:active { transform:scale(.94); }

/* --- file du jour, sur l'accueil --- */
.jour { width:100%; height:auto; padding:14px 16px; margin:0 0 18px; gap:1px; }
.jour b { font-size:18px; letter-spacing:-.015em; }
.jour small { font-family:var(--mono); font-size:10px; letter-spacing:.1em; text-transform:uppercase; opacity:.72; font-weight:400; }
.rien-du-jour { border-radius:14px; padding:13px 15px; margin-bottom:18px; font-size:13px; color:var(--sourdine);
  background-color:var(--violet2); }
.rien-du-jour b { color:var(--vert); }

/* --- ecran vide --- */
.empty { text-align:center; padding:56px 10px 30px; }
.empty .mark { font-family:var(--serif); font-size:56px; color:var(--violet3); line-height:1; }
.empty h2 { font-size:27px; margin:14px 0 8px; color:var(--or); }
.empty p { color:var(--sourdine); font-size:14px; margin:0 auto; max-width:300px; }

/* --- revision --- */
.study { position:absolute; inset:0; display:flex; flex-direction:column; z-index:20;
  background-color:var(--violet); }
.progress { height:3px; flex:0 0 auto; background-color:var(--violet2); }
.progress i { display:block; height:100%; background-color:var(--or); transition:width .3s; }
.stage { flex:1 1 auto; display:grid; place-items:center; padding:6px 18px 0; perspective:1400px; min-height:0; }
.stack { position:relative; width:100%; height:100%; max-height:430px; }
.ghost { position:absolute; inset:0; border-radius:12px; opacity:.2;
  background-color:var(--papier2); }
.flip { position:absolute; inset:0; transition:transform .5s cubic-bezier(.2,.8,.2,1); transform-style:preserve-3d; cursor:pointer; }
.flip.on { transform:rotateY(180deg); }
.face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  color:var(--encre); border-radius:12px; overflow:hidden;
  background-color:var(--papier);
  box-shadow:0 26px 40px -26px #000; }
.face.back { transform:rotateY(180deg); }
.face .rule { position:absolute; inset:0; pointer-events:none;
  background-image:repeating-linear-gradient(to bottom, transparent 0 29px, rgba(169,139,232,.32) 29px 30px); }
.face .marge { position:absolute; left:36px; top:0; bottom:0; width:2px;
  background-color:var(--or); opacity:.7; }
.face .tag { position:absolute; top:7px; left:48px; z-index:1; font-family:var(--mono); font-size:10px;
  letter-spacing:.2em; text-transform:uppercase; color:#8E7BAE; }
.face .body { position:absolute; inset:0; z-index:1; overflow-y:auto; padding:38px 22px 24px 48px;
  font-family:var(--serif); font-weight:300; line-height:30px; }
.face .body span { display:block; white-space:pre-wrap; }
.hint { text-align:center; font-size:13px; color:var(--sourdine); }
.grade { display:flex; gap:8px; padding:12px 18px calc(20px + env(safe-area-inset-bottom)); flex:0 0 auto; min-height:98px; align-items:center; }
.grade button { flex:1; height:62px; border-radius:15px; font-weight:700; font-size:14px;
  display:flex; flex-direction:column; justify-content:center; gap:1px; transition:transform .12s; }
.grade button:active { transform:scale(.95); }
.grade small { font-family:var(--mono); font-size:10px; opacity:.7; font-weight:400; }

/* Reperes du balayage, revelees sous la fiche pendant le geste. */
.marque { position:absolute; top:50%; transform:translateY(-50%); z-index:0; font-weight:900; font-style:italic;
  text-transform:uppercase; font-size:15px; letter-spacing:-.01em; padding:9px 14px; border-radius:11px; }
.marque.gauche { left:-6px; color:#FFF; background-color:var(--rouge); }
.marque.droite { right:-6px; color:#0D3B2E; background-color:var(--vert); }

.revenir { position:absolute; left:18px; right:18px; bottom:calc(96px + env(safe-area-inset-bottom));
  height:42px; border-radius:13px; display:flex; align-items:center; justify-content:center; gap:8px;
  font-size:14px; font-weight:600; color:var(--lavande); background-color:var(--violet2); }

/* Barre de creation depuis une selection dans le cours. Placee en bas, loin de
   la barre native de selection dAndroid qui occupe les abords du texte. */
.depuis-selection { position:absolute; left:18px; right:18px; bottom:calc(96px + env(safe-area-inset-bottom));
  z-index:10; display:flex; align-items:center; gap:11px; text-align:left; border-radius:14px; padding:11px 13px;
  color:#2A0F4C; background-color:var(--or); box-shadow:0 16px 30px -16px #000; animation:up .18s; }
.depuis-selection .pastille { width:30px; height:30px; border-radius:10px; display:grid; place-items:center;
  flex:0 0 auto; color:var(--or); background-color:#2A0F4C; }
.depuis-selection b { display:block; font-size:14px; }
.depuis-selection small { display:block; font-size:11.5px; opacity:.72; margin-top:1px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cours ::selection { color:#2A0F4C; background-color:var(--or); }

.rattacher { max-height:52vh; overflow-y:auto; margin:0 -2px; padding:0 2px; }
.rattacher > div { padding:12px 0; border-bottom:1px solid var(--violet2); }
.rattacher > div:first-child { padding-top:0; }
.rattacher p { margin:0 0 8px; font-size:14px; font-weight:600; line-height:1.4;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* --- bascule oui/non --- */
.bascule { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; text-align:left;
  border-radius:13px; padding:11px 13px; margin-top:14px; background-color:var(--violet); }
.bascule b { display:block; font-size:14px; font-weight:600; }
.bascule small { display:block; font-size:11.5px; color:var(--sourdine); margin-top:2px; }
.bascule i { width:44px; height:26px; border-radius:99px; flex:0 0 auto; position:relative; transition:background-color .15s;
  background-color:var(--violet3); }
.bascule i::after { content:""; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:99px;
  background-color:var(--clair); transition:transform .15s; }
.bascule i.on { background-color:var(--or); }
.bascule i.on::after { transform:translateX(18px); }

.row.en-pause { opacity:.5; }
.row.en-pause .a { color:var(--or); }

/* --- astuces --- */
.astuces-bloc { display:flex; align-items:center; gap:12px; width:100%; text-align:left; border-radius:14px;
  padding:13px 14px; margin:6px 0 4px; background-color:var(--violet2);
  box-shadow:inset 0 0 0 1.5px var(--violet3); transition:transform .12s; }
.astuces-bloc:active { transform:scale(.985); }
.astuces-bloc .pastille { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; flex:0 0 auto;
  color:#2A0F4C; background-color:var(--or); }
.astuces-bloc b { display:block; font-size:15px; letter-spacing:-.01em; }
.astuces-bloc small { display:block; font-size:12px; color:var(--sourdine); margin-top:1px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.astuces > div { border-bottom:1px solid var(--violet2); }
.astuces > div > button { display:flex; align-items:center; justify-content:space-between; gap:10px;
  width:100%; text-align:left; padding:14px 2px; font-size:15px; font-weight:600; }
.astuces > div.ouverte > button { color:var(--or); }
.astuces > div > button em { font-family:var(--mono); font-style:normal; font-size:17px; color:var(--sourdine); flex:0 0 auto; }
.astuces .corps { padding:0 2px 14px; }
.astuces .corps p { margin:0 0 12px; font-size:14px; line-height:1.55; color:var(--sourdine); }
.astuces .corps pre { margin:0; padding:12px 13px; border-radius:11px; max-height:240px; overflow:auto;
  font-family:var(--mono); font-size:11.5px; line-height:1.5; color:var(--clair); white-space:pre-wrap;
  word-break:break-word; background-color:var(--violet2); box-shadow:inset 0 0 0 1.5px var(--violet3); }

/* --- cours --- */
.sommaire { display:flex; gap:7px; overflow-x:auto; padding:0 18px 12px; flex:0 0 auto; scrollbar-width:none; }
.sommaire::-webkit-scrollbar { display:none; }
.sommaire button { flex:0 0 auto; height:33px; padding:0 13px; border-radius:99px; font-size:13px; font-weight:600;
  color:var(--sourdine); background-color:var(--violet2); display:flex; align-items:center; gap:6px; }
.sommaire button.actif { color:#2A0F4C; background-color:var(--or); }
.sommaire button em { font-family:var(--mono); font-size:10px; font-style:normal; opacity:.7; }

.cours { font-family:var(--serif); font-weight:300; font-size:17px; line-height:1.62; color:var(--clair); }
.cours h3 { font-family:var(--ui); font-weight:900; font-style:italic; text-transform:uppercase; letter-spacing:-.015em;
  font-size:23px; color:var(--or); margin:6px 0 14px; line-height:1.05; }
.cours h4 { font-family:var(--ui); font-size:15px; font-weight:700; color:var(--lavande); margin:22px 0 6px; }
.cours p { margin:0 0 14px; }
.cours ul, .cours ol { margin:0 0 14px; padding-left:22px; }
.cours li { margin-bottom:6px; }
.cours b { font-weight:600; color:#FFF; }
.cours i { font-style:italic; }
.cours code { font-family:var(--mono); font-size:13.5px; padding:1px 5px; border-radius:5px;
  color:var(--or); background-color:var(--violet2); }
.cours pre { margin:0 0 16px; padding:13px 14px; border-radius:12px; overflow-x:auto;
  background-color:var(--violet2); box-shadow:inset 0 0 0 1.5px var(--violet3); }
.cours pre code { display:block; font-size:12.5px; line-height:1.55; color:var(--clair); background-color:transparent;
  padding:0; white-space:pre; }
.cours blockquote { margin:0 0 14px; padding:2px 0 2px 14px; border-left:2.5px solid var(--violet3);
  color:var(--sourdine); font-style:italic; }

/* --- recherche dans un paquet --- */
.chercher { display:flex; align-items:center; gap:9px; border-radius:13px; padding:0 12px; margin-bottom:12px;
  height:44px; color:var(--lavande); background-color:var(--violet2); }
.chercher input { flex:1; min-width:0; border:none; outline:none; color:var(--clair); background-color:transparent; }
.chercher input::placeholder { color:#7C6A9C; }
.chercher button { display:grid; place-items:center; color:var(--sourdine); flex:0 0 auto; }

/* --- listes de fiches --- */
.row { display:flex; gap:11px; align-items:flex-start; border-radius:13px; padding:13px 15px; margin-bottom:8px;
  text-align:left; width:100%; background-color:var(--violet2); }
.row .n { font-family:var(--mono); font-size:11px; color:var(--sourdine); padding-top:3px; min-width:22px; }
.row .q { font-weight:600; font-size:15px; letter-spacing:-.01em; }
.row .a { font-size:14px; color:var(--sourdine); margin-top:2px; }
.dot { width:8px; height:8px; border-radius:99px; margin-top:7px; flex:0 0 auto; }
.field { width:100%; border:1.5px solid var(--violet3); color:var(--clair); border-radius:13px; padding:12px 14px; resize:vertical;
  background-color:var(--violet2); }
.field::placeholder { color:#7C6A9C; }
select.field { -webkit-appearance:none; appearance:none; padding-right:34px;
  background-image:url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23A98BE8%27 stroke-width=%272%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 11px center; background-size:17px; }
select.field option { background-color:var(--violet2); color:var(--clair); }
.label { font-family:var(--mono); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--lavande); margin:14px 0 6px; }

/* --- feuille modale --- */
.sheet-bg { position:absolute; inset:0; z-index:30; display:flex; align-items:flex-end; animation:fade .2s;
  background-color:rgba(14,4,28,.78); }
.sheet { width:100%; max-height:88%; overflow-y:auto; border-radius:22px 22px 0 0;
  background-color:var(--violet);
  box-shadow:inset 0 1.5px 0 var(--violet3);
  padding:8px 18px calc(24px + env(safe-area-inset-bottom)); animation:up .28s cubic-bezier(.2,.8,.2,1); }
.grip { width:40px; height:4px; border-radius:99px; margin:6px auto 16px; background-color:var(--violet3); }
.sheet h2 { font-size:24px; margin:0 0 5px; color:var(--or); }
.sheet .lede { color:var(--sourdine); font-size:14px; margin:0 0 16px; }
.tabs { display:flex; gap:6px; padding:4px; border-radius:13px; margin-bottom:16px;
  background-color:var(--violet2); }
.tabs button { flex:1; height:38px; border-radius:10px; font-size:14px; font-weight:600; color:var(--sourdine); }
.tabs button[aria-selected="true"] { background-color:var(--violet3); color:var(--clair); }
.drop { border:1.5px dashed var(--violet3); border-radius:15px; padding:22px 16px; text-align:center; margin-bottom:10px; }
.drop.hot { border-color:var(--or); background-color:rgba(242,163,16,.1); }
.drop p { margin:8px 0 0; font-size:13px; color:var(--sourdine); }
.note { font-size:12px; color:var(--sourdine); line-height:1.5; }
.note code { font-family:var(--mono); font-size:11px; padding:1px 5px; border-radius:4px; color:var(--lavande);
  background-color:var(--violet2); }
.menu button { display:block; width:100%; text-align:left; padding:16px 4px; font-size:16px; font-weight:500;
  border-bottom:1px solid var(--violet2); }
.menu button.danger { color:var(--rouge); }
.steps { counter-reset:s; margin:6px 0 0; padding:0; list-style:none; }
.steps li { counter-increment:s; position:relative; padding:11px 0 11px 36px; font-size:15px; border-bottom:1px solid var(--violet2); }
.steps li::before { content:counter(s); position:absolute; left:0; top:11px; width:24px; height:24px; border-radius:99px;
  color:var(--or); font-family:var(--mono); font-size:11px; display:grid; place-items:center;
  background-color:var(--violet2); }
.toast { position:absolute; left:18px; right:18px; bottom:96px; z-index:40; border-radius:14px; padding:13px 16px;
  font-size:14px; font-weight:600; color:var(--encre); background-color:var(--papier);
  box-shadow:0 16px 30px -16px #000; }

@keyframes fade { from { opacity:0 } }
@keyframes up { from { transform:translateY(26px) } }
@media (prefers-reduced-motion: reduce) { .bx *, .bx *::before { animation:none !important; transition-duration:.01ms !important; } }
`;
