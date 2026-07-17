import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/infrastructure/supabase/server";
import {
  hasAnyPermission,
  hasPermission,
  normalizeRole,
} from "@/core/auth/permissions";

async function getAuthenticatedProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        role,
        is_active,
        phone,
        job_title,
        department,
        commission_rate
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "No se pudo cargar el perfil del usuario:",
      profileError
    );

    redirect("/login");
  }

  if (!profile) {
    redirect("/login");
  }

  if (profile.is_active !== true) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const role = normalizeRole(profile.role);

  if (!role) {
    await supabase.auth.signOut();
    redirect("/login?error=invalid_role");
  }

  return {
    supabase,
    user,
    profile: {
      ...profile,
      role,
    },
  };
}

export async function requireAuthenticatedProfile() {
  return getAuthenticatedProfile();
}

export async function requirePermission(permission) {
  const session = await getAuthenticatedProfile();

  if (!hasPermission(session.profile.role, permission)) {
    redirect("/admin?error=forbidden");
  }

  return session;
}

export async function requireAnyPermission(permissions = []) {
  const session = await getAuthenticatedProfile();

  if (
    !hasAnyPermission(
      session.profile.role,
      permissions
    )
  ) {
    redirect("/admin?error=forbidden");
  }

  return session;
}

export async function requireRole(allowedRoles = []) {
  const session = await getAuthenticatedProfile();

  const normalizedAllowedRoles = allowedRoles
    .map((role) => normalizeRole(role))
    .filter(Boolean);

  if (
    !normalizedAllowedRoles.includes(
      session.profile.role
    )
  ) {
    redirect("/admin?error=forbidden");
  }

  return session;
}