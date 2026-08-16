/* Client Neon partagé : authentification (code par email) et accès aux
   données (API REST posée sur Postgres, filtrée par la sécurité au niveau
   des lignes). Les deux URL sont publiques — ce sont des points d'entrée
   HTTPS, pas des secrets — et injectées à la compilation par esbuild. */

import { createClient } from "@neondatabase/neon-js";

export const client = createClient({
  auth: { url: process.env.NEON_AUTH_URL },
  dataApi: { url: process.env.NEON_DATA_API_URL },
});
