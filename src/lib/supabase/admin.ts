import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vérification explicite au démarrage.
// La service role key ne doit JAMAIS commencer par NEXT_PUBLIC_.
// Si elle est absente, toutes les opérations admin échouent — on veut le savoir immédiatement.
if (!supabaseUrl) {
  console.error("[supabase/admin] NEXT_PUBLIC_SUPABASE_URL n'est pas défini");
  throw new Error(
    "Supabase URL manquante — vérifiez NEXT_PUBLIC_SUPABASE_URL dans les variables d'environnement"
  );
}

if (!serviceRoleKey) {
  console.error(
    "[supabase/admin] SUPABASE_SERVICE_ROLE_KEY n'est pas défini.",
    "Cette variable doit être configurée comme variable d'environnement SERVEUR uniquement",
    "(elle ne doit jamais commencer par NEXT_PUBLIC_).",
    "Vérifiez les variables d'environnement dans Vercel ou votre fichier .env.local."
  );
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY manquante — vérifiez les variables d'environnement serveur"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
