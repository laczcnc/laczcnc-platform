"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/core/auth/require-admin";
import { createAdminClient } from "@/infrastructure/supabase/admin";

const ALLOWED_ROLES = [
  "admin",
  "manager",
  "sales",
  "production",
  "delivery",
];

function getText(formData, field) {
  return String(formData.get(field) ?? "").trim();
}

function getOptionalText(formData, field) {
  const value = getText(formData, field);

  return value || null;
}

function getBoolean(formData, field) {
  const value = formData.get(field);

  return (
    value === "true" ||
    value === "on" ||
    value === "1"
  );
}

function getCommissionRate(formData) {
  const rawValue = getText(
    formData,
    "commission_rate"
  );

  if (!rawValue) {
    return 0;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (value < 0 || value > 100) {
    return null;
  }

  return value;
}

function redirectWithError(path, message) {
  redirect(
    `${path}?error=${encodeURIComponent(message)}`
  );
}

function getAuthErrorMessage(error) {
  const message = String(error?.message ?? "");

  if (
    message.toLowerCase().includes(
      "already been registered"
    ) ||
    message.toLowerCase().includes(
      "already registered"
    ) ||
    message.toLowerCase().includes(
      "user already exists"
    )
  ) {
    return "Ya existe una cuenta con ese correo electrónico.";
  }

  if (
    message.toLowerCase().includes(
      "password should be"
    ) ||
    message.toLowerCase().includes(
      "password must be"
    ) ||
    message.toLowerCase().includes(
      "weak password"
    )
  ) {
    return `Supabase rechazó la contraseña: ${message}`;
  }

  return message || "No se pudo completar la operación.";
}

export async function createUserAccount(formData) {
  await requireAdmin();

  const fullName = getText(formData, "full_name");
  const email = getText(formData, "email")
    .toLowerCase();
  const password = String(
    formData.get("password") ?? ""
  );
  const role = getText(formData, "role");
  const phone = getOptionalText(formData, "phone");
  const jobTitle = getOptionalText(
    formData,
    "job_title"
  );
  const department = getOptionalText(
    formData,
    "department"
  );
  const notes = getOptionalText(formData, "notes");
  const commissionRate =
    getCommissionRate(formData);

  const errorPath = "/admin/usuarios/nuevo";

  if (!fullName) {
    redirectWithError(
      errorPath,
      "Escribe el nombre del usuario."
    );
  }

  if (!email || !email.includes("@")) {
    redirectWithError(
      errorPath,
      "Escribe un correo electrónico válido."
    );
  }

  /*
   * La aplicación no exige mayúsculas, números,
   * símbolos ni una longitud determinada.
   * Únicamente comprueba que no esté vacía.
   */
  if (!password) {
    redirectWithError(
      errorPath,
      "Escribe una contraseña."
    );
  }

  if (!ALLOWED_ROLES.includes(role)) {
    redirectWithError(
      errorPath,
      "Selecciona un rol válido."
    );
  }

  if (commissionRate === null) {
    redirectWithError(
      errorPath,
      "La comisión debe estar entre 0 y 100."
    );
  }

  const adminClient = createAdminClient();

  const {
    data: createdUserData,
    error: createUserError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createUserError || !createdUserData.user) {
    redirectWithError(
      errorPath,
      getAuthErrorMessage(createUserError)
    );
  }

  const userId = createdUserData.user.id;

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        role,
        is_active: true,
        phone,
        job_title: jobTitle,
        department,
        commission_rate: commissionRate,
        notes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);

    redirectWithError(
      errorPath,
      `La cuenta no pudo guardarse en perfiles: ${profileError.message}`
    );
  }

  revalidatePath("/admin/usuarios");

  redirect(
    "/admin/usuarios?success=created"
  );
}

export async function updateUserProfile(formData) {
  await requireAdmin();

  const profileId =
    getText(formData, "profile_id") ||
    getText(formData, "user_id");

  const fullName = getText(formData, "full_name");
  const role = getText(formData, "role");
  const phone = getOptionalText(formData, "phone");
  const jobTitle = getOptionalText(
    formData,
    "job_title"
  );
  const department = getOptionalText(
    formData,
    "department"
  );
  const notes = getOptionalText(formData, "notes");
  const commissionRate =
    getCommissionRate(formData);
  const isActive = getBoolean(
    formData,
    "is_active"
  );

  if (!profileId) {
    redirectWithError(
      "/admin/usuarios",
      "No se encontró el usuario."
    );
  }

  if (!fullName) {
    redirectWithError(
      "/admin/usuarios",
      "El nombre es obligatorio."
    );
  }

  if (!ALLOWED_ROLES.includes(role)) {
    redirectWithError(
      "/admin/usuarios",
      "El rol seleccionado no es válido."
    );
  }

  if (commissionRate === null) {
    redirectWithError(
      "/admin/usuarios",
      "La comisión debe estar entre 0 y 100."
    );
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      is_active: isActive,
      phone,
      job_title: jobTitle,
      department,
      commission_rate: commissionRate,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    redirectWithError(
      "/admin/usuarios",
      `No se pudo actualizar el usuario: ${error.message}`
    );
  }

  const { error: authError } =
    await adminClient.auth.admin.updateUserById(
      profileId,
      {
        user_metadata: {
          full_name: fullName,
        },
      }
    );

  if (authError) {
    redirectWithError(
      "/admin/usuarios",
      `El perfil se actualizó, pero no se pudo actualizar Authentication: ${authError.message}`
    );
  }

  revalidatePath("/admin/usuarios");

  redirect(
    "/admin/usuarios?success=updated"
  );
}

export async function resetUserPassword(formData) {
  await requireAdmin();

  const userId =
    getText(formData, "user_id") ||
    getText(formData, "profile_id");

  /*
   * No se usa trim para conservar exactamente
   * la contraseña escrita por el administrador.
   */
  const password = String(
    formData.get("password") ??
      formData.get("new_password") ??
      ""
  );

  if (!userId) {
    redirectWithError(
      "/admin/usuarios",
      "No se encontró el usuario."
    );
  }

  if (!password) {
    redirectWithError(
      "/admin/usuarios",
      "Escribe una contraseña."
    );
  }

  const adminClient = createAdminClient();

  const { error } =
    await adminClient.auth.admin.updateUserById(
      userId,
      {
        password,
      }
    );

  if (error) {
    redirectWithError(
      "/admin/usuarios",
      getAuthErrorMessage(error)
    );
  }

  revalidatePath("/admin/usuarios");

  redirect(
    "/admin/usuarios?success=password"
  );
}

export async function deleteUserAccount(formData) {
  const { user: currentUser } =
    await requireAdmin();

  const userId =
    getText(formData, "user_id") ||
    getText(formData, "profile_id");

  if (!userId) {
    redirectWithError(
      "/admin/usuarios",
      "No se encontró el usuario."
    );
  }

  if (userId === currentUser.id) {
    redirectWithError(
      "/admin/usuarios",
      "No puedes eliminar tu propia cuenta."
    );
  }

  const adminClient = createAdminClient();

  const { error: authError } =
    await adminClient.auth.admin.deleteUser(userId);

  if (authError) {
    redirectWithError(
      "/admin/usuarios",
      `No se pudo eliminar la cuenta: ${authError.message}`
    );
  }

  /*
   * Normalmente profiles se elimina mediante
   * ON DELETE CASCADE. Este borrado adicional
   * mantiene compatibilidad si no existe cascade.
   */
  await adminClient
    .from("profiles")
    .delete()
    .eq("id", userId);

  revalidatePath("/admin/usuarios");

  redirect(
    "/admin/usuarios?success=deleted"
  );
}