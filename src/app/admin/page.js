import { redirect } from "next/navigation";

import { normalizeRole } from "@/core/auth/permissions";
import { createClient } from "@/infrastructure/supabase/server";

export const dynamic = "force-dynamic";

const ROLE_HOME_ROUTES = {
  admin: "/admin/dashboard",
  manager: "/admin/dashboard",
  sales: "/admin/dashboard",
  production: "/admin/dashboard",
  delivery: "/admin/dashboard",
};

export default async function AdminEntryPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        role,
        is_active
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error(
      "No se pudo cargar el perfil al entrar al panel:",
      {
        userId: user.id,
        code: profileError?.code,
        message: profileError?.message,
        details: profileError?.details,
        hint: profileError?.hint,
      }
    );

    await supabase.auth.signOut();

    redirect(
      "/admin/login?error=profile_not_found"
    );
  }

  if (profile.is_active !== true) {
    await supabase.auth.signOut();

    redirect("/admin/login?error=inactive");
  }

  const role = normalizeRole(profile.role);

  if (!role) {
    await supabase.auth.signOut();

    redirect("/admin/login?error=invalid_role");
  }

  const destination =
    ROLE_HOME_ROUTES[role] ||
    "/admin/dashboard";

  redirect(destination);
}