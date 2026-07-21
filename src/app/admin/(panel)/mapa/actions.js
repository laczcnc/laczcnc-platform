"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/core/auth/permissions";
import { requirePermission } from "@/core/auth/require-permission";
import { createClient } from "@/infrastructure/supabase/server";

const LOCATION_TYPES = [
  "prospect",
  "customer",
  "institution",
  "company",
  "business",
  "event",
  "workshop",
  "other",
];

const LOCATION_STATUSES = [
  "pending",
  "visited",
  "interested",
  "not_interested",
  "reschedule",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizeCoordinate(value) {
  const coordinate = Number(
    normalizeText(value)
  );

  return Number.isFinite(coordinate)
    ? coordinate
    : Number.NaN;
}

function revalidateMap() {
  revalidatePath("/admin/mapa");
  revalidatePath("/admin/dashboard");
}

export async function createMapLocation(
  formData
) {
  await requirePermission(PERMISSIONS.MAP_MANAGE);

  const name = normalizeText(
    formData.get("name")
  );

  const contactName = normalizeOptionalText(
    formData.get("contact_name")
  );

  const phone = normalizeOptionalText(
    formData.get("phone")
  );

  const organizationName =
    normalizeOptionalText(
      formData.get("organization_name")
    );

  const locationType = normalizeText(
    formData.get("location_type")
  );

  const latitude = normalizeCoordinate(
    formData.get("latitude")
  );

  const longitude = normalizeCoordinate(
    formData.get("longitude")
  );

  const address = normalizeOptionalText(
    formData.get("address")
  );

  const city = normalizeOptionalText(
    formData.get("city")
  );

  const district = normalizeOptionalText(
    formData.get("district")
  );

  const reference = normalizeOptionalText(
    formData.get("reference")
  );

  const notes = normalizeOptionalText(
    formData.get("notes")
  );

  const assignedTo = normalizeOptionalText(
    formData.get("assigned_to")
  );

  const nextVisitAt =
    normalizeOptionalText(
      formData.get("next_visit_at")
    );

  if (
    name.length < 2 ||
    name.length > 160
  ) {
    throw new Error(
      "El nombre debe tener entre 2 y 160 caracteres."
    );
  }

  if (
    !LOCATION_TYPES.includes(locationType)
  ) {
    throw new Error(
      "El tipo de ubicación no es válido."
    );
  }

  if (
    Number.isNaN(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "La latitud no es válida."
    );
  }

  if (
    Number.isNaN(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "La longitud no es válida."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("map_locations")
    .insert({
      name,
      contact_name: contactName,
      phone,
      organization_name:
        organizationName,
      location_type: locationType,
      status: "pending",
      latitude,
      longitude,
      address,
      city,
      district,
      reference,
      notes,
      assigned_to: assignedTo,
      next_visit_at: nextVisitAt,
      is_active: true,
    });

  if (error) {
    console.error(
      "Error creando marcador:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }
    );

    throw new Error(
      "No fue posible crear el marcador."
    );
  }

  revalidateMap();
}

export async function updateMapLocation(
  formData
) {
  await requirePermission(PERMISSIONS.MAP_MANAGE);

  const locationId = normalizeText(
    formData.get("location_id")
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

  const organizationName =
    normalizeOptionalText(
      formData.get("organization_name")
    );

  const locationType = normalizeText(
    formData.get("location_type")
  );

  const status = normalizeText(
    formData.get("status")
  );

  const address = normalizeOptionalText(
    formData.get("address")
  );

  const city = normalizeOptionalText(
    formData.get("city")
  );

  const district = normalizeOptionalText(
    formData.get("district")
  );

  const reference = normalizeOptionalText(
    formData.get("reference")
  );

  const notes = normalizeOptionalText(
    formData.get("notes")
  );

  const assignedTo = normalizeOptionalText(
    formData.get("assigned_to")
  );

  const nextVisitAt =
    normalizeOptionalText(
      formData.get("next_visit_at")
    );

  if (!locationId) {
    throw new Error(
      "No se recibió el marcador."
    );
  }

  if (
    name.length < 2 ||
    name.length > 160
  ) {
    throw new Error(
      "El nombre no es válido."
    );
  }

  if (
    !LOCATION_TYPES.includes(locationType)
  ) {
    throw new Error(
      "El tipo de ubicación no es válido."
    );
  }

  if (
    !LOCATION_STATUSES.includes(status)
  ) {
    throw new Error(
      "El estado no es válido."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("map_locations")
    .update({
      name,
      contact_name: contactName,
      phone,
      organization_name:
        organizationName,
      location_type: locationType,
      status,
      address,
      city,
      district,
      reference,
      notes,
      assigned_to: assignedTo,
      next_visit_at: nextVisitAt,
    })
    .eq("id", locationId);

  if (error) {
    console.error(
      "Error actualizando marcador:",
      error
    );

    throw new Error(
      "No fue posible actualizar el marcador."
    );
  }

  revalidateMap();
}

export async function changeMapLocationStatus(
  formData
) {
  const { profile } = await requirePermission(
    PERMISSIONS.MAP_MANAGE
  );

  const locationId = normalizeText(
    formData.get("location_id")
  );

  const currentStatus = normalizeText(
    formData.get("current_status")
  );

  const newStatus = normalizeText(
    formData.get("new_status")
  );

  const visitNotes = normalizeOptionalText(
    formData.get("visit_notes")
  );

  const nextVisitAt =
    normalizeOptionalText(
      formData.get("next_visit_at")
    );

  if (!locationId) {
    throw new Error(
      "No se recibió el marcador."
    );
  }

  if (
    !LOCATION_STATUSES.includes(newStatus)
  ) {
    throw new Error(
      "El nuevo estado no es válido."
    );
  }

  const now = new Date().toISOString();

  const supabase = await createClient();

  const { error: updateError } =
    await supabase
      .from("map_locations")
      .update({
        status: newStatus,
        last_visit_at:
          newStatus === "pending"
            ? null
            : now,
        next_visit_at:
          nextVisitAt || null,
      })
      .eq("id", locationId);

  if (updateError) {
    console.error(
      "Error registrando visita:",
      updateError
    );

    throw new Error(
      "No fue posible registrar la visita."
    );
  }

  const { error: eventError } =
    await supabase
      .from("map_visit_events")
      .insert({
        map_location_id: locationId,
        event_type: "visit_registered",
        previous_status: currentStatus,
        new_status: newStatus,
        notes: visitNotes,
        visited_at: now,
        next_visit_at: nextVisitAt,
        created_by: profile.id,
      });

  if (eventError) {
    console.error(
      "La visita cambió, pero no se registró el historial:",
      eventError
    );
  }

  revalidateMap();
}

export async function toggleMapLocation(
  formData
) {
  await requirePermission(PERMISSIONS.MAP_MANAGE);

  const locationId = normalizeText(
    formData.get("location_id")
  );

  const currentStatus =
    normalizeText(
      formData.get("current_status")
    ) === "true";

  if (!locationId) {
    throw new Error(
      "No se recibió el marcador."
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("map_locations")
    .update({
      is_active: !currentStatus,
    })
    .eq("id", locationId);

  if (error) {
    throw new Error(
      "No fue posible cambiar la visibilidad del marcador."
    );
  }

  revalidateMap();
}
