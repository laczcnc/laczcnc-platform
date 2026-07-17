"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/core/auth/require-admin";

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function isValidUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const parsedUrl = new URL(value);

    return [
      "http:",
      "https:",
    ].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

export async function updateBusinessSettings(
  formData
) {
  const { user, supabase } =
    await requireAdmin();

  const { data: settings, error } =
    await supabase
      .from("business_settings")
      .select(`
        id,
        setting_key,
        value_type
      `);

  if (error) {
    console.error(
      "Error consultando configuración:",
      error
    );

    throw new Error(
      "No fue posible consultar la configuración."
    );
  }

  const updates = [];

  for (const setting of settings || []) {
    const value = normalizeValue(
      formData.get(setting.setting_key)
    );

    if (
      setting.value_type === "url" &&
      !isValidUrl(value)
    ) {
      throw new Error(
        `La URL de ${setting.setting_key} no es válida.`
      );
    }

    if (
      setting.value_type === "email" &&
      !isValidEmail(value)
    ) {
      throw new Error(
        `El correo de ${setting.setting_key} no es válido.`
      );
    }

    updates.push({
      id: setting.id,
      setting_value: value,
      updated_by: user.id,
    });
  }

  for (const update of updates) {
    const { error: updateError } =
      await supabase
        .from("business_settings")
        .update({
          setting_value:
            update.setting_value,
          updated_by:
            update.updated_by,
        })
        .eq("id", update.id);

    if (updateError) {
      console.error(
        "Error actualizando configuración:",
        {
          settingId: update.id,
          code: updateError.code,
          message:
            updateError.message,
          details:
            updateError.details,
          hint: updateError.hint,
        }
      );

      throw new Error(
        "No fue posible guardar todos los ajustes."
      );
    }
  }

  revalidatePath(
    "/admin/configuracion"
  );

  revalidatePath("/contacto");
  revalidatePath("/");
}