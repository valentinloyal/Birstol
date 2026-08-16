import { useState } from "react";
import { client } from "./client.js";

/* Connexion sans mot de passe : un code à six chiffres envoyé par email.
   Pas de lien cliquable — l'expéditeur gratuit de Neon est fiable pour des
   codes, pas garanti pour des liens (débit limité). Même principe pour
   l'utilisateur : rien à retenir, rien à sécuriser soi-même. */
export function Connexion({ onConnecte }) {
  const [etape, setEtape] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  /* La documentation annonce { data, error }, mais un OTP invalide fait ici
     rejeter la promesse au lieu de rendre error : on couvre les deux formes. */
  const envoyerCode = async (e) => {
    e.preventDefault();
    if (!email.trim() || enCours) return;
    setEnCours(true);
    setErreur("");
    try {
      const { error } = await client.auth.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
      if (error) throw error;
      setEtape("code");
    } catch (err) {
      // Le message reste vague à l'écran, mais la vraie cause part en
      // console : sans ça, un échec de l'expéditeur (débit limité sur le
      // palier gratuit) et une adresse invalide sont indiscernables.
      console.error("envoi du code :", err);
      setErreur("Impossible d'envoyer le code pour l'instant. Réessayez dans une minute.");
    } finally {
      setEnCours(false);
    }
  };

  const valider = async (e) => {
    e.preventDefault();
    if (!code.trim() || enCours) return;
    setEnCours(true);
    setErreur("");
    try {
      const { error } = await client.auth.signIn.emailOtp({ email: email.trim(), otp: code.trim() });
      if (error) throw error;
      onConnecte();
    } catch {
      setErreur("Code incorrect ou expiré.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="bx-shell">
      <div className="scroll" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 40 }}>
        <div className="empty">
          <div className="mark">✉</div>
          <h2 className="display">Bristol</h2>
          <p>
            {etape === "email"
              ? "Entrez votre email, un code de connexion vous sera envoyé."
              : `Un code a été envoyé à ${email}.`}
          </p>
        </div>

        {etape === "email" ? (
          <form onSubmit={envoyerCode} style={{ padding: "0 18px" }}>
            <input className="field" type="email" inputMode="email" autoFocus required
              placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            {erreur && <p className="note" style={{ color: "var(--rouge)", marginTop: 10 }}>{erreur}</p>}
            <button className="btn btn-p" type="submit" style={{ marginTop: 14, width: "100%" }} disabled={enCours}>
              {enCours ? "Envoi…" : "Recevoir un code"}
            </button>
          </form>
        ) : (
          <form onSubmit={valider} style={{ padding: "0 18px" }}>
            <input className="field" type="text" inputMode="numeric" autoFocus required
              placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
            {erreur && <p className="note" style={{ color: "var(--rouge)", marginTop: 10 }}>{erreur}</p>}
            <button className="btn btn-p" type="submit" style={{ marginTop: 14, width: "100%" }} disabled={enCours}>
              {enCours ? "Vérification…" : "Se connecter"}
            </button>
            <button className="btn btn-s" type="button" style={{ marginTop: 8, width: "100%" }}
              onClick={() => { setEtape("email"); setCode(""); setErreur(""); }}>
              Changer d'email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
