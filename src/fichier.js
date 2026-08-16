/* Tout ce qui touche aux fichiers du navigateur, rassemblé ici pour que
   parse.js et sauvegarde.js restent purs et testables. */

export const lireFichier = (f) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => res("");
    r.readAsText(f);
  });

export function telecharger(nom, contenu, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contenu], { type }));
  a.download = nom;
  a.click();
  URL.revokeObjectURL(a.href);
}
