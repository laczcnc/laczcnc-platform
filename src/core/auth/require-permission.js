import "server-only";

import { redirect } from "next/navigation";

import {
  hasAnyPermission,
  hasPermission,
  normalizeRole,
} from "@/core/auth/permissions";
import { createClient } from "@/infrastructure/supabase/server";

async function getAuthenticatedProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      "/admin/login?error=session_required"
    );
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
      {
        userId: user.id,
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      }
    );

    await supabase.auth.signOut();

    redirect(
      "/admin/login?error=profile_not_found"
    );
  }

  if (!profile) {
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

    redirect(
      "/admin/login?error=invalid_role"
    );
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

export async function requirePermission(
  permission
) {
  const session =
    await getAuthenticatedProfile();

  if (
    !hasPermission(
      session.profile.role,
      permission
    )
  ) {
    redirect(
      `/admin/sin-acceso?permiso=${encodeURIComponent(
        permission || "unknown"
      )}`
    );
  }

  return session;
}

export async function requireAnyPermission(
  permissions = []
) {
  const session =
    await getAuthenticatedProfile();

  if (
    !hasAnyPermission(
      session.profile.role,
      permissions
    )
  ) {
    redirect("/admin/sin-acceso");
  }

  return session;
}

export async function requireRole(
  allowedRoles = []
) {
  const session =
    await getAuthenticatedProfile();

  const normalizedAllowedRoles = allowedRoles
    .map((role) => normalizeRole(role))
    .filter(Boolean);

  if (
    !normalizedAllowedRoles.includes(
      session.profile.role
    )
  ) {
    redirect("/admin/sin-acceso");
  }

  return session;
}