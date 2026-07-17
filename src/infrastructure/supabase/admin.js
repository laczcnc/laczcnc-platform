import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local."
    );
  }

  if (!secretKey) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY en .env.local. Reinicia npm run dev después de agregarla."
    );
  }

  return createSupabaseClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}