/* Remplace BackupSheet dans la version en ligne : les fiches vivent sur le
   serveur, plus besoin d'un export JSON manuel pour ne pas les perdre. */
export function CompteSheet({ email, onClose, onDeconnexion }) {
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <h2 className="display">Compte</h2>
        <p className="lede">Connecté en tant que {email}. Vos fiches sont sauvegardées automatiquement.</p>
        <button className="btn btn-s" onClick={onDeconnexion}>Se déconnecter</button>
      </div>
    </div>
  );
}
