"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function revalidateWorkshops() {
  revalidatePath(
    "/admin/produccion/talleres"
  );
  revalidatePath("/admin/produccion");
  revalidatePath("/admin/dashboard");
}

export async function createWorkshop(
  formData
) {
  await requirePermission(PERMISSIONS.WORKSHOPS_MANAGE);

  const name = normalizeText(
    formData.get("name")
  );

  const contactName = normalizeOptionalText(
    formData.get("contact_name")
  );

  const phone = normalizeOptionalText(
    formData.get("phone")
  );

  const email = normalizeOptionalText(
    formData.get("email")
  );

  const specialty = normalizeOptionalText(
    formData.get("specialty")
  );

  const city = normalizeOptionalText(
    formData.get("city")
  );

  const address = normalizeOptionalText(
    formData.get("address")
  );

  const notes = normalizeOptionalText(
    formData.get("notes")
  );

  if (
    name.length < 2 ||
    name.length > 160
  ) {
    throw new Error(
      "El nombre del taller debe tener entre 2 y 160 caracteres."
    );
  }

  if (email && !isValidEmail(email)) {
    throw new Error(
      "El correo electrónico no tiene un formato válido."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("workshops")
    .insert({
      name,
      contact_name: contactName,
      phone,
      email,
      specialty,
      city,
      address,
      notes,
      is_active: true,
    });

  if (error) {
    console.error(
      "Error registrando taller:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "No fue posible registrar el taller."
    );
  }

  revalidateWorkshops();
}

export async function updateWorkshop(
  formData
) {
  await requirePermission(PERMISSIONS.WORKSHOPS_MANAGE);

  const workshopId = normalizeText(
    formData.get("workshop_id")
  );

  const name = normalizeText(
    formData.get("name")
  );

  const contactName = normalizeOptionalText(
    formData.get("contact_name")
  );

  const phone = normalizeOptionalText(
    formData.get("phone")
  );

  const email = normalizeOptionalText(
    formData.get("email")
  );

  const specialty = normalizeOptionalText(
    formData.get("specialty")
  );

  const city = normalizeOptionalText(
    formData.get("city")
  );

  const address = normalizeOptionalText(
    formData.get("address")
  );

  const notes = normalizeOptionalText(
    formData.get("notes")
  );

  if (!workshopId) {
    throw new Error(
      "No se recibió el identificador del taller."
    );
  }

  if (
    name.length < 2 ||
    name.length > 160
  ) {
    throw new Error(
      "El nombre del taller debe tener entre 2 y 160 caracteres."
    );
  }

  if (email && !isValidEmail(email)) {
    throw new Error(
      "El correo electrónico no tiene un formato válido."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("workshops")
    .update({
      name,
      contact_name: contactName,
      phone,
      email,
      specialty,
      city,
      address,
      notes,
    })
    .eq("id", workshopId);

  if (error) {
    console.error(
      "Error actualizando taller:",
      {
        workshopId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "No fue posible actualizar el taller."
    );
  }

  revalidateWorkshops();
}

export async function toggleWorkshopStatus(
  formData
) {
  await requirePermission(PERMISSIONS.WORKSHOPS_MANAGE);

  const workshopId = normalizeText(
    formData.get("workshop_id")
  );

  const currentStatus =
    normalizeText(
      formData.get("current_status")
    ) === "true";

  if (!workshopId) {
    throw new Error(
      "No se recibió el identificador del taller."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("workshops")
    .update({
      is_active: !currentStatus,
    })
    .eq("id", workshopId);

  if (error) {
    console.error(
      "Error cambiando estado del taller:",
      {
        workshopId,
        code: error.code,
        message: error.message,
      }
    );

    throw new Error(
      "No fue posible cambiar el estado del taller."
    );
  }

  revalidateWorkshops();
}
