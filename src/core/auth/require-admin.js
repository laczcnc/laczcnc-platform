import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login?error=session_required");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();

  const isAuthorized =
    !profileError &&
    profile &&
    profile.role === "admin" &&
    profile.is_active === true;

  if (!isAuthorized) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=access_denied");
  }

  return {
    user,
    profile,
    supabase,
  };
}